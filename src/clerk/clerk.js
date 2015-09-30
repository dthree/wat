'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');
const chalk = require('chalk');
const os = require('os');
const path = require('path');
const util = require('../util');

const tempRoot = path.join(os.tmpdir(), '/.wat/.local/');
const staticRoot = `${__dirname}/../../`;

const clerk = {

  lastUserAction: undefined,

  paths: {
    temp: {
      root: tempRoot,
      prefs: `${tempRoot}prefs.json`,
      cache: `${tempRoot}cache.json`,
      hist: `${tempRoot}hist.json`,
      docs: `${tempRoot}docs/`,
      autodocs: `${tempRoot}autodocs/`,
    },
    static: {
      root: staticRoot,
      config: `${staticRoot}config/config.json`,
      autoConfig: `${staticRoot}config/autodocs.json`,
      docs: `${staticRoot}docs/`,
      autodocs: `${staticRoot}docs/`
    },
    remote: {
      docs: '',
      autodocs: '',
      config: '',
      archive: ''
    },
    tempDir: tempRoot,
    prefs: `${tempRoot}prefs.json`,
    cache: `${tempRoot}cache.json`,
    hist: `${tempRoot}hist.json`,
    docs: `${tempRoot}docs/`,
    autodocs: `${tempRoot}autodocs/`,
    config: './config/config.json',
    autoConfig: './config/config.auto.json',
    remoteDocUrl: '',
    remoteConfigUrl: '',
    remoteArchiveUrl: ''
  },

  start(options) {
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

  scaffold() {
    mkdirp.sync(this.paths.temp.root);
    mkdirp.sync(this.paths.temp.docs);
    mkdirp.sync(this.paths.temp.autodocs);
    this.scaffoldDir(this.paths.static.docs, 'static');
    this.scaffoldDir(this.paths.static.autodocs, 'auto');
    fs.appendFileSync(this.paths.temp.prefs, '');
    fs.appendFileSync(this.paths.temp.cache, '');
    fs.appendFileSync(this.paths.temp.hist, '');
    return this;
  },

  scaffoldDir(dir, dirType) {
    const index = this.indexer.index() || {};
    function traverse(idx, path) {
      function rejectFn(str) {
        return (String(str).indexOf('__') > -1);
      }
      if (idx['__type'] && idx['__type'] !== dirType) {
        return;
      }
      for (const key in idx) {
        if (idx.hasOwnProperty(key) && String(key).indexOf('__') === -1) {
          if (idx[key]['__type'] && idx[key]['__type'] !== dirType) {
            return;
          }
          // Clean out all files with '__...'
          let content = Object.keys(idx[key]);
          content = _.reject(content, rejectFn);
          if (content.length > 0) {
            const fullPath = dir + path + key;
            mkdirp.sync(fullPath);
            if (_.isObject(idx[key])) {
              traverse(idx[key], `${path}${key}/`);
            }
          }
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex(callback) {
    const index = this.indexer.index() || {};
    const dir = clerk.paths.temp.docs;
    function traverse(idx, path) {
      for (const key in idx) {
        if (idx.hasOwnProperty(key)) {
          // Clean out all files with '__...'
          const content = Object.keys(idx[key]);
          const special = {};
          const nonSpecial = [];
          for (let i = 0; i < content.length; ++i) {
            const isSpecial = (String(content[i]).indexOf('__') > -1);
            if (isSpecial) {
              special[content[i]] = idx[key][content[i]];
            } else {
              nonSpecial.push(content[i]);
            }
          }
          const fullPath = `${dir}${path}${key}`;
          for (const item in special) {
            if (special.hasOwnProperty(item)) {
              callback(fullPath, item, special[item]);
            }
          }
          if (nonSpecial.length > 0 && _.isObject(idx[key])) {
            traverse(idx[key], `${path}${key}/`);
          }
        }
      }
    }
    traverse(index, '');
  },

  search(str) {
    const search = String(str).split(' ');
    let matches = [];
    this.forEachInIndex(function (path, key) {
      if (key !== '__basic') {
        return;
      }

      const commands = util.parseCommandsFromPath(path);
      let points = 0;
      let dirty = 0;
      for (let i = 0; i < search.length; ++i) {
        const word = String(search[i]).toLowerCase().trim();
        let finds = 0;
        for (let j = 0; j < commands.length; ++j) {
          const cmd = String(commands[j]).toLowerCase().trim();
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
          points,
          dirty,
          command: commands.join(' ')
        });
      }
    });

    matches = matches.sort(function (a, b) {
      let sort = 0;
      if (a.points > b.points) {
        sort = -1;
      } else if (a.points < b.points) {
        sort = 1;
      }
      return sort;
    });

    return matches;
  },

  compareDocs() {
    const changes = [];
    const newDocs = [];
    this.forEachInIndex(function (path, key, value) {
      const exten = util.extensions[key] || key;
      try {
        const stat = fs.statSync(path + exten);
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
      if (ctr > 200) {
        break;
      }
      const item = this.history._hist[i] || {};
      if (item.type === 'command') {
        ctr++;
        const lang = String(item.value).split('/')[0];
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
      const parts = String(newDocs[i]).split('docs/');
      if (parts[1]) {
        const lang = String(parts[1]).split('/')[0];
        if (usage[lang] && usage[lang] > 2) {
          clerk.updater.push(newDocs[i]);
        }
      }
    }
  },

  load() {
    let hist = fs.readFileSync(clerk.paths.temp.hist, {encoding: 'utf-8'});
    try {
      hist = JSON.parse(hist);
      this.history._hist = hist;
    } catch(e) {
      this.history._hist = [];
    }
    this.config.getLocal();
  },

  fetch(path, type, cb) {
    cb = cb || function () {};
    clerk.lastUserAction = new Date();
    const self = clerk;
    const local = clerk.fetchLocal(path, type);
    this.history.push({
      type: 'command',
      value: path
    });
    if (local !== undefined) {
      const formatted = self.app.cosmetician.markdownToTerminal(local);
      cb(undefined, formatted);
    } else {
      const remoteDir = (type === 'auto') 
        ? clerk.paths.remote.autodocs
        : clerk.paths.remote.docs;
      util.fetchRemote(remoteDir + path, function (err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            const response = `${chalk.yellow(`\n  Wat couldn\'t find the Markdown file for this command.\n  This probably means your index needs an update.\n\n`)}  File: ${remoteDir}${path}\n`;
            cb(undefined, response);
          } else {
            cb(err);
          }
        } else {
          const formatted = self.app.cosmetician.markdownToTerminal(data);
          clerk.file(path, type, data);
          cb(undefined, formatted);
        }
      });
    }
  },

  fetchLocal(path, type) {
    const directory = (type === 'auto') 
      ? clerk.paths.temp.autodocs
      : clerk.paths.temp.docs;
    let file;
    try {
      file = fs.readFileSync(directory + path, {encoding: 'utf-8'});
      return file;
    } catch(e) {
      return undefined;
    }
  },

  file(path, type, data, retry) {
    console.log('filing', path, type, data);
    const rootDir = (type === 'auto')
      ? clerk.paths.temp.autodocs
      : clerk.paths.temp.docs;
    const file = rootDir + path;
    let dir = String(file).split('/');
    dir.pop();
    dir = dir.join('/');
    try {
      mkdirp.sync(dir);
      fs.appendFileSync(file, data, {flag: 'w'});
    } catch(e) {
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
