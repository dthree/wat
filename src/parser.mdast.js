'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mdast = require('mdast');
const stripBadges = require('mdast-strip-badges');
const chalk = require('chalk');
const slug = require('sluggin').Sluggin;


let parser = require('./parser.javascript');

const exports = {

  parse: mdast.parse,

  stringify: mdast.stringify,

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
          //urls.push(href);
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
    //console.log('##########################')
    const curr = {}
    const res = [];
    let items = node.children;
    let depth = 100;
    let last;

    function getParentI(dpth) { // 1 (needs 0)
      for (var i = dpth - 1; i > -1; i--) {
        //console.log(chalk.cyan('GPI: ' + i), curr[i]);
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
        //console.log(chalk.magenta(mdast.stringify(item), 'Depth: ' + depth, 'LastDepth: ' + lastDepth));
        ////console.log(curr);
        if (depth < lastDepth) {
          var parentI = getParentI(depth);
          if (parentI !== undefined) {
            //console.log('A: Parent');
            curr[parentI].fold.push(item);
            curr[depth] = item;
            for (var j = depth + 1; j < 6; ++j) {
              delete curr[j];
            }
          } else {
            // If no parent, push to top.
            //console.log('A: No Parent');
            res.push(item);
            for (var j = 0; j < 6; ++j) {
              delete curr[j];
            }
            curr[depth] = item;
          }
        } else if (depth === lastDepth) {
          curr[depth] = item;
          var parentI = getParentI(depth);
          if (parentI !== undefined) {
            //console.log('B: Parent');
            curr[parentI].fold.push(item);
          } else {
            //console.log('B: No Parent');
            //console.log((curr[0]) ? '0: ' + mdast.stringify(curr[0]) : '' );
            //console.log((curr[1]) ? '1: ' + mdast.stringify(curr[1]) : '' );
            ////console.log('Appending to Current: ' + mdast.stringify(curr[parentI]));
            ////console.log('Current')
            res.push(item);
          }
        } else if (depth > lastDepth) {
          var parentI = getParentI(depth);
          curr[depth] = item;
          if (curr[parentI]) {
            //console.log('C: Appending to ' + parentI);
            curr[parentI].fold.push(item);
          } else {
            //console.log('WTF');
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

  stripHTML(md) {
    const anchors = /<a\b[^>]*>(.*?)<\/a>/ig;
    const bolds = /<b>(.*?)<\/b>/ig;
    const italics = /<i>(.*?)<\/i>/ig;
    md = md.replace(anchors, '$1');
    md = md.replace(bolds, '**$1**');
    md = md.replace(italics, '*$1*');
    return md;
  },

  buildDocPaths(nodes, rootName) {

    //return;

    const tree = {}
    for (let i = 0; i < nodes.length; ++i) {
      let fold = nodes[i].fold;
      let dir = `${rootName}`;
      let name = String(slug(mdast.stringify(nodes[i]))).trim();
      let path = `${dir}/${name}`;
      //console.log(path);
      nodes[i].docPath = path;
      if (nodes[i].fold.length > 0) {
        nodes[i].fold = this.buildDocPaths(nodes[i].fold, path);
      }
    }
    return nodes;
  },

  buildAPIPaths(api, repoName) {
    const tree = {}
    for (let i = 0; i < api.length; ++i) {
      let parent;
      if (api[i].parent) {
        try {
          parent = mdast.stringify(api[i].parent);
        } catch(e) {
          console.log('Error parsing parent.', api[i].parent);
          console.log(e);
        }
      }
      let children = api[i].children;

      let parentPath = (api[i].syntax.parents || []).join('/');
      parentPath = (parentPath !== '') ? '/' + parentPath  : parentPath;

      let dir = `/autodocs/${repoName}`;
      let path = `${dir}${parentPath}/${api[i].syntax.name}`;

      api[i].apiPath = path;

      tree[parentPath] = tree[parentPath] || 0;
      tree[parentPath]++;

      for (let j = 0; j < api[i].junk.length; ++j) {
        let it = mdast.stringify(api[i].junk[j]);
      }
    }
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
