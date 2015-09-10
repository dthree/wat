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
var pathx = require('path');
var os = require('os');
var _ = require('lodash');
var rimraf = require('rimraf');

var parser = {

  javascript: javascript,

  mdast: mdast,

  scaffold: function scaffold(name, options, callback) {
    callback = callback || {};
    options = options || {};
    var self = this;
    var urls = options.urls;
    var lang = options.language || 'javascript';
    var repoName = String(name).trim();

    var results = {};
    var errors = [];

    if (!repoName) {
      callback();
      return;
    }

    // If crawl is set to true, the parser
    // will crawl the given readme files for additional
    // markdown urls.
    var crawl = options.crawl || false;

    // Set appropriate parsing language.
    this.mdast.language(lang);

    var tree = {};
    var final = {};
    var finalAPI = [];
    var finalDocs = [];

    function traverse(node, path) {
      path = path || '';
      for (var item in node) {
        var fullPath = path !== '' ? path + '/' + item : String(item);
        if (_.isObject(node[item])) {
          traverse(node[item], fullPath);
        } else {
          tree[fullPath] = node[item];
        }
      }
    }
    traverse(urls);

    var done = 0;
    var total = Object.keys(tree).length;
    function doneHandler() {
      done++;
      //console.log(done, total)
      if (options.onFile) {
        options.onFile.call(undefined, {
          total: total,
          downloaded: done
        });
      }
      if (done >= total) {
        parse();
      }
    }

    function fetchOne(key, value) {
      //console.log('Fetching', value);
      util.fetchRemote(value, function (err, data) {
        if (!err) {
          results[key] = data;
        } else {
          errors.push(err);
        }
        doneHandler();
      });
    }

    for (var url in tree) {
      fetchOne(url, tree[url]);
    }

    var autoDocPath = __dirname + '/../autodocs/' + repoName;
    try {
      rimraf.sync(autoDocPath);
    } catch (e) {}

    function parse() {
      for (var result in results) {

        var md = results[result];
        md = self.mdast.stripHTML(md);

        var ast = self.mdast.parse(md);
        var _urls = self.mdast.getUrlsFromAst(ast);
        var repoUrls = self.mdast.filterUrlsByGithubRepo(_urls, undefined, repoName);
        var headers = self.mdast.groupByHeaders(ast);

        var api = self.mdast.filterAPINodes(headers, repoName);
        api = self.mdast.buildAPIPaths(api, repoName);

        var docs = self.mdast.buildDocPaths(headers, '/autodocs/' + repoName + '/' + result);

        finalAPI = finalAPI.concat(api);
        finalDocs = finalDocs.concat(docs);

        final[result] = {
          api: api,
          docs: docs,
          headers: headers,
          urls: _urls
        };
      }

      self.writeDocs(finalDocs);
      self.writeAPI(finalAPI);

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
        */
  },

  writeDocs: function writeDocs(docs) {

    for (var i = 0; i < docs.length; ++i) {
      if (!docs[i].path) {
        continue;
      }

      var temp = pathx.join(os.tmpdir(), '/.wat/.local');
      var path = String(docs[i].path);
      var parts = path.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var fileAddon = docs[i].fold.length > 0 ? '/' + file : '';
      var dir = __dirname + '/..' + directory;
      var tempDir = temp + directory;

      console.log(dir + fileAddon);
      console.log(tempDir + fileAddon);

      util.mkdirSafe(dir + fileAddon);
      util.mkdirSafe(tempDir + fileAddon);

      console.log('Making Dir: ', dir + fileAddon);

      docs[i].junk = docs[i].junk || [];
      var content = mdast.stringify(docs[i]);
      var fullPath = docs[i].fold.length > 0 ? '/' + file + '/' + 'index.md' : '/' + file + '.md';
      console.log('writing', fullPath);
      fs.writeFileSync(dir + fullPath, content);
      fs.writeFileSync(tempDir + fullPath, content);
      for (var j = 0; j < docs[i].junk.length; ++j) {
        var ch = docs[i].junk[j];
        var str = mdast.stringify(ch);
        //console.log(str);
      }

      if (docs[i].fold.length > 0) {
        this.writeDocs(docs[i].fold);
      }
    }
  },

  writeAPI: function writeAPI(api) {

    for (var i = 0; i < api.length; ++i) {
      if (!api[i].path) {
        continue;
      }

      var temp = pathx.join(os.tmpdir(), '/.wat/.local');

      var path = String(api[i].path);
      var parts = path.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var dir = __dirname + '/..' + directory;
      var tempDir = temp + directory;

      util.mkdirSafe(dir);
      util.mkdirSafe(tempDir);

      //console.log(dir);
      //console.log(tempDir);

      var codeSampleFound = false;
      var basicText = '## ' + api[i].formatted + '\n\n';
      var detailText = basicText;
      var lineX = 2;
      var lineXBasic = 2;

      for (var j = 0; j < api[i].junk.length; ++j) {
        var item = api[i].junk[j];
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
      }

      // If detail has no more content than
      // basic, just get rid of it.
      if (lineX === lineXBasic) {
        detailText = '';
      }

      try {
        fs.writeFileSync(tempDir + '/' + file + '.md', basicText, 'utf-8');
        fs.writeFileSync(dir + '/' + file + '.md', basicText, 'utf-8');
        if (detailText !== '') {
          fs.writeFileSync(tempDir + '/' + file + '.detail.md', detailText, 'utf-8');
          fs.writeFileSync(dir + '/' + file + '.detail.md', detailText, 'utf-8');
        }
      } catch (e) {
        throw new Error(e);
      }

      //console.log(dir, file);
    }
  }

};

module.exports = parser;