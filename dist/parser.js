'use strict';

/**
 * Module dependencies.
 */

var stripBadges = require('mdast-strip-badges');
var javascript = require('./parser.javascript');
var mdast = require('./parser.mdast');
var util = require('./util');
var chalk = require('chalk');
var fs = require('fs');

var parser = {

  javascript: javascript,

  mdast: mdast,

  scaffold: function scaffold(name, options, callback) {
    callback = callback || {};
    var self = this;
    var urls = options.urls;
    var lang = options.language || 'javascript';

    // If crawl is set to true, the parser
    // will crawl the given readme files for additional
    // markdown urls.
    var crawl = options.crawl || false;

    // Set appropriate parsing language.
    this.mdast.language(lang);

    var repoName = name;

    var results = {};
    var errors = [];

    var done = 0;
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
      });
    }

    for (var i = 0; i < urls.length; ++i) {
      fetchOne(urls[i]);
    }

    function parse() {
      for (var result in results) {
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

  writeAPI: function writeAPI(api) {

    for (var i = 0; i < api.length; ++i) {
      if (!api[i].path) {
        continue;
      }

      var path = String(api[i].path);
      var parts = path.split('/');
      var file = parts.pop();
      var dir = parts.join('/');

      util.mkdirSafe(dir);

      var codeSampleFound = false;
      var basicText = '';
      var detailText = '';
      var lineX = 0;
      var lineXBasic = 0;

      for (var j = 0; j < api[i].junk.length; ++j) {

        var item = api[i].junk[j];

        //console.log(item)
        //for (let bing in item.position) {
        //console.log(bing, item.position[bing]);
        //}
        var lines = item.position.end.line - item.position.start.line + 1;
        var content = mdast.stringify(item) + '\n\n';
        var isCode = item.type === 'code';

        lineX += lines;

        var basic = undefined;
        if (lineX <= 20) {
          basic = true;
        } else if (lineX - lines > 10 && codeSampleFound) {
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
      } catch (e) {
        throw new Error(e);
      }

      console.log(dir, file);
      //console.log(dirExists);
    }
  }

};

module.exports = parser;