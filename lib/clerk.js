'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');
const indexer = require('./indexer');
const cosmetician = require('./cosmetician');
const request = require('request');
const chalk = require('chalk');
const util = require('./util');
const moment = require('moment');

const clerk = {

  paths: {
    prefs: './.local/prefs.json',
    cache: './.local/cache.json',
    hist: './.local/hist.json',
    config: './config/config.json',
    docs: './.local/docs/',
    remoteDocUrl: '',
    remoteConfigUrl: '',
  },

  start(options) {
    options = options || {}
    this.scaffold();
    this.load();
    indexer.init({ clerk: clerk, updateRemotely: options.updateRemotely });
    setInterval(this.history.worker, 5000);
  },

  scaffold() {
    mkdirp.sync('./.local');
    mkdirp.sync('./.local/docs');
    this.scaffoldDocs();
    fs.appendFileSync(this.paths.prefs, '');
    fs.appendFileSync(this.paths.cache, '');
    fs.appendFileSync(this.paths.hist, '');
    return this;
  },

  scaffoldDocs() {
    let index = this.index.index() || {};
    let dir = './.local/docs/';
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
    let dir = './.local/docs/';
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

    let stats = [];
    this.forEachInIndex(function(path, key, value){
      let exten = util.extensions[key] || key;
      try {
        let stat = fs.statSync(path + exten);
        //let indexTime = moment(value);
        //let fileTime = moment(stat.mtime);
        //let minutesApart = Math.floor(fileTime.diff(indexTime)/60000);
        //if (minutesApart > )
        console.log(stat.size, value);
        stats.push(stat);
      } catch(e) {

      }
      //console.log(path, key, value);
    });

    //console.log(stats);

    //console.log(index)    

  },

  load() {
    let hist = fs.readFileSync(this.paths.hist, { encoding: 'utf-8' });
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
    const self = this;
    const local = clerk.fetchLocal(path);
    this.history.push(path);
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
      file = fs.readFileSync(this.paths.docs + path, { encoding: 'utf-8'});
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
      fs.appendFileSync(this.paths.docs + path, data, { flag: 'w' });
    } catch(e) {
      if (retry === undefined) {
        this.scaffold();
        return this.file(path, data, true);
      } else {
        throw new Error('Unexpected rrror writing to cache: ' + e);
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

    _max: 50,

    get() {
      return this._hist;
    },

    push(command) {
      this._hist.push({
        command: command,
        date: new Date()
      });
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
      fs.writeFileSync('./.local/hist.json', JSON.stringify(this._hist));
      return this;
    }

  },

  index: indexer

}


module.exports = clerk;
