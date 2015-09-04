'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var util = require('./util');
var moment = require('moment');
var chalk = require('chalk');
var mdast = require('mdast');
var stripBadges = require('mdast-strip-badges');
var parser = require('./parser');

var currentRepo = undefined;

function assemble(items) {

  var header = [];
  var depth = 100;

  var curr = {};
  var last;
  var res = [];

  function getParentI(depth) {
    for (var i = depth - 1; i > -1; --i) {
      if (curr[i]) {
        return i;
      }
    }
  }

  var urls = [];

  function getURLs(nodes) {
    for (var _i = 0; _i < nodes.length; ++_i) {
      if (nodes[_i].type === 'link') {
        var href = github.cleanLink(nodes[_i].href);
        var isLocalLink = github.isLocalLink(href);
        var details = github.parseSearchLink(href);
        var isMd = github.isMarkdownLink(href);
        var isSameRepo = details && details.owner === currentRepo.owner && details.name === currentRepo.name;
        if (href === '') {
          continue;
        }

        if (!isLocalLink && isSameRepo && isMd) {
          if (href.indexOf('/issues/') === -1) {
            urls.push(href);
          }
        } else if (isLocalLink && isMd) {
          urls.push(href);
        }
      }
      if (nodes[_i].children && nodes[_i].children.length > 0) {
        getURLs(nodes[_i].children);
      }
    }
  }
  getURLs(items);
  urls = _.uniq(urls);

  console.log(urls);

  for (var i = 0; i < items.length; ++i) {

    var item = items[i];
    item.fold = item.fold || [];
    last = item;

    if (item.type === 'heading') {

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

        //console.log(item.children)

        curr[depth] = item;
        var parentI = getParentI(depth);
        if (parentI) {
          curr[parentI].fold.push(item);
        } else {
          res.push(item);
        }
      } else if (depth > lastDepth) {

        //console.log(item.depth - 1, ': ', item.children[0].value)
        if (curr[lastDepth]) {
          //console.log('pusing to ', curr[lastDepth])
          curr[lastDepth].fold.push(item);
        } else {
          console.log('WTFWTF');
        }
      }
    } else {
      last.fold.push(item);
    }
  }

  var api = [];
  var readme = [];

  var structure = [];

  function loop(obj, lvl) {
    var subheading = '';
    for (var i = 0; i < obj.length; ++i) {
      var _item = obj[i];

      if (_item.type === 'heading') {
        if (subheading != '') {
          //console.log(chalk.green(subheading));
          subheading = '';
        }
        var text = '';
        for (var j = 0; j < lvl; ++j) {
          text += ' ';
        }
        text += _item.children[0].value + ' (h' + _item.depth + ')';
        var stringer = mdast.stringify(_item);
        var syntax = parser.javascript.parseCommandSyntax(stringer);
        console.log(chalk.cyan(text));
        console.log(stringer);
        console.log(syntax);
      } else if (_item.type === 'paragraph') {
        subheading += mdast.stringify(_item).replace(/\n/g, ' ') + '\n';
      } else if (_item.type === '') {} else {
        subheading += mdast.stringify(_item) + '\n';
      }
      loop(_item.fold, lvl + 1);
    }
    if (subheading != '') {
      //console.log(chalk.green(subheading));
      subheading = '';
    }
  }
  loop(res, 0);

  return res;
};

function attacher(mdast, options) {

  function transformer(node) {

    //console.log(node);

    var items = node.children;

    var res = assemble(items);

    //console.log(res);

    for (var i = 0; i < items.length; ++i) {

      //console.log(items[i]); 
    }
  }

  return transformer;
}

var github = {

  init: function init(parent) {
    this.parent = parent;
  },

  getPage: function getPage(searchResult, callback) {
    callback = callback || {};
    var self = this;

    var details = this.parseSearchLink(searchResult.link);
    var readmeUrl = this.getRepoReadmeUrl(details);

    currentRepo = details;

    function request(urls, cb) {
      var url = urls.shift();
      if (url) {
        util.fetchRemote(url, function (err, data) {
          var results = undefined;
          if (!err) {

            var md = mdast().use(stripBadges).use(attacher);

            results = md.process(data);

            //results = self.parent.cosmetician.markdownToTerminal(data, {lineWidth: (process.stdout.columns - 2)});
            cb(undefined, String(results).slice(0, 0));
          } else {
            request(urls, cb);
          }
        });
      } else {
        cb('Not found.');
      }
    }

    request([readmeUrl.upper, readmeUrl.lower, readmeUrl.title, readmeUrl.out], callback);
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
  },

  parseSearchLink: function parseSearchLink(url) {
    var res = String(url).split('//github.com/')[1];
    var result = undefined;
    if (res) {
      var parts = String(res).split('/');
      var owner = parts[0];
      var _name = parts[1];
      if (owner && _name) {
        result = { owner: owner, name: _name };
      }
    }
    return result;
  },

  getRepoReadmeUrl: function getRepoReadmeUrl(repo) {
    var result = undefined;
    if (repo) {
      result = {
        upper: 'https://raw.githubusercontent.com/' + repo.owner + '/' + repo.name + '/master/README.md',
        title: 'https://raw.githubusercontent.com/' + repo.owner + '/' + repo.name + '/master/Readme.md',
        lower: 'https://raw.githubusercontent.com/' + repo.owner + '/' + repo.name + '/master/readme.md',
        out: 'https://raw.githubusercontent.com/' + repo.owner + '/' + repo.name + '/master/readme.markdown'
      };
    }
    return result;
  }

};

module.exports = github;