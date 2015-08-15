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

const clerk = {

  paths: {
    prefs: './.local/prefs.json',
    cache: './.local/cache.json',
    hist: './.local/hist.json',
    docs: './.local/docs/',
    remoteDocs: 'https://raw.githubusercontent.com/vantagejs/uh/master/docs/'
  },

  start() {
    this.scaffold();
    this.load();
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
    let index = this.index.index();
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

  load() {
    let hist = fs.readFileSync(this.paths.hist, { encoding: 'utf-8' });
    try {
      hist = JSON.parse(hist);
      this.history._hist = hist;
    } catch(e) {
      this.history._hist = [];
      //console.log(e.stack);      
    }
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
      this.fetchRemote(this.paths.remoteDocs + path, function(err, data) {
        if (err) {
          cb(err);
        } else {
          if (String(data).indexOf('Markdown not found') > -1) {
            const response = 
              chalk.yellow('\n  ' + 
              'Wat couldn\'t find the Markdown file for this command.\n  ' + 
              'This probably means your index needs an update.\n\n') + '  ' + 
              'File: ' + self.path.remoteDocs + path + '\n';
            cb(void 0, response);
          } else {
            const formatted = cosmetician.markdownToTerminal(data);
            clerk.file(path, data);
            cb(void 0, formatted);
          }
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
          cb(void 0, `Markdown not found.`);
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
