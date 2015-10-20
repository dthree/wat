'use strict';

var _ = require('lodash');
var rimraf = require('rimraf');
var fs = require('fs');
var chalk = require('chalk');
var util = require('../../../util');
var path = require('path');

var javascript = require('./parser.javascript');
var mdast = require('./mdast');

var markdownParser = {

  javascript: javascript,

  mdast: mdast,

  run: function run(name, options, callback) {
    callback = callback || {};
    options = options || {};
    var self = this;
    var urls = options.urls;
    var lang = options.language || 'javascript';
    var isStatic = options['static'] || false;
    var aliases = options.aliases || [];
    var repoName = String(name).trim();
    var allNames = aliases;
    var results = {};
    var errors = [];
    var writeOptions = { 'static': isStatic };

    allNames.push(repoName);

    // Set appropriate parsing language.
    this.mdast.language(lang);

    var tree = {};
    var final = {};
    var finalAPI = [];
    var finalDocs = [];

    function traverse(node, pth) {
      pth = pth || '';
      for (var item in node) {
        if (node.hasOwnProperty(item)) {
          var fullPath = pth !== '' ? '' + pth + path.sep + item : String(item);
          if (_.isObject(node[item])) {
            traverse(node[item], fullPath);
          } else {
            tree[fullPath] = node[item];
          }
        }
      }
    }
    traverse(urls);

    var done = 0;
    var total = Object.keys(tree).length;
    function doneHandler() {
      done++;
      if (options.progress) {
        options.progress({
          total: total,
          downloaded: done,
          action: 'fetch'
        });
      }
      if (done >= total) {
        parse();
      }
    }

    function fetchOne(key, value) {
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
      if (tree.hasOwnProperty(url)) {
        fetchOne(url, tree[url]);
      }
    }

    var autodocPath = '' + self.app.clerk.paths['static'].autodocs + repoName;
    var localAutodocPath = '' + self.app.clerk.paths.temp.autodocs + repoName;
    try {
      if (writeOptions['static']) {
        rimraf.sync(autodocPath);
      }
      rimraf.sync(localAutodocPath);
    } catch (e) {}

    if (writeOptions['static']) {
      util.mkdirSafe(autodocPath);
    }
    util.mkdirSafe(localAutodocPath);

    function parse() {
      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'parse'
        });
      }
      for (var result in results) {
        if (results.hasOwnProperty(result)) {
          var md = results[result];
          md = self.mdast.stripHTML(md);

          var ast = self.mdast.parse(md);
          ast = self.mdast.sequenceAst(ast);
          var _urls = self.mdast.getUrlsFromAst(ast);
          var headers = self.mdast.groupByHeaders(ast);
          var orphans = headers.orphans;

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
              ignore: true,
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
            orphans: orphans || [],
            headers: headers,
            urls: _urls
          };
        }
      }

      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'build'
        });
      }

      var config = self.mdast.buildAPIConfig(finalAPI);
      var docSequence = self.mdast.buildDocConfig(finalDocs, repoName);

      config.docs = [];
      config.docSequence = docSequence;

      for (var doc in final) {
        if (final.hasOwnProperty(doc)) {
          config.docs.push(doc);
          self.writeDocSet(final[doc].docs, final[doc].orphans, writeOptions);
        }
      }

      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'write'
        });
      }

      if (writeOptions['static']) {
        self.writeConfig(autodocPath, config);
      }
      self.writeConfig(localAutodocPath, config);
      self.writeAPI(finalAPI, writeOptions);
      callback();
    }
  },

  writeConfig: function writeConfig(path, config) {
    try {
      fs.writeFileSync(path + '/config.json', JSON.stringify(config, null, '  '));
    } catch (e) {
      console.log('\n\n' + chalk.yellow('  In building an autodoc, Wat couldn\'t write its config file.') + '\n');
      throw new Error(e);
    }
  },

  writeDocSet: function writeDocSet(docs, orphans, options) {
    options = options || {};
    var result = '';

    var orphanString = '';
    for (var i = 0; i < orphans.length; ++i) {
      orphanString += mdast.stringify(orphans[i]) + '\n\n';
    }

    for (var i = 0; i < docs.length; ++i) {
      var local = '';
      if (!docs[i].docPath) {
        continue;
      }

      var temp = this.app.clerk.paths.temp.root;
      var pth = String(docs[i].docPath);
      var parts = pth.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var fileAddon = docs[i].fold.length > 0 ? '/' + file : '';
      var dir = path.join(__dirname, '/../..', directory);
      var tempDir = temp + directory;

      if (options['static']) {
        util.mkdirSafe(dir + fileAddon);
      }
      util.mkdirSafe(tempDir + fileAddon);

      docs[i].junk = docs[i].junk || [];

      var fullPath = docs[i].fold.length > 0 ? '/' + file + '/index.md' : '/' + file + '.md';

      var header = docs[i].ignore !== true ? mdast.stringify(docs[i]) + '\n\n' : '';
      var allJunk = header;
      for (var j = 0; j < docs[i].junk.length; ++j) {
        allJunk += mdast.stringify(docs[i].junk[j]) + '\n\n';
      }

      local += allJunk;

      if (docs[i].fold.length > 0) {
        local += this.writeDocSet(docs[i].fold, [], options);
      }

      local = orphanString + local;

      if (options['static']) {
        fs.writeFileSync(dir + fullPath, local);
      }
      fs.writeFileSync(tempDir + fullPath, local);

      result += local;
    }
    return result;
  },

  writeAPI: function writeAPI(api, options) {
    var _this = this;

    options = options || {};

    var _loop = function (i) {
      var buildFolds = function buildFolds(itm) {
        items.push(itm);
        for (var j = 0; j < itm.junk.length; ++j) {
          items.push(itm.junk[j]);
        }
        for (var j = 0; j < itm.fold.length; ++j) {
          buildFolds(itm.fold[j]);
        }
      };

      if (!api[i].apiPath) {
        return 'continue';
      }
      var temp = _this.app.clerk.paths.temp.root;
      var pathStr = String(api[i].apiPath);
      var parts = pathStr.split('/');
      var file = parts.pop();
      var directory = parts.join('/');
      var dir = path.join(__dirname, '/../..', directory);
      var tempDir = temp + directory;

      if (options['static']) {
        util.mkdirSafe(dir);
      }
      util.mkdirSafe(tempDir);

      var codeSampleFound = false;
      var basicText = '## ' + api[i].formatted + '\n\n';
      var detailText = basicText;
      var lineX = 2;
      var lineXBasic = 2;

      var items = [];

      buildFolds(api[i]);

      for (var j = 1; j < items.length; ++j) {
        var item = items[j];
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
        fs.writeFileSync('' + tempDir + path.sep + file + '.md', basicText, 'utf-8');
        if (options['static']) {
          fs.writeFileSync('' + dir + path.sep + file + '.md', basicText, 'utf-8');
        }
        if (detailText !== '') {
          fs.writeFileSync('' + tempDir + path.sep + file + '.detail.md', detailText, 'utf-8');
          if (options['static']) {
            fs.writeFileSync('' + dir + path.sep + file + '.detail.md', detailText, 'utf-8');
          }
        }
      } catch (e) {
        throw new Error(e);
      }
    };

    for (var i = 0; i < api.length; ++i) {
      var _ret = _loop(i);

      if (_ret === 'continue') continue;
    }
  }
};

module.exports = function (app) {
  markdownParser.app = app;
  return markdownParser;
};