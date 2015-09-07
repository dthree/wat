'use strict';

/**
 * Module dependencies.
 */

const stripBadges = require('mdast-strip-badges');
const javascript = require('./parser.javascript');
const mdast = require('./parser.mdast');  
const util = require('./util');
const chalk = require('chalk');
const fs = require('fs');

const parser = {

  javascript,

  mdast,

  scaffold(name, options, callback) {
    callback = callback || {};
    const self = this;
    const urls = options.urls;
    const lang = options.language || 'javascript';

    // If crawl is set to true, the parser
    // will crawl the given readme files for additional
    // markdown urls.
    const crawl = options.crawl || false;

    // Set appropriate parsing language.
    this.mdast.language(lang);

    const repoName = name;

    const results = {}
    const errors = [];

    let done = 0;
    function doneHandler() {
      done++;
      if (done >= urls.length) {
        parse();
      }
    }

    function fetchOne(url) {
      util.fetchRemote(url, function (err, data) {
        if (!err) {
          results[url] = data;
        } else {
          errors.push(err);
        }
        doneHandler();
      })
    }

    for (let i = 0; i < urls.length; ++i) {
      fetchOne(urls[i]);
    }

    function parse() {
      for (const result in results) {
        console.log('res', result);
      }
      callback();
    }


    /*
    const path = __dirname + file;
    let md;
    try {
      md = require('fs').readFileSync(path, { encoding: 'utf-8' });
    } catch(e) {
      console.log(e);
    }
    */
/*
    const ast = this.mdast.parse(md);
    const urls = this.mdast.getUrlsFromAst(ast);
    const repoUrls = this.mdast.filterUrlsByGithubRepo(urls, repoOwner, repoName);
    const headers = this.mdast.groupByHeaders(ast);
    
    let api = this.mdast.filterAPINodes(headers, repoName);
    api = this.mdast.buildAPIPaths(api, repoName);

    this.writeAPI(api);
    */
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

      util.mkdirSafe(dir);

      let codeSampleFound = false;
      let basicText = '';
      let detailText = '';
      let lineX = 0;
      let lineXBasic = 0;

      for (let j = 0; j < api[i].junk.length; ++j) {

        let item = api[i].junk[j];

        //console.log(item)
        //for (let bing in item.position) {
          //console.log(bing, item.position[bing]);
        //}
        let lines = item.position.end.line - item.position.start.line + 1;
        let content = mdast.stringify(item) + '\n\n';
        let isCode = (item.type === 'code');

        lineX += lines;

        let basic;
        if (lineX <= 20) {
          basic = true;
        } else if ((lineX - lines) > 10 && codeSampleFound) {
          basic = false;
        } else if (lineX > 20 && !codeSampleFound && isCode && lineX < 40) {
          basic = true;
        }

        if (basic) {
          lineXBasic = lineX;
          basicText += content;
        }
        detailText += content;

        if (isCode) {
          codeSampleFound = true;
        }

        //console.log(chalk.blue('Lines: ', lines));
        //console.log(item.type)
        //console.log(content);
      }

      // If detail has no more content than
      // basic, just get rid of it.
      if (lineX === lineXBasic) {
        detailText = '';
      }

      console.log(chalk.magenta(basicText));
      console.log(chalk.yellow(detailText));

      try {
        fs.writeFileSync(dir + '/' + file + '.md', basicText, 'utf-8');
        if (detailText !== '') {
          fs.writeFileSync(dir + '/' + file + '.detail.md', detailText, 'utf-8');
        }
      } catch(e) {
        throw new Error(e);
      }

      console.log(dir, file);
      //console.log(dirExists);

    }

  },

};

module.exports = parser;
