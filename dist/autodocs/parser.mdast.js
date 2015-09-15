'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var mdast = require('mdast');
var stripBadges = require('mdast-strip-badges');
var chalk = require('chalk');
var slug = require('sluggin').Sluggin;

// Default to parsing javascript.
var parser = require('./parser.javascript');

var _exports = {

  parse: mdast.parse,

  stringify: mdast.stringify,

  language: function language(lang) {
    parser = require('./parser.' + lang);
  },

  getUrlsFromAst: function getUrlsFromAst(node, repo) {
    repo = repo || {};
    var urls = [];
    function getURLs(nodes) {
      for (var i = 0; i < nodes.length; ++i) {
        if (nodes[i].type === 'link') {
          var href = util.cleanLink(nodes[i].href);
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

  filterUrlsByGithubRepo: function filterUrlsByGithubRepo(urls, repoOwner, repoName) {
    var result = [];
    for (var i = 0; i < urls.length; ++i) {
      var url = urls[i];
      var githubLink = util.parseGithubLink(url);
      var isSameRepo = githubLink && (!repoOwner || githubLink.owner === repoOwner) && (!repoName || githubLink.name === repoName);
      var isLocalLink = util.isLocalLink(url);
      var isMd = util.isMarkdownLink(url);
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

  groupByHeaders: function groupByHeaders(node) {
    var curr = {};
    var res = [];
    var items = node.children;
    var depth = 100;
    var last = undefined;

    function getParentI(dpth) {
      // 1 (needs 0)
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
      for (var _j = 0; _j < nd.fold.length; ++_j) {
        assignParents(nd.fold[_j], nd);
      }
    }

    for (var _i = 0; _i < res.length; ++_i) {
      assignParents(res[_i]);
    }

    return res;
  },

  filterAPINodes: function filterAPINodes(ast, repoNames) {
    var api = [];

    repoNames = repoNames.map(function (name) {
      return String(name).trim().toLowerCase().replace(/(\W+)/g, '');
    });

    function getParentHeaders(_x, _x2) {
      var _again = true;

      _function: while (_again) {
        var nd = _x,
            arr = _x2;
        hdr = undefined;
        _again = false;

        arr = arr || [];
        if (nd.parent) {
          var hdr = mdast.stringify(nd.parent);
          arr.push(hdr);
          _x = nd.parent;
          _x2 = arr;
          _again = true;
          continue _function;
        } else {
          return arr;
        }
      }
    }

    function loop(obj, lvl, parent) {
      for (var i = 0; i < obj.length; ++i) {
        var item = obj[i];
        item.parentHeaders = getParentHeaders(item, []);
        if (parent) {
          item.parent = parent;
        }

        if (item.type === 'heading') {
          var headerString = mdast.stringify(item);
          var content = ''; //(item.junk.length > 0) ? mdast.stringify(item.junk) : '';
          var isAPI = parser.isCommandSyntax(headerString, item);
          if (isAPI) {
            var syntax = parser.parseCommandSyntax(headerString);
            var formatted = parser.stringifyCommandSyntax(syntax);
            item.syntax = syntax;
            item.formatted = formatted;
            item.original = headerString;
            item.content = content;

            if (item.syntax && _.isArray(item.syntax.parents)) {
              var first = String(item.syntax.parents[0]).trim().toLowerCase().replace(/(\W+)/g, '');
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

  stripHTML: function stripHTML(md) {
    var anchors = /<a\b[^>]*>(.*?)<\/a>/ig;
    var bolds = /<b>(.*?)<\/b>/ig;
    var breaks = /<br>/ig;
    var italics = /<i>(.*?)<\/i>/ig;
    md = md.replace(anchors, '$1');
    md = md.replace(bolds, '**$1**');
    md = md.replace(breaks, '');
    md = md.replace(italics, '*$1*');
    return md;
  },

  buildDocPaths: function buildDocPaths(nodes, rootName) {
    var tree = {};
    for (var i = 0; i < nodes.length; ++i) {
      var fold = nodes[i].fold;
      var dir = '' + rootName;
      var _name = undefined;
      if (nodes[i].syntax) {
        _name = nodes[i].syntax.name;
      } else {
        _name = String(slug(mdast.stringify(nodes[i]))).trim();
      }
      var path = dir + '/' + _name;
      nodes[i].docPath = path;
      if (nodes[i].fold.length > 0) {
        nodes[i].fold = this.buildDocPaths(nodes[i].fold, path);
      }
    }
    return nodes;
  },

  buildAPIPaths: function buildAPIPaths(api, repoName) {
    var tree = {};
    for (var i = 0; i < api.length; ++i) {
      var _parent = undefined;
      if (api[i].parent) {
        try {
          _parent = mdast.stringify(api[i].parent);
        } catch (e) {
          console.log('Error parsing parent.', api[i].parent);
          console.log(e);
        }
      }
      var children = api[i].children;

      var parentPath = (api[i].syntax.parents || []).join('/');
      parentPath = parentPath !== '' ? '/' + parentPath : parentPath;

      var dir = '/autodocs/' + repoName;
      var path = '' + dir + parentPath + '/' + api[i].syntax.name;

      api[i].apiPath = path;

      tree[parentPath] = tree[parentPath] || 0;
      tree[parentPath]++;

      for (var j = 0; j < api[i].junk.length; ++j) {
        var it = mdast.stringify(api[i].junk[j]);
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

  buildAPIConfig: function buildAPIConfig(api) {
    var config = {};
    var map = {
      'method': 'methods',
      'property': 'properties'
    };
    for (var i = 0; i < api.length; ++i) {
      var cmd = api[i];
      var apiPath = cmd.apiPath;
      if (apiPath) {
        var parts = String(apiPath).split('/');
        parts = parts.slice(3, parts.length);
        parts = parts.join('/');
        var type = map[cmd.syntax.type] || 'unknown';
        config[type] = config[type] || [];
        config[type].push(parts);
      }
    }
    return config;
  }

};

var util = {

  parseGithubLink: function parseGithubLink(url) {
    var res = String(url).split('//github.com/')[1];
    var result = {};
    if (res) {
      var parts = String(res).split('/') || [];
      var owner = parts[0];
      var _name2 = parts[1];
      if (owner && _name2) {
        result = { owner: owner, name: _name2 };
      }
    }
    return result;
  },

  isMarkdownLink: function isMarkdownLink(str) {
    var parts = String(str).split('.');
    var last = parts[parts.length - 1];
    return last.toLowerCase() === 'md';
  },

  isLocalLink: function isLocalLink(str) {
    var keywords = ['https://', 'http://', '.com', '.net', '.io'];
    var local = true;
    var url = String(str).toLowerCase();
    for (var i = 0; i < keywords.length; ++i) {
      if (url.indexOf(keywords[i]) > -1) {
        local = false;
        break;
      }
    }
    return local;
  },

  cleanLink: function cleanLink(str) {
    var url = String(str);
    var hashIdx = String(url).indexOf('#');
    if (hashIdx > -1) {
      url = url.slice(0, hashIdx);
    }
    var qIdx = String(url).indexOf('?');
    if (qIdx > -1) {
      url = url.slice(0, qIdx);
    }
    return String(url).trim();
  }

};

module.exports = _exports;