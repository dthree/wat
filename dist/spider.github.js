'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var util = require('./util');
var moment = require('moment');
var chalk = require('chalk');
var mdast = require('mdast');

function attacher(mdast, options) {

  function transformer(node) {

    //console.log(node);

    var items = node.children;

    for (var i = 0; i < items.length; ++i) {

      console.log(items[i]);
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

    var details = this.parseSearchLink(searchResult);
    var readmeUrl = this.getRepoReadmeUrl(details);

    function request(urls, cb) {
      var url = urls.shift();
      if (url) {
        util.fetchRemote(url, function (err, data) {
          var results = undefined;
          if (!err) {

            var md = mdast().use(attacher);

            results = md.process(data);

            //results = self.parent.cosmetician.markdownToTerminal(data, {lineWidth: (process.stdout.columns - 2)});
            cb(undefined, String(results).slice(0, 300));
          } else {
            request(urls, cb);
          }
        });
      } else {
        cb('Not found.');
      }
    }

    request([readmeUrl.upper, readmeUrl.lower, readmeUrl.title], callback);
  },

  parseSearchLink: function parseSearchLink(obj) {
    var res = String(obj.link).split('//github.com/')[1];
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
        lower: 'https://raw.githubusercontent.com/' + repo.owner + '/' + repo.name + '/master/readme.md'
      };
    }
    return result;
  }

};

module.exports = github;