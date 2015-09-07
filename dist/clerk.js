'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var mkdirp = require('mkdirp');
var fs = require('fs');
var chalk = require('chalk');
var util = require('./util');
var os = require('os');
var path = require('path');

var indexer = require('./clerk.indexer');
var history = require('./clerk.history');
var updater = require('./clerk.updater');
var config = require('./clerk.config');
var prefs = require('./clerk.prefs');

var temp = path.join(os.tmpdir(), '/.wat');

var clerk = {

  lastUserAction: undefined,

  paths: {
    tempDir: temp,
    prefs: temp + '/.local/prefs.json',
    cache: temp + '/.local/cache.json',
    hist: temp + '/.local/hist.json',
    docs: temp + '/.local/docs/',
    autodocs: temp + '/.local/autodocs/',
    config: './config/config.json',
    autoConfig: './config/config.auto.json',
    remoteDocUrl: '',
    remoteConfigUrl: '',
    remoteArchiveUrl: ''
  },

  indexer: indexer,

  history: history,

  updater: updater,

  config: config,

  prefs: prefs,

  init: function init(parent) {
    this.parent = parent || {};
    this.cosmetician = this.parent.cosmetician;
    this.history.init(this);
    this.indexer.init(this);
    this.updater.init(this);
    this.config.init(this);
    this.prefs.init(this);
  },

  start: function start(options) {
    options = options || {};
    this.scaffold();
    this.load();
    this.indexer.start({
      clerk: this,
      updateRemotely: options.updateRemotely
    });
    setInterval(this.history.worker, 5000);
    setInterval(this.updater.nextQueueItem, 6000);
  },

  scaffold: function scaffold() {
    mkdirp.sync(this.paths.tempDir);
    mkdirp.sync(this.paths.tempDir + '/.local');
    mkdirp.sync(this.paths.tempDir + '/.local/docs');
    mkdirp.sync(this.paths.tempDir + '/.local/autodocs');
    this.scaffoldDir('' + this.paths.docs, 'static');
    this.scaffoldDir('' + this.paths.autodocs, 'auto');
    fs.appendFileSync(this.paths.prefs, '');
    fs.appendFileSync(this.paths.cache, '');
    fs.appendFileSync(this.paths.hist, '');
    return this;
  },

  scaffoldDir: function scaffoldDir(dir, dirType) {
    var index = this.indexer.index() || {};
    function traverse(idx, path) {
      function rejectFn(str) {
        return String(str).indexOf('__') > -1;
      }
      if (idx['__type'] && idx['__type'] !== dirType) {
        return;
      }
      for (var key in idx) {
        if (idx.hasOwnProperty(key) && String(key).indexOf('__') === -1) {
          if (idx[key]['__type'] && idx[key]['__type'] !== dirType) {
            return;
          }
          // Clean out all files with '__...'
          var content = Object.keys(idx[key]);
          content = _.reject(content, rejectFn);
          if (content.length > 0) {
            var fullPath = dir + path + key;
            mkdirp.sync(fullPath);
            if (_.isObject(idx[key])) {
              traverse(idx[key], '' + path + key + '/');
            }
          }
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex: function forEachInIndex(callback) {
    var index = this.indexer.index() || {};
    var dir = clerk.paths.docs;
    function traverse(idx, path) {
      for (var key in idx) {
        if (idx.hasOwnProperty(key)) {
          // Clean out all files with '__...'
          var content = Object.keys(idx[key]);
          var special = {};
          var nonSpecial = [];
          for (var i = 0; i < content.length; ++i) {
            var isSpecial = String(content[i]).indexOf('__') > -1;
            if (isSpecial) {
              special[content[i]] = idx[key][content[i]];
            } else {
              nonSpecial.push(content[i]);
            }
          }
          var fullPath = dir + path + key;
          for (var item in special) {
            if (special.hasOwnProperty(item)) {
              callback(fullPath, item, special[item]);
            }
          }
          if (nonSpecial.length > 0 && _.isObject(idx[key])) {
            traverse(idx[key], '' + path + key + '/');
          }
        }
      }
    }
    traverse(index, '');
  },

  search: function search(str) {
    var search = String(str).split(' ');
    var matches = [];
    this.forEachInIndex(function (path, key) {
      if (key !== '__basic') {
        return;
      }

      var commands = util.parseCommandsFromPath(path);
      var points = 0;
      var dirty = 0;
      for (var i = 0; i < search.length; ++i) {
        var word = String(search[i]).toLowerCase().trim();
        var finds = 0;
        for (var j = 0; j < commands.length; ++j) {
          var cmd = String(commands[j]).toLowerCase().trim();
          if (word === cmd) {
            finds++;
            if (i === j) {
              points += 2;
            } else {
              points += 1;
            }
          }
        }
        if (finds === 0) {
          dirty++;
          points--;
        }
      }

      if (points > 0) {
        matches.push({
          points: points,
          dirty: dirty,
          command: commands.join(' ')
        });
      }
    });

    matches = matches.sort(function (a, b) {
      var sort = 0;
      if (a.points > b.points) {
        sort = -1;
      } else if (a.points < b.points) {
        sort = 1;
      }
      return sort;
    });

    return matches;
  },

  compareDocs: function compareDocs() {
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
    var hist = fs.readFileSync(clerk.paths.hist, { encoding: 'utf-8' });
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
    var self = clerk;
    var local = clerk.fetchLocal(path);
    this.history.push({
      type: 'command',
      value: path
    });
    if (local !== undefined) {
      var formatted = self.cosmetician.markdownToTerminal(local);
      cb(undefined, formatted);
    } else {
      util.fetchRemote(this.paths.remoteDocUrl + path, function (err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            var response = chalk.yellow('\n  Wat couldn\'t find the Markdown file for this command.\n  This probably means your index needs an update.\n\n') + '  File: ' + self.paths.remoteDocUrl + path + '\n';
            cb(undefined, response);
          } else {
            cb(err);
          }
        } else {
          var formatted = self.cosmetician.markdownToTerminal(data);
          clerk.file(path, data);
          cb(undefined, formatted);
        }
      });
    }
  },

  fetchLocal: function fetchLocal(path) {
    var file = undefined;
    try {
      file = fs.readFileSync(clerk.paths.docs + path, { encoding: 'utf-8' });
      return file;
    } catch (e) {
      return undefined;
    }
  },

  file: function file(path, data, retry) {
    try {
      fs.appendFileSync(clerk.paths.docs + path, data, { flag: 'w' });
    } catch (e) {
      if (retry === undefined) {
        this.scaffold();
      } else {
        throw new Error('Unexpected rrror writing to cache: ' + e);
      }
      return this.file(path, data, true);
    }
  }
};

module.exports = clerk;