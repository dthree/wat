'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');
const moment = require('moment');
const request = require('request');
const chalk = require('chalk');
const util = require('./util');
const tmp = require('tmp');
const os = require('os');
const path = require('path');

const indexer = require('./clerk.indexer');
const history = require('./clerk.history');
const updater = require('./clerk.updater');
const config = require('./clerk.config');
const prefs = require('./clerk.prefs');

const temp = path.join(os.tmpdir(), '/.wat');

const clerk = {

  lastUserAction: void 0,

  paths: {
    tempDir: temp,
    prefs: temp + '/.local/prefs.json',
    cache: temp + '/.local/cache.json',
    hist: temp + '/.local/hist.json',
    docs: temp + '/.local/docs/',
    config: './config/config.json',
    remoteDocUrl: '',
    remoteConfigUrl: '',
    remoteArchiveUrl: ''
  },

  indexer: indexer,

  history: history,

  updater: updater,

  config: config,

  prefs: prefs,

  init(parent) {
    this.parent = parent || {};
    this.cosmetician = this.parent.cosmetician;
    this.history.init(this);
    this.indexer.init(this);
    this.updater.init(this);
    this.config.init(this);
    this.prefs.init(this);
  },

  start(options) {
    options = options || {}
    this.scaffold();
    this.load();
    this.indexer.start({
      clerk: this, 
      updateRemotely: options.updateRemotely
    });
    setInterval(this.history.worker, 5000);
    setInterval(this.updater.nextQueueItem, 6000);
  },

  scaffold() {
    mkdirp.sync(path.join(os.tmpdir(), '/.wat'));
    mkdirp.sync(this.paths.tempDir + '/.local');
    mkdirp.sync(this.paths.tempDir + '/.local/docs');
    this.scaffoldDocs();
    fs.appendFileSync(this.paths.prefs, '');
    fs.appendFileSync(this.paths.cache, '');
    fs.appendFileSync(this.paths.hist, '');
    return this;
  },

  scaffoldDocs() {
    let index = this.indexer.index() || {};
    let dir = clerk.paths.docs;
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
    let index = this.indexer.index() || {};
    let dir = clerk.paths.docs;
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

  search(str) {
    let search = String(str).split(' ');

    let matches = [];
    this.forEachInIndex(function(path, key, value){

      if (key !== '__basic') {
        return;
      }

      let commands = util.parseCommandsFromPath(path);

      let points = 0;
      let dirty = 0;
      for (let i = 0; i < search.length; ++i) {

        let word = String(search[i]).toLowerCase().trim();
        let finds = 0;
        for (let j = 0; j < commands.length; ++j) {
          let cmd = String(commands[j]).toLowerCase().trim();
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
          command: commands.join(' '),
          dirty: dirty
        });
      }

    });

    matches = matches.sort(function(a, b){
      return (
        (a.points > b.points) ? -1 : 
        (a.points < b.points) ? 1 : 0
      );
    });

    return matches;
  },

  compareDocs() {
    let index = this.indexer.index();
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
    let hist = fs.readFileSync(clerk.paths.hist, { encoding: 'utf-8' });
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
    const self = clerk;
    const local = clerk.fetchLocal(path);
    this.history.push({
      type: 'command',
      value: path
    });
    if (local !== undefined) {
      const formatted = self.cosmetician.markdownToTerminal(local);
      cb(void 0, formatted);
    } else {
      util.fetchRemote(this.paths.remoteDocUrl + path, function(err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            const response = 
              chalk.yellow('\n  ' + 
              'Wat couldn\'t find the Markdown file for this command.\n  ' + 
              'This probably means your index needs an update.\n\n') + '  ' + 
              'File: ' + self.paths.remoteDocUrl + path + '\n';
            cb(void 0, response);
          } else {
            cb(err);
          }
        } else {
          const formatted = self.cosmetician.markdownToTerminal(data);
          clerk.file(path, data);
          cb(void 0, formatted);
        }
      });
    }
  },

  fetchLocal(path) {
    let file;
    try {
      file = fs.readFileSync(clerk.paths.docs + path, { encoding: 'utf-8'});
      return file;
    } catch(e) {
      return void 0;
    }
  },

  file(path, data, retry) {
    try {
      fs.appendFileSync(clerk.paths.docs + path, data, { flag: 'w' });
    } catch(e) {
      if (retry === undefined) {
        this.scaffold();
        return this.file(path, data, true);
      } else {
        throw new Error('Unexpected rrror writing to cache: ' + e);
      }
    }
  }

}


module.exports = clerk;
