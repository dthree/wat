'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var mkdirp = require('mkdirp');
var fs = require('fs');
var moment = require('moment');
var indexer = require('./indexer');
var cosmetician = require('./cosmetician');
var request = require('request');
var chalk = require('chalk');
var util = require('./util');

var clerk = {

  lastUserAction: void 0,

  paths: {
    prefs: './.local/prefs.json',
    cache: './.local/cache.json',
    hist: './.local/hist.json',
    config: './config/config.json',
    docs: './.local/docs/',
    remoteDocUrl: '',
    remoteConfigUrl: '',
    remoteArchiveUrl: ''
  },

  start: function start(options) {
    options = options || {};
    this.scaffold();
    this.load();
    indexer.init({ clerk: clerk, updateRemotely: options.updateRemotely });
    setInterval(this.history.worker, 5000);
    setInterval(this.updater.nextQueueItem, 6000);
  },

  scaffold: function scaffold() {
    mkdirp.sync(__dirname + '/../.local');
    mkdirp.sync(__dirname + '/../.local/docs');
    this.scaffoldDocs();
    fs.appendFileSync(__dirname + '/../' + this.paths.prefs, '');
    fs.appendFileSync(__dirname + '/../' + this.paths.cache, '');
    fs.appendFileSync(__dirname + '/../' + this.paths.hist, '');
    return this;
  },

  scaffoldDocs: function scaffoldDocs() {
    var index = this.index.index() || {};
    var dir = __dirname + '/../.local/docs/';
    function traverse(idx, path) {
      for (var key in idx) {
        // Clean out all files with '__...'
        var content = Object.keys(idx[key]);
        content = _.reject(content, function (str) {
          return String(str).indexOf('__') > -1;
        });
        if (content.length > 0) {
          var fullPath = dir + path + key;
          mkdirp.sync(fullPath);
          traverse(idx[key], path + key + '/');
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex: function forEachInIndex(callback) {
    var index = this.index.index() || {};
    var dir = __dirname + '/../.local/docs/';
    function traverse(idx, path) {
      var _loop = function (key) {
        // Clean out all files with '__...'

        var content = Object.keys(idx[key]);
        var special = {};
        content = _.reject(content, function (str) {
          var isSpecial = String(str).indexOf('__') > -1;
          if (isSpecial) {
            special[str] = idx[key][str];
          }
          return isSpecial;
        });
        //for ()
        //console.log(dir + path + key + special)
        var fullPath = dir + path + key;
        for (var item in special) {
          callback(fullPath, item, special[item]);
        }
        if (content.length > 0) {
          //mkdirp.sync(fullPath);
          traverse(idx[key], path + key + '/');
        }
      };

      for (var key in idx) {
        _loop(key);
      }
    }
    traverse(index, '');
  },

  compareDocs: function compareDocs() {
    var index = this.index.index();
    var changes = [];
    var newDocs = [];
    this.forEachInIndex(function (path, key, value) {
      var exten = util.extensions[key] || key;
      try {
        var stat = fs.statSync(path + exten);
        if (parseFloat(stat.size) !== parseFloat(value)) {
          changes.push(path + exten);
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          newDocs.push(path + exten);
        }
      }
    });

    var usage = {};
    var ctr = 0;
    for (var i = 0; i < this.history._hist.length; ++i) {
      if (ctr > 200) {
        break;
      }
      var item = this.history._hist[i] || {};
      if (item.type === 'command') {
        ctr++;
        var lang = String(item.value).split('/')[0];
        usage[lang] = usage[lang] || 0;
        usage[lang]++;
      }
    }

    // Update all changes.
    for (var i = 0; i < changes.length; ++i) {
      clerk.updater.push(changes[i]);
    }

    // A bit arbitrary, if recent history shows
    // the person used this lib 3 or more times
    // recently, download all docs.
    for (var i = 0; i < newDocs.length; ++i) {
      var parts = String(newDocs[i]).split('docs/');
      if (parts[1]) {
        var lang = String(parts[1]).split('/')[0];
        if (usage[lang] && usage[lang] > 2) {
          clerk.updater.push(newDocs[i]);
        }
      }
    }
  },

  load: function load() {
    var hist = fs.readFileSync(__dirname + '/../' + this.paths.hist, { encoding: 'utf-8' });
    try {
      hist = JSON.parse(hist);
      this.history._hist = hist;
    } catch (e) {
      this.history._hist = [];
    }
    this.config.getLocal();
  },

  fetch: function fetch(path, cb) {
    cb = cb || function () {};
    clerk.lastUserAction = new Date();
    var self = this;
    var local = clerk.fetchLocal(path);
    this.history.push({
      type: 'command',
      value: path
    });
    if (local !== undefined) {
      var formatted = cosmetician.markdownToTerminal(local);
      cb(void 0, formatted);
    } else {
      this.fetchRemote(this.paths.remoteDocUrl + path, function (err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            var response = chalk.yellow('\n  ' + 'Wat couldn\'t find the Markdown file for this command.\n  ' + 'This probably means your index needs an update.\n\n') + '  ' + 'File: ' + self.path.remoteDocUrl + path + '\n';
            cb(void 0, response);
          } else {
            cb(err);
          }
        } else {
          var formatted = cosmetician.markdownToTerminal(data);
          clerk.file(path, data);
          cb(void 0, formatted);
        }
      });
    }
  },

  fetchLocal: function fetchLocal(path) {
    var file = undefined;
    try {
      file = fs.readFileSync(__dirname + '/../' + this.paths.docs + path, { encoding: 'utf-8' });
      return file;
    } catch (e) {
      return void 0;
    }
  },

  fetchRemote: function fetchRemote(path, cb) {
    request(path, function (err, response, body) {
      if (!err) {
        if (body === 'Not Found') {
          cb('Not Found', void 0);
        } else {
          cb(void 0, '' + body);
        }
      } else {
        cb(err, '');
      }
    });
  },

  file: function file(path, data, retry) {
    try {
      fs.appendFileSync(__dirname + '/../' + this.paths.docs + path, data, { flag: 'w' });
    } catch (e) {
      if (retry === undefined) {
        this.scaffold();
        return this.file(path, data, true);
      } else {
        throw new Error('Unexpected rrror writing to cache: ' + e);
      }
    }
  },

  updater: {

    queue: [],

    push: function push(obj) {
      if (this.queue.indexOf(obj) === -1) {
        this.queue.push(obj);
      }
    },

    nextQueueItem: function nextQueueItem() {

      var self = clerk.updater;
      var item = self.queue.shift();
      var lastAction = !clerk.lastUserAction ? 10000000 : new Date() - clerk.lastUserAction;
      if (item && lastAction > 10000) {
        (function () {
          var partial = String(item).split('docs/');
          var url = partial.length > 1 ? partial[1] : partial[0];
          clerk.fetchRemote(clerk.paths.remoteDocUrl + url, function (err, data) {
            if (err) {
              console.log('PROBLEM...');
              console.log(err);
            } else {
              clerk.file(url, data);
              clerk.history.push({
                type: 'update',
                value: url
              });
            }
          });
        })();
      }
    }
  },

  /**
   * The config object sets and gets the ./config/config.json 
   * file locally and remotely. This file is used to ensure 
   * we always know the URL for the remote docs, in case it 
   * changes in the future.
   *
   * It also syncs the last update of the index.json file, 
   * which in turn knows when all docs were last updated, 
   * and so keeps the remote repo's docs and local docs 
   * in sync.
   */

  config: {

    _config: {},

    getLocal: function getLocal() {
      try {
        var config = fs.readFileSync(__dirname + '/../' + clerk.paths.config, { encoding: 'utf-8' });
        config = JSON.parse(config);
        this._config = config;
      } catch (e) {
        var error = chalk.yellow('\n\nHouston, we have a problem.\n' + 'Wat can\'t read its local config file, which should be at `./config/config.json`. ' + 'Without this, Wat can\'t do much. Try re-installing Wat from scratch.\n\nIf that doesn\'t work, please file an issue.\n');
        console.log(error);
        throw new Error(e);
      }

      // Read local config on how to find remote data.
      clerk.paths.remoteDocUrl = this._config.remoteDocUrl || clerk.paths.remoteDocUrl;
      clerk.paths.remoteConfigUrl = this._config.remoteConfigUrl || clerk.paths.remoteConfigUrl;
      clerk.paths.remoteArchiveUrl = this._config.remoteArchiveUrl || clerk.paths.remoteArchiveUrl;
      return this._config;
    },

    getRemote: function getRemote(callback) {
      callback = callback || function () {};
      var url = clerk.paths.remoteConfigUrl + 'config.json';
      clerk.fetchRemote(url, function (err, data) {
        if (!err) {
          try {
            var json = JSON.parse(data);
            callback(void 0, json);
          } catch (e) {
            callback("Error parsing json: " + data + ", Error: " + e + ", url: " + url);
          }
        } else {
          callback(err);
        }
      });
    },

    setLocal: function setLocal(key, value) {
      if (key && value) {
        this._config[key] = value;
      }
      fs.writeFileSync(__dirname + '/../' + clerk.paths.config, JSON.stringify(this._config, null, '  '));
    }

  },

  /**
   * History stores records of the most recent commands,
   * which is kept for the user's convenience and reference,
   * as well as so as to optimize remote storage of 
   * the user's most used languages.
   */

  history: {

    _hist: [],

    _adds: 0,

    _lastWrite: new Date(),

    _max: 600,

    get: function get() {
      return this._hist;
    },

    push: function push(obj) {
      obj = obj || {
        type: 'unknown'
      };
      obj.date = new Date();
      this._hist.push(obj);
      this._adds++;
    },

    worker: function worker() {

      var self = clerk.history;

      var lastWrite = new Date() - self._lastWrite;
      var write = self._adds > 5 ? true : self._adds > 0 && lastWrite > 30000 ? true : false;

      if (write) {
        self._adds = 0;
        self._lastWrite = new Date();
        self.write();
      }
    },

    write: function write() {
      if (this._hist.length > this._max) {
        this._hist = this._hist.slice(this._hist.length - this._max);
      }
      fs.writeFileSync(__dirname + '/../.local/hist.json', JSON.stringify(this._hist));
      return this;
    }

  },

  index: indexer

};

module.exports = clerk;