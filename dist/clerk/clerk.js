'use strict';

var _ = require('lodash');
var mkdirp = require('mkdirp');
var fs = require('fs');
var chalk = require('chalk');
var os = require('os');
var path = require('path');
var util = require('../util');

var tempRoot = path.normalize(path.join(os.tmpdir(), '/.wat/.local/'));
var staticRoot = path.normalize(__dirname + '/../../');

var clerk = {

  lastUserAction: undefined,

  paths: {
    temp: {
      root: tempRoot,
      prefs: tempRoot + 'prefs.json',
      cache: tempRoot + 'cache.json',
      config: tempRoot + 'config.json',
      hist: tempRoot + 'hist.json',
      index: tempRoot + 'index.json',
      localIndex: tempRoot + 'index.local.json',
      docs: path.normalize(tempRoot + 'docs/'),
      autodocs: path.normalize(tempRoot + 'autodocs/')
    },
    'static': {
      root: staticRoot,
      config: path.normalize(staticRoot + 'config/config.json'),
      autoConfig: path.normalize(staticRoot + 'config/autodocs.json'),
      docs: path.normalize(staticRoot + 'docs/'),
      autodocs: path.normalize(staticRoot + 'docs/')
    },
    remote: {
      docs: '',
      autodocs: '',
      config: '',
      archive: ''
    },
    tempDir: tempRoot,
    prefs: tempRoot + 'prefs.json',
    cache: tempRoot + 'cache.json',
    hist: tempRoot + 'hist.json',
    docs: path.normalize(tempRoot + 'docs/'),
    autodocs: path.normalize(tempRoot + 'autodocs/'),
    config: path.normalize('./config/config.json'),
    autoConfig: path.normalize('./config/config.auto.json'),
    remoteDocUrl: '',
    remoteConfigUrl: '',
    remoteArchiveUrl: ''
  },

  start: function start(options) {
    options = options || {};
    this.scaffold();
    this.load();
    this.indexer.start({
      clerk: this,
      updateRemotely: options.updateRemotely
    });
    setInterval(this.history.worker.bind(this.history), 5000);
    setInterval(this.updater.nextQueueItem, 2000);
  },

  scaffold: function scaffold() {
    mkdirp.sync(this.paths.temp.root);
    mkdirp.sync(this.paths.temp.docs);
    mkdirp.sync(this.paths.temp.autodocs);
    // this.scaffoldDir(this.paths.static.docs, 'static');
    // this.scaffoldDir(this.paths.static.autodocs, 'auto');
    fs.appendFileSync(this.paths.temp.prefs, '');
    fs.appendFileSync(this.paths.temp.cache, '');
    fs.appendFileSync(this.paths.temp.hist, '');
    return this;
  },

  version: function version() {
    var ver = undefined;
    try {
      ver = JSON.parse(fs.readFileSync(this.paths['static'].root + 'package.json')).version;
    } catch (e) {}
    return ver;
  },

  load: function load() {
    this.history.getLocal();

    // Compare the config that came with the
    // last NPM install to the local temp docs.
    // If there is no temp config (new install),
    // use the static one, but delete the index
    // sizes. Otherwise, the temp one dominates.
    var staticConfig = this.config.getStatic();
    var localConfig = this.config.getLocal();
    if (!localConfig) {
      delete staticConfig.docIndexSize;
      delete staticConfig.remoteSize;
      this.config.writeLocal(staticConfig);
    }
  },

  scaffoldDir: function scaffoldDir(dir, dirType) {
    var index = this.indexer.index() || {};
    function traverse(idx, pathStr) {
      function rejectFn(str) {
        return String(str).indexOf('__') > -1;
      }
      if (idx.__type && idx.__type !== dirType) {
        return;
      }
      for (var key in idx) {
        if (idx.hasOwnProperty(key) && String(key).indexOf('__') === -1) {
          if (idx[key].__type && idx[key].__type !== dirType || !_.isObject(idx[key])) {
            return;
          }
          // Clean out all files with '__...'
          var content = Object.keys(idx[key]);
          content = _.reject(content, rejectFn);
          if (content.length > 0) {
            var fullPath = dir + pathStr + key;
            mkdirp.sync(fullPath);
            if (_.isObject(idx[key])) {
              traverse(idx[key], '' + pathStr + key + '/');
            }
          }
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex: function forEachInIndex(callback, options) {
    options = options || {};
    var index = this.indexer.index() || {};
    var dir = clerk.paths.temp.docs;
    function traverse(idx, pathStr) {
      for (var key in idx) {
        if (idx.hasOwnProperty(key)) {
          // Clean out all files with '__...'
          if (!_.isObject(idx[key])) {
            return;
          }
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
          var fullPath = '' + dir + pathStr + key;
          var accept = true;
          if (options.filter) {
            accept = options.filter(special);
          }
          if (accept) {
            for (var item in special) {
              if (special.hasOwnProperty(item)) {
                callback(fullPath, item, special[item]);
              }
            }
          }
          if (nonSpecial.length > 0 && _.isObject(idx[key])) {
            traverse(idx[key], '' + pathStr + key + '/');
          }
        }
      }
    }
    traverse(index, '');
  },

  search: function search(str) {
    var search = String(str).split(' ');
    var matches = [];
    this.forEachInIndex(function (pathStr, key) {
      if (key !== '__basic') {
        return;
      }
      var commands = util.parseCommandsFromPath(pathStr);
      var commandString = commands.join(' ');
      var points = 0;
      var dirty = 0;
      for (var i = 0; i < search.length; ++i) {
        var word = String(search[i]).toLowerCase().trim();
        // Unless we get funky regex exceptions (like "?"),
        // try to make the matching strings blue.
        try {
          var reg = new RegExp('(' + word + ')');
          commandString = commandString.replace(reg, chalk.blue('$1'));
        } catch (e) {}
        var finds = 0;
        for (var j = 0; j < commands.length; ++j) {
          var cmd = String(commands[j]).toLowerCase().trim();
          var newPoints = 0;
          if (word === cmd) {
            finds++;
            newPoints += 1;
          } else if (cmd.indexOf(word) > -1) {
            newPoints += Math.round(word.length / cmd.length * 100) / 100;
            finds++;
          }
          points += i === j ? Number(newPoints) * 2 : Number(newPoints) * 1;
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
          command: commands.join(' '),
          commandMatch: commandString
        });
      }
    }, {
      filter: function filter(item) {
        var okay = item.__class !== 'doc';
        return okay;
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

    // Get rid of dirty matches if there are cleans.
    var clean = _.where(matches, { dirty: 0 });
    if (clean.length > 0) {
      matches = clean.filter(function (itm) {
        return itm.dirty === 0;
      });
    }

    return matches;
  },

  compareDocs: function compareDocs() {
    var changes = [];
    var newDocs = [];
    this.forEachInIndex(function (pathStr, key, value) {
      var exten = util.extensions[key] || key;
      if (!util.extensions[key]) {
        return;
      }
      try {
        var stat = fs.statSync(pathStr + exten);
        if (parseFloat(stat.size) !== parseFloat(value)) {
          changes.push(pathStr + exten);
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          newDocs.push(pathStr + exten);
        }
      }
    }, {
      filter: function filter(item) {
        var okay = item.__type === 'static';
        return okay;
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
      var parts = String(newDocs[i]).split('docs' + path.sep);
      if (parts[1]) {
        var lang = String(parts[1]).split('/')[0];
        if (usage[lang] && usage[lang] > 2) {
          clerk.updater.push(newDocs[i]);
        }
      }
    }
  },

  fetch: function fetch(pathStr, type, cb) {
    cb = cb || function () {};
    clerk.lastUserAction = new Date();
    var self = clerk;
    var local = clerk.fetchLocal(pathStr, type);
    this.history.push({
      type: 'command',
      value: pathStr
    });
    if (local !== undefined) {
      var formatted = self.app.cosmetician.markdownToTerminal(local);
      cb(undefined, formatted);
    } else {
      (function () {
        var remoteDir = type === 'auto' ? clerk.paths.remote.autodocs : clerk.paths.remote.docs;
        util.fetchRemote(remoteDir + pathStr, function (err, data) {
          if (err) {
            if (String(err).indexOf('Not Found') > -1) {
              var response = chalk.yellow('\n  Wat couldn\'t find the Markdown file for this command.\n  This probably means your index needs an update.\n\n') + '  File: ' + remoteDir + pathStr + '\n';
              cb(undefined, response);
            } else {
              cb(err);
            }
          } else {
            var formatted = self.app.cosmetician.markdownToTerminal(data);
            clerk.file(pathStr, type, data);
            cb(undefined, formatted);
          }
        });
      })();
    }
  },

  fetchLocal: function fetchLocal(pathStr, type) {
    var directory = type === 'auto' ? clerk.paths.temp.autodocs : clerk.paths.temp.docs;
    var file = undefined;
    try {
      file = fs.readFileSync(directory + pathStr, { encoding: 'utf-8' });
      return file;
    } catch (e) {
      return undefined;
    }
  },

  file: function file(pathStr, type, data) {
    var rootDir = type === 'auto' ? clerk.paths.temp.autodocs : clerk.paths.temp.docs;
    var file = rootDir + pathStr;
    var dir = String(file).split(path.sep);
    dir.pop();
    dir = dir.join(path.sep);
    try {
      mkdirp.sync(dir);
      fs.appendFileSync(file, data, { flag: 'w' });
    } catch (e) {
      this.log('Error saving to the local filesystem: ', e);
    }
  }
};

module.exports = function (app) {
  clerk.app = app;
  clerk.indexer = require('./indexer')(app);
  clerk.history = require('./history')(app);
  clerk.updater = require('./updater')(app);
  clerk.config = require('./config')(app);
  clerk.autodocs = require('./autodocs')(app);
  clerk.prefs = require('./prefs')(app);
  return clerk;
};