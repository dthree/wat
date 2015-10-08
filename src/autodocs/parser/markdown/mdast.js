'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mdast = require('mdast');
const stripBadges = require('mdast-strip-badges');
const chalk = require('chalk');
const slug = require('sluggin').Sluggin;

// Default to parsing javascript.
let parser = require('./parser.javascript');

const exports = {

  parse: mdast.parse,

  stringify: mdast.stringify,

  sequenceAst(ast) {
    for (let i = 0; i < ast.children.length; ++i) {
      ast.children[i].sequence = i;
    }
    return ast;
  },

  language(lang) {
    try {
      parser = require(`./parser.${lang}`);
    } catch(e) {
      throw new Error(`Invalid language passed into ./autodocs/parser/markdown's .run command: ${lang}.`);
    }
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
    const curr = {}
    const res = [];
    let items = node.children;
    let depth = 100;
    let last;

    function getParentI(dpth) { // 1 (needs 0)
      for (var i = dpth - 1; i > -1; i--) {
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
          if (parentI !== undefined) {
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
          if (parentI !== undefined) {
            curr[parentI].fold.push(item);
          } else {
            res.push(item);
          }
        } else if (depth > lastDepth) {
          var parentI = getParentI(depth);
          curr[depth] = item;
          if (curr[parentI]) {
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

    // Assign parent nodes to the end.
    function assignParents(nd, parent) {
      if (parent) {
        nd.parent = parent;
      }
      for (let j = 0; j < nd.fold.length; ++j) {
        assignParents(nd.fold[j], nd);
      }
    }

    for (let i = 0; i < res.length; ++i) {
      assignParents(res[i]);
    }

    return res;
  },

  filterAPINodes(ast, repoNames) {
    const api = [];

    repoNames = repoNames.map(function(name){
      return String(name).trim().toLowerCase().replace(/(\W+)/g, '');
    });

    function getParentHeaders(nd, arr) {
      arr = arr || [];
      if (nd.parent) {
        let hdr = mdast.stringify(nd.parent);
        arr.push(hdr);
        return getParentHeaders(nd.parent, arr);
      } else {
        return arr;
      }
    }

    function loop(obj, lvl, parent) {
      for (let i = 0; i < obj.length; ++i) {
        let item = obj[i];
        item.parentHeaders = getParentHeaders(item, []);
        if (parent) {
          item.parent = parent;
        }

        if (item.type === 'heading') {
          let headerString = mdast.stringify(item);
          let content = ''; //(item.junk.length > 0) ? mdast.stringify(item.junk) : '';
          let isAPI = parser.isCommandSyntax(headerString, item);
          if (isAPI) {
            let syntax = parser.parseCommandSyntax(headerString);
            let formatted = parser.stringifyCommandSyntax(syntax);
            item.syntax = syntax;
            item.formatted = formatted;
            item.original = headerString;
            item.content = content;

            if (item.syntax && _.isArray(item.syntax.parents)) {
              let first = String(item.syntax.parents[0]).trim().toLowerCase().replace(/(\W+)/g, '');
              // If we match on any of the name aliases for the repo, 
              // don't count that as a parent object in the syntax.
              // i.e. `chalk.red` should just become `.red`.
              if (repoNames.indexOf(first) > -1) {
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
    const anchors = /<a\b[^>]*>((.|\n|\r\n)*?)<\/a>/gi;
    const bolds = /<b>(.*?)<\/b>/gi;
    const strikethroughs = /<s>((.|\n|\r\n)*?)<\/s>/gi;
    const breaks = /<br>/gi;
    const comments = /<!--((.|\n|\r\n)*?)-->/gi;
    const mdlink = /\[(.*?)\]\((.*?)\)/g;
    const images = /<img ((.|\n|\r\n)*?)>/gi;
    const italics = /<i>((.|\n|\r\n)*?)<\/i>/gi;
    md = md.replace(anchors, '$1');
    md = md.replace(bolds, '**$1**');
    md = md.replace(images, '');
    md = md.replace(mdlink, '$1');
    md = md.replace(breaks, '');
    md = md.replace(comments, '');
    md = md.replace(strikethroughs, '$1');
    md = md.replace(italics, '*$1*');
    return md;
  },

  buildDocPaths(nodes, rootName) {
    // Make sure we don't end with a '/',
    // as that would wind up with '//' later on.
    rootName = (rootName[rootName.length - 1] === '/') ? 
      rootName.slice(0, rootName.length - 1) : 
      rootName;
    const tree = {}
    for (let i = 0; i < nodes.length; ++i) {
      let fold = nodes[i].fold;
      let dir = `${rootName}`;
      let name;
      if (nodes[i].syntax) {
        name = nodes[i].syntax.name;
      } else {
        name = String(slug(mdast.stringify(nodes[i]))).trim();
      }
      let path = `${dir}/${name}`;
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

  /**
   * Builds a JSON object defining 
   * properties and methods based on the
   * API AST nodes.
   * 
   * @param {Array} api
   * @return {Object} config
   * @api public 
   */

  buildAPIConfig(api) {
    let config = {}
    const map = {
      'method': 'methods',
      'property': 'properties'
    };
    for (let i = 0; i < api.length; ++i) {
      let cmd = api[i];
      let apiPath = cmd.apiPath;
      if (apiPath) {
        let parts = String(apiPath).split('/');
        parts = parts.slice(3, parts.length);
        parts = parts.join('/');
        let type = map[cmd.syntax.type] || 'unknown';
        config[type] = config[type] || [];
        config[type].push(parts);
      }
    }
    return config;
  },

  /**
   * Builds a JSON object defining 
   * the sequencing of all doc sets.
   * 
   * @param {Array} api
   * @return {Object} config
   * @api public 
   */

  buildDocConfig(api, repoName) {
    function loop(apix, resx) {
      resx = resx || [];
      for (let i = 0; i < apix.length; ++i) {
        let path = String(apix[i].docPath).split(`${repoName}/`);
        if (path.length > 0) {
          path.shift();
        }
        path = path.join(`${repoName}/`);
        resx.push([path, apix[i].sequence]);
        if (apix[i].fold) {
          resx = loop(apix[i].fold, resx);
        }
      }
      return resx;
    }
    let res = [];
    res = loop(api, res);
    let ctr = 0;
    let obj = {}
    res.sort(function (a, b) {
      return a[1] - b[1];
    }).map(function (str) {
      obj[str[0]] = ctr;
      ctr++;
    });

    return obj;
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
