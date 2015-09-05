'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mdast = require('mdast');
const stripBadges = require('mdast-strip-badges');
const chalk = require('chalk');

let parser = require('./parser.javascript');

const exports = {

  parse: mdast.parse,

  language(lang) {
    parser = require(`./parser.${lang}`);
  },

  getUrlsFromAst(node, repo) {
    repo = repo || {}
    let urls = [];
    function getURLs(nodes) {
      for (let i = 0; i < nodes.length; ++i) {
        if (nodes[i].type === 'link') {
          const href = util.cleanLink(nodes[i].href);
          if (href === '') { 
            continue;
          }
          urls.push(href);
        }
        if (nodes[i].children && nodes[i].children.length > 0) {
          getURLs(nodes[i].children);
        }
      }
    }
    getURLs(node.children);
    urls = _.uniq(urls);
    return urls;
  },

  filterUrlsByGithubRepo(urls, repoOwner, repoName) {
    const result = [];
    for (let i = 0; i < urls.length; ++i) {
      let url = urls[i];
      const githubLink = util.parseGithubLink(url);
      const isSameRepo = (githubLink && (!repoOwner || githubLink.owner === repoOwner) && (!repoName || githubLink.name === repoName));
      const isLocalLink = util.isLocalLink(url);
      const isMd = util.isMarkdownLink(url);
      if (!isLocalLink && isSameRepo && isMd) {
        if (url.indexOf('/issues/') === -1) {
          result.push(url);
        }
      } else if (isLocalLink && isMd) {
        result.push(url);
      }
    }
    return result;
  },

  groupByHeaders(node) {
    const curr = {}
    const res = [];
    let items = node.children;
    let depth = 100;
    let last;

    function getParentI(dpth) {
      for (var i = dpth - 1; i > -1; --i) {
        if (curr[i]) {
          return i;
        }
      }
    }

    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      item.fold = item.fold || [];
      item.junk = item.junk || [];
      if (item.type === 'heading') {
        last = item;
        var lastDepth = depth;
        depth = item.depth - 1;
        if (depth < lastDepth) {
          var parentI = getParentI(depth);
          if (parentI) {
            curr[parentI].fold.push(item);
            curr[depth] = item;
            for (var j = depth + 1; j < 6; ++j) {
              delete curr[j];
            }
          } else {
            // If no parent, push to top.
            res.push(item);
            for (var j = 0; j < 6; ++j) {
              delete curr[j];
            }
            curr[depth] = item;
          }
        } else if (depth === lastDepth) {
          curr[depth] = item;
          var parentI = getParentI(depth);
          if (parentI) {
            curr[parentI].fold.push(item);
          } else {
            res.push(item);
          }
        } else if (depth > lastDepth) {
          if (curr[lastDepth]) {
            curr[lastDepth].fold.push(item);
          } else {
            //console.log(chalk.cyan(mdast.stringify(items[i])));
            //console.log(chalk.magenta('WTF'));
            //console.log(depth, lastDepth);
            //console.log(item);
            //console.log(curr[1])
            console.log('Wtf');
          }
        }
      } else {
        // Warning: if an item isn't under a
        // header, we're just throwing it away...
        if (last) {
          last.junk.push(item);
        }
      }
    }
    return res;
  },

  filterAPINodes(ast, repoName) {
    const api = [];
    const repo = String(repoName).trim().toLowerCase().replace(/(\W+)/g, '');

    function loop(obj, lvl, parent) {
      for (let i = 0; i < obj.length; ++i) {
        //console.log(obj[i])
        let item = obj[i];
        if (parent) {
          item.parent = parent;
        }
        if (item.type === 'heading') {
          let headerString = mdast.stringify(item);
          let content = ''; //(item.junk.length > 0) ? mdast.stringify(item.junk) : '';
          let isAPI = parser.isCommandSyntax(headerString);
          if (isAPI) {
            let syntax = parser.parseCommandSyntax(headerString);
            let formatted = parser.stringifyCommandSyntax(syntax);
            item.syntax = syntax;
            item.formatted = formatted;
            item.original = headerString;
            item.content = content;

            if (item.syntax && _.isArray(item.syntax.parents)) {
              let first = String(item.syntax.parents[0]).trim().toLowerCase().replace(/(\W+)/g, '');
              if (first === repo) {
                item.syntax.parents.shift();
              }
            }

            api.push(item);
          }
        }
        loop(item.fold, lvl + 1, item);
      }
    }
    loop(ast, 0);

    return api;

  },

  buildAPIPaths(api, repoName) {
    //console.log(api);

    const tree = {}

    for (var i = 0; i < api.length; ++i) {
      console.log(chalk.cyan(api[i].original));
      console.log(api[i].formatted);
      console.log(api[i].syntax);
      //console.log(api[i].parents);

      let parent = mdast.stringify(api[i].parent);
      let children = api[i].children;
      //console.log(api[i])
      //console.log('||' + parent);
      //console.log('##' + child);
      //console.log(api[i]);


      let parentPath = (api[i].syntax.parents || []).join('/');
      parentPath = (parentPath !== '') ? '/' + parentPath  : parentPath;

      var dir = __dirname + '/docs/auto.' + repoName;
      var path = dir + parentPath + '/' + api[i].syntax.name;

      api[i].path = path;

      tree[parentPath] = tree[parentPath] || 0;
      tree[parentPath]++;

      for (var j = 0; j < api[i].junk.length; ++j) {
        var it = mdast.stringify(api[i].junk[j]);
        //console.log(chalk.yellow(it) + '\n');
      }
      console.log(' ');
    }

    console.log(tree)
    
    return api;

  },

};

const util = {

  parseGithubLink(url) {
    let res = String(url).split('//github.com/')[1];
    let result = {};
    if (res) {
      let parts = String(res).split('/') || [];
      let owner = parts[0];
      let name = parts[1];
      if (owner && name) {
        result = { owner, name };
      }
    }
    return result;
  },

  isMarkdownLink(str) {
    let parts = String(str).split('.');
    let last = parts[parts.length-1];
    return (last.toLowerCase() === 'md');
  },

  isLocalLink(str) {
    const keywords = ['https://', 'http://', '.com', '.net', '.io'];
    let local = true;
    let url = String(str).toLowerCase();
    for (let i = 0; i < keywords.length; ++i) {
      if (url.indexOf(keywords[i]) > -1) {
        local = false;
        break;
      }
    }
    return local;
  },

  cleanLink(str) {
    let url = String(str);
    let hashIdx = String(url).indexOf('#');
    if (hashIdx > -1) {
      url = url.slice(0, hashIdx);
    }
    let qIdx = String(url).indexOf('?');
    if (qIdx > -1) {
      url = url.slice(0, qIdx);
    }
    return String(url).trim();
  }

}

module.exports = exports;
