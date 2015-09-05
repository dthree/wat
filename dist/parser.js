'use strict';

/**
 * Module dependencies.
 */

var stripBadges = require('mdast-strip-badges');
var javascript = require('./parser.javascript');
var mdast = require('./parser.mdast');
var chalk = require('chalk');
var fs = require('fs');

var parser = {

  javascript: javascript,

  mdast: mdast,

  scaffold: function scaffold(name, options) {

    //spider.github.testPage();
    var file = options.files[0];
    var path = __dirname + file;

    var md = undefined;
    try {
      md = require('fs').readFileSync(path, { encoding: 'utf-8' });
    } catch (e) {
      console.log(e);
    }

    this.mdast.language('javascript');

    var repoOwner = undefined;
    var repoName = name;

    var ast = this.mdast.parse(md);
    var urls = this.mdast.getUrlsFromAst(ast);
    var repoUrls = this.mdast.filterUrlsByGithubRepo(urls, repoOwner, repoName);
    var headers = this.mdast.groupByHeaders(ast);

    //console.log(headers[8])

    var api = this.mdast.filterAPINodes(headers, repoName);
    api = this.mdast.buildAPIPaths(api, repoName);

    //console.log(api);

    this.writeAPI(api);
    //console.log(urls);
    //console.log(chalk.yellow(repoUrls));

    //let result = mdast().use(stripBadges).use(attacher);
    //console.log(ast);
    //let results = md.process(md);
    //console.log('results', results);
    //return results;
  },

  writeAPI: function writeAPI(api) {

    for (var i = 0; i < api.length; ++i) {

      if (!api[i].path) {
        continue;
      }

      var path = String(api[i].path);
      var parts = path.split('/');
      var file = parts.pop();
      var dir = parts.join('/');

      var dirExists = undefined;
      try {
        fs.statSync(dir);
      } catch (e) {}

      console.log(dir, file);
      console.log(dirExists);
    }
  },

  mkdirSafe: function mkdirSafe(dir) {

    var dirExists = undefined;
    try {
      fs.statSync(dir);
    } catch (e) {}

    if (!dirExists) {
      var parts = dir.split('/');
      parts.pop();
      var newDir = parts.join('/');
      return this.mkdirSafe(newDir);
    }

    try {
      fs.mkdirSync(dir);
    } catch (e) {
      console.log('wtf');
      console.log(e.stack);
    }

    return this;
  }

};

module.exports = parser;