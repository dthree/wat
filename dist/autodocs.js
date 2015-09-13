'use strict';

/**
 * Module dependencies.
 */

var stripBadges = require('mdast-strip-badges');
var javascript = require('./autodocs.javascript');
var mdast = require('./autodocs.ast');
var util = require('./util');
var chalk = require('chalk');
var fs = require('fs');
var pathx = require('path');
var os = require('os');
var _ = require('lodash');
var rimraf = require('rimraf');

var autodocs = {

  javascript: javascript,

  mdast: mdast,

  scaffold: function scaffold(name, options, callback) {
    callback = callback || {};
    options = options || {};
    var self = this;
    var urls = options.urls;
    var lang = options.language || 'javascript';
    var aliases = options.aliases || [];
    var repoName = String(name).trim();
    var allNames = aliases;
    var results = {};
    var errors = [];

    allNames.push(repoName);

    if (!repoName) {
      throw new Error('No valid library name passed for autodocs.scaffold.');
    }

    // If crawl is set to true, the autodocs
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

    util.mkdirSafe(autoDocPath);

    function parse() {
      for (var result in results) {

        var md = results[result];
        md = self.mdast.stripHTML(md);

        var ast = self.mdast.parse(md);
        var _urls = self.mdast.getUrlsFromAst(ast);
        var repoUrls = self.mdast.filterUrlsByGithubRepo(_urls, undefined, repoName);
        var headers = self.mdast.groupByHeaders(ast);

        var pathParts = String(result).split('/');
        var last = pathParts.pop();
        var resultRoot = pathParts.length > 0 ? pathParts.join('/') : '';

        var api = self.mdast.filterAPINodes(headers, allNames);
        api = self.mdast.buildAPIPaths(api, repoName);

        // Make an index for that doc set.
        if (headers.length === 1) {
          headers[0].children = [{ type: 'text', value: last, position: {} }];
        } else if (headers.length > 1) {
          headers = [{
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: last, position: {} }],
            position: {},
            fold: headers,
            junk: []
          }];
        }

        var docs = self.mdast.buildDocPaths(headers, '/autodocs/' + repoName + '/' + resultRoot);

        finalAPI = finalAPI.concat(api);
        finalDocs = finalDocs.concat(docs);

        final[result] = {
          api: api,
          docs: docs,
          headers: headers,
          urls: _urls
        };
      }

      var config = self.mdast.buildAPIConfig(finalAPI);
      config.docs = [];

      for (var doc in final) {
        if (final.hasOwnProperty(doc)) {
          config.docs.push(doc);
          self.writeDocSet(final[doc].docs);
        }
      }

      self.writeConfig(autoDocPath, config);
      self.writeAPI(finalAPI);

      callback();
    }
  },

  writeDocSet: function writeDocSet(docs) {
    var result = '';
    for (var i = 0; i < docs.length; ++i) {
      var local = '';
      if (!docs[i].docPath) {
        continue;
      }

      var temp = pathx.join(os.tmpdir(), '/.wat/.local');
      var path = String(docs[i].docPath);
      var parts = path.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var fileAddon = docs[i].fold.length > 0 ? '/' + file : '';
      var dir = __dirname + '/..' + directory;
      var tempDir = temp + directory;

      util.mkdirSafe(dir + fileAddon);
      util.mkdirSafe(tempDir + fileAddon);

      docs[i].junk = docs[i].junk || [];

      var fullPath = docs[i].fold.length > 0 ? '/' + file + '/' + 'index.md' : '/' + file + '.md';

      var header = mdast.stringify(docs[i]);
      var allJunk = header + '\n\n';
      for (var j = 0; j < docs[i].junk.length; ++j) {
        allJunk += mdast.stringify(docs[i].junk[j]) + '\n\n';
      }

      local += allJunk;

      if (docs[i].fold.length > 0) {
        local += this.writeDocSet(docs[i].fold);
      }

      fs.writeFileSync(dir + fullPath, local);
      fs.writeFileSync(tempDir + fullPath, local);

      result += local;
    }
    return result;
  },

  writeAPI: function writeAPI(api) {
    for (var i = 0; i < api.length; ++i) {
      if (!api[i].apiPath) {
        continue;
      }
      var temp = pathx.join(os.tmpdir(), '/.wat/.local');
      var path = String(api[i].apiPath);
      var parts = path.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var dir = __dirname + '/..' + directory;
      var tempDir = temp + directory;

      util.mkdirSafe(dir);
      util.mkdirSafe(tempDir);

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
    }
  },

  writeConfig: function writeConfig(path, config) {
    try {
      fs.writeFileSync(path + '/config.json', JSON.stringify(config, null, '  '));
    } catch (e) {
      console.log('\n\n' + chalk.yellow('  In building an autodoc, Wat couldn\'t write its config file.') + '\n');
      throw new Error(e);
    }
  }

};

module.exports = autodocs;