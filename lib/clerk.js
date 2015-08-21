'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');
const moment = require('moment');
const indexer = require('./indexer');
const cosmetician = require('./cosmetician');
const request = require('request');
const chalk = require('chalk');
const util = require('./util');

const clerk = {

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

  start(options) {
    options = options || {}
    this.scaffold();
    this.load();
    indexer.init({ clerk: clerk, updateRemotely: options.updateRemotely });
    setInterval(this.history.worker, 5000);
    setInterval(this.updater.nextQueueItem, 6000);
  },

  scaffold() {
    mkdirp.sync(__dirname + '/../.local');
    mkdirp.sync(__dirname + '/../.local/docs');
    this.scaffoldDocs();
    fs.appendFileSync(__dirname + '/../' + this.paths.prefs, '');
    fs.appendFileSync(__dirname + '/../' + this.paths.cache, '');
    fs.appendFileSync(__dirname + '/../' + this.paths.hist, '');
    return this;
  },

  scaffoldDocs() {
    let index = this.index.index() || {};
    let dir = __dirname + '/../.local/docs/';
    function traverse(idx, path) {
      for (let key in idx) {
        // Clean out all files with '__...'
        let content = Object.keys(idx[key]);
        content = _.reject(content, function(str){
          return (String(str).indexOf('__') > -1);
        })
        if (content.length > 0) {
          let fullPath = dir + path + key;
          mkdirp.sync(fullPath);
          traverse(idx[key], path + key + '/');
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex(callback) {
    let index = this.index.index() || {};
    let dir = __dirname + '/../.local/docs/';
    function traverse(idx, path) {
      for (let key in idx) {
        // Clean out all files with '__...'


        let content = Object.keys(idx[key]);
        let special = {};
        content = _.reject(content, function(str){
          let isSpecial = (String(str).indexOf('__') > -1);
          if (isSpecial) {
            special[str] = idx[key][str];
          }
          return isSpecial;
        });
        //for ()
        //console.log(dir + path + key + special)
        let fullPath = dir + path + key;
        for (let item in special) {
          callback(fullPath, item, special[item]);
        }
        if (content.length > 0) {
          //mkdirp.sync(fullPath);
          traverse(idx[key], path + key + '/');
        }
      }
    }
    traverse(index, '');
  },

  compareDocs() {
    let index = this.index.index();
    let changes = [];
    let newDocs = [];
    this.forEachInIndex(function(path, key, value){
      let exten = util.extensions[key] || key;
      try {
        let stat = fs.statSync(path + exten);
        if (parseFloat(stat.size) !== parseFloat(value)) {
          changes.push(path + exten);
        }
      } catch(e) {
        if (e.code === 'ENOENT') {
          newDocs.push(path + exten);
        }
      }
    });

    const usage = {};
    let ctr = 0;
    for (let i = 0; i < this.history._hist.length; ++i) {
      if (ctr > 200) { break; }
      let item = this.history._hist[i] || {}
      if (item.type === 'command') {
        ctr++;
        let lang = String(item.value).split('/')[0];
        usage[lang] = usage[lang] || 0;
        usage[lang]++;
      }
    }

    // Update all changes.
    for (let i = 0; i < changes.length; ++i) {
      clerk.updater.push(changes[i]);
    }

    // A bit arbitrary, if recent history shows
    // the person used this lib 3 or more times
    // recently, download all docs.
    for (let i = 0; i < newDocs.length; ++i) {
      let parts = String(newDocs[i]).split('docs/');
      if (parts[1]) {
        let lang = String(parts[1]).split('/')[0];
        if (usage[lang] && usage[lang] > 2) {
          clerk.updater.push(newDocs[i]);
        }
      }
    }
  },

  load() {
    let hist = fs.readFileSync(__dirname + '/../' + this.paths.hist, { encoding: 'utf-8' });
    try {
      hist = JSON.parse(hist);
      this.history._hist = hist;
    } catch(e) {
      this.history._hist = [];
    }
    this.config.getLocal();
  },

  fetch(path, cb) {
    cb = cb || function() {}
    clerk.lastUserAction = new Date();
    const self = this;
    const local = clerk.fetchLocal(path);
    this.history.push({
      type: 'command',
      value: path
    });
    if (local !== undefined) {
      const formatted = cosmetician.markdownToTerminal(local);
      cb(void 0, formatted);
    } else {
      this.fetchRemote(this.paths.remoteDocUrl + path, function(err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            const response = 
              chalk.yellow('\n  ' + 
              'Wat couldn\'t find the Markdown file for this command.\n  ' + 
              'This probably means your index needs an update.\n\n') + '  ' + 
              'File: ' + self.path.remoteDocUrl + path + '\n';
            cb(void 0, response);
          } else {
            cb(err);
          }
        } else {
          const formatted = cosmetician.markdownToTerminal(data);
          clerk.file(path, data);
          cb(void 0, formatted);
        }
      });
    }
  },

  fetchLocal(path) {
    let file;
    try {
      file = fs.readFileSync(__dirname + '/../' + this.paths.docs + path, { encoding: 'utf-8'});
      return file;
    } catch(e) {
      return void 0;
    }
  },

  fetchRemote(path, cb) {
    request(path, function(err, response, body) {
      if (!err) {
        if (body === 'Not Found') {
          cb('Not Found', void 0);
        } else {
          cb(void 0, `${body}`);
        }
      } else {
        cb(err, '');
      }
    });
  },

  file(path, data, retry) {
    try {
      fs.appendFileSync(__dirname + '/../' + this.paths.docs + path, data, { flag: 'w' });
    } catch(e) {
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

    push(obj) {
      if (this.queue.indexOf(obj) === -1) {
        this.queue.push(obj);
      }
    },

    nextQueueItem() {

      const self = clerk.updater;
      let item = self.queue.shift();
      let lastAction = (!clerk.lastUserAction) ? 10000000 : (new Date() - clerk.lastUserAction);
      if (item && lastAction > 10000) {
        let partial = String(item).split('docs/');
        let url  = (partial.length > 1) ? partial[1] : partial[0];
        clerk.fetchRemote(clerk.paths.remoteDocUrl + url, function(err, data) {
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
      }
    },
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

    getLocal() {
      try {
        let config = fs.readFileSync(__dirname + '/../' + clerk.paths.config, { encoding: 'utf-8' });
        config = JSON.parse(config);
        this._config = config;
      } catch(e) {
        let error = chalk.yellow('\n\nHouston, we have a problem.\n' + 
          'Wat can\'t read its local config file, which should be at `./config/config.json`. ' + 
          'Without this, Wat can\'t do much. Try re-installing Wat from scratch.\n\nIf that doesn\'t work, please file an issue.\n');
        console.log(error);
        throw new Error(e);
      }

      // Read local config on how to find remote data.
      clerk.paths.remoteDocUrl = this._config.remoteDocUrl || clerk.paths.remoteDocUrl;
      clerk.paths.remoteConfigUrl = this._config.remoteConfigUrl || clerk.paths.remoteConfigUrl;
      clerk.paths.remoteArchiveUrl = this._config.remoteArchiveUrl || clerk.paths.remoteArchiveUrl;
      return this._config;
    },

    getRemote(callback) {
      callback = callback || function() {}
      let url = clerk.paths.remoteConfigUrl + 'config.json';
      clerk.fetchRemote(url, function(err, data){
        if (!err) {
          try {
            let json = JSON.parse(data);
            callback(void 0, json);
          } catch(e) {
            callback("Error parsing json: " + data + ", Error: " + e + ", url: " + url);
          }
        } else {
          callback(err);
        }
      });
    },

    setLocal(key, value) {
      if (key && value) {
        this._config[key] = value;
      }
      fs.writeFileSync(__dirname + '/../' + clerk.paths.config, JSON.stringify(this._config, null, '  '));
    },

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

    get() {
      return this._hist;
    },

    push(obj) {
      obj = obj || {
        type: 'unknown'
      }
      obj.date = new Date();
      this._hist.push(obj);
      this._adds++;
    },

    worker() {

      const self = clerk.history;

      let lastWrite = new Date() - self._lastWrite;
      let write = (self._adds > 5) ? true 
        : (self._adds > 0 && lastWrite > 30000) ? true
        : false;

      if (write) {
        self._adds = 0;
        self._lastWrite = new Date();
        self.write();
      }
    },

    write() {
      if (this._hist.length > this._max) {
        this._hist = this._hist.slice(this._hist.length - this._max);
      }
      fs.writeFileSync(__dirname + '/../.local/hist.json', JSON.stringify(this._hist));
      return this;
    }

  },

  index: indexer

}


module.exports = clerk;
