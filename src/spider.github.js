'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const util = require('./util');
const moment = require('moment');
const chalk = require('chalk');
const mdast = require('mdast');


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

const github = {

  init(parent) {
    this.parent = parent;
  },

  getPage(searchResult, callback) {
    callback = callback || {};
    const self = this;

    let details = this.parseSearchLink(searchResult);
    let readmeUrl = this.getRepoReadmeUrl(details);

    function request(urls, cb) {
      let url = urls.shift();
      if (url) {
        util.fetchRemote(url, function (err, data) {
          let results;
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

  parseSearchLink(obj) {
    let res = String(obj.link).split('//github.com/')[1];
    let result;
    if (res) {
      let parts = String(res).split('/');
      let owner = parts[0];
      let name = parts[1];
      if (owner && name) {
        result = { owner, name };
      }
    }
    return result;
  },

  getRepoReadmeUrl(repo) {
    let result;
    if (repo) {
      result = {
        upper: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/README.md`,
        title: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/Readme.md`,
        lower: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/readme.md`
      }
    }
    return result;
  },

};

module.exports = github;
