'use strict';

/**
 * Module dependencies.
 */

const stripBadges = require('mdast-strip-badges');
const javascript = require('./parser.javascript');
const mdast = require('./parser.mdast');  
const chalk = require('chalk');
const fs = require('fs');

const parser = {

  javascript,

  mdast,

  scaffold(name, options) {

        //spider.github.testPage();
    const file = options.files[0];
    const path = __dirname + file;

    let md;
    try {
      md = require('fs').readFileSync(path, { encoding: 'utf-8' });
    } catch(e) {
      console.log(e);
    }

    this.mdast.language('javascript');

    let repoOwner;
    let repoName = name;

    const ast = this.mdast.parse(md);
    const urls = this.mdast.getUrlsFromAst(ast);
    const repoUrls = this.mdast.filterUrlsByGithubRepo(urls, repoOwner, repoName);
    const headers = this.mdast.groupByHeaders(ast);
    
    //console.log(headers[8])

    let api = this.mdast.filterAPINodes(headers, repoName);
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

  writeAPI(api) {

    for (var i = 0; i < api.length; ++i) {

      if (!api[i].path) {
        continue;
      }

      var path = String(api[i].path);
      var parts = path.split('/');
      var file = parts.pop();
      var dir = parts.join('/');

      let dirExists;
      try {
        fs.statSync(dir);
      } catch(e) {

      }

      console.log(dir, file);
      console.log(dirExists);

    }

  },

  mkdirSafe(dir) {

    let dirExists;
    try {
      fs.statSync(dir);
    } catch(e) {}

    if (!dirExists) {
      const parts = dir.split('/');
      parts.pop();
      const newDir = parts.join('/');
      return this.mkdirSafe(newDir);
    }

    try {
      fs.mkdirSync(dir);
    } catch(e) {
      console.log('wtf');
      console.log(e.stack);
    }

    return this;
  },

};

module.exports = parser;
