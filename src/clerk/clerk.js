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

const tempRoot = path.normalize(path.join(os.tmpdir(), '/.wat/.local/'));
const staticRoot = path.normalize(`${__dirname}/../../`);

const clerk = {

  lastUserAction: undefined,

  paths: {
    temp: {
      root: tempRoot,
      prefs: `${tempRoot}prefs.json`,
      cache: `${tempRoot}cache.json`,
      config: `${tempRoot}config.json`,
      hist: `${tempRoot}hist.json`,
      index: `${tempRoot}index.json`,
      localIndex: `${tempRoot}index.local.json`,
      docs: path.normalize(`${tempRoot}docs/`),
      autodocs: path.normalize(`${tempRoot}autodocs/`),
    },
    static: {
      root: staticRoot,
      config: path.normalize(`${staticRoot}config/config.json`),
      autoConfig: path.normalize(`${staticRoot}config/autodocs.json`),
      docs: path.normalize(`${staticRoot}docs/`),
      autodocs: path.normalize(`${staticRoot}docs/`)
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
    docs: path.normalize(`${tempRoot}docs/`),
    autodocs: path.normalize(`${tempRoot}autodocs/`),
    config: path.normalize('./config/config.json'),
    autoConfig: path.normalize('./config/config.auto.json'),
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
    setInterval(this.history.worker.bind(this.history), 5000);
    setInterval(this.updater.nextQueueItem, 6000);
  },

  scaffold() {
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

  version() {
    let ver;
    try {
      ver = JSON.parse(fs.readFileSync(`${this.paths.static.root}package.json`)).version;
    } catch(e) {}
    return ver;  
  },

  load() {
    this.history.getLocal();
    
    // Compare the config that came with the
    // last NPM install to the local temp docs.
    // If there is no temp config (new install),
    // use the static one, but delete the index
    // sizes. Otherwise, the temp one dominates.
    const staticConfig = this.config.getStatic();
    const localConfig = this.config.getLocal();
    if (!localConfig) {
      delete staticConfig.docIndexSize;
      delete staticConfig.remoteSize;
      this.config.writeLocal(staticConfig);
    }
  },

  scaffoldDir(dir, dirType) {
    const index = this.indexer.index() || {};
    function traverse(idx, pathStr) {
      function rejectFn(str) {
        return (String(str).indexOf('__') > -1);
      }
      if (idx['__type'] && idx['__type'] !== dirType) {
        return;
      }
      for (const key in idx) {
        if (idx.hasOwnProperty(key) && String(key).indexOf('__') === -1) {
          if ((idx[key]['__type'] && idx[key]['__type'] !== dirType) || !_.isObject(idx[key])) {
            return;
          }
          // Clean out all files with '__...'
          let content = Object.keys(idx[key]);
          content = _.reject(content, rejectFn);
          if (content.length > 0) {
            const fullPath = dir + pathStr + key;
            mkdirp.sync(fullPath);
            if (_.isObject(idx[key])) {
              traverse(idx[key], `${pathStr}${key}/`);
            }
          }
        }
      }
    }
    traverse(index, '');
  },

  forEachInIndex(callback, options) {
    options = options || {}
    const index = this.indexer.index() || {};
    const dir = clerk.paths.temp.docs;
    function traverse(idx, pathStr) {
      for (const key in idx) {
        if (idx.hasOwnProperty(key)) {
          // Clean out all files with '__...'
          if (!_.isObject(idx[key])) {
            return;
          }
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
          const fullPath = `${dir}${pathStr}${key}`;
          let accept = true;
          if (options.filter) {
            accept = options.filter(special)
          } 
          if (accept) {
            for (const item in special) {
              if (special.hasOwnProperty(item)) {
                callback(fullPath, item, special[item]);
              }
            }
          }
          if (nonSpecial.length > 0 && _.isObject(idx[key])) {
            traverse(idx[key], `${pathStr}${key}/`);
          }
        }
      }
    }
    traverse(index, '');
  },

  search(str) {
    const search = String(str).split(' ');
    let matches = [];
    this.forEachInIndex(function (pathStr, key, data) {
      if (key !== '__basic') {
        return;
      }
      const commands = util.parseCommandsFromPath(pathStr);
      let commandString = commands.join(' ');
      let points = 0;
      let dirty = 0;
      for (let i = 0; i < search.length; ++i) {
        const word = String(search[i]).toLowerCase().trim();
        // Unless we get funky regex exceptions (like "?"),
        // try to make the matching strings blue.
        try {
          const reg = new RegExp(`(${word})`);
          commandString = commandString.replace(reg, chalk.blue('$1'));
        } catch(e) {}
        let finds = 0;
        for (let j = 0; j < commands.length; ++j) {
          const cmd = String(commands[j]).toLowerCase().trim();
          let newPoints = 0;
          if (word === cmd) {
            finds++;
            newPoints += 1;
          } else if (cmd.indexOf(word) > -1) {
            newPoints += Math.round((word.length / cmd.length) * 100) / 100;;
            finds++;
          }
          points += (i === j) ? newPoints * 2 : newPoints * 1;
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
          command: commands.join(' '),
          commandMatch: commandString
        });
      }
    }, {
      filter: function(item) {
        let okay = item.__class !== 'doc';
        return okay;
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

    // Get rid of dirty matches if there are cleans.
    let clean = _.where(matches, { dirty: 0 });
    if (clean.length > 0) {
      matches = clean.filter(function(itm) {
        return itm.dirty === 0;
      });
    }

    return matches;
  },

  compareDocs() {
    const changes = [];
    const newDocs = [];
    this.forEachInIndex(function (pathStr, key, value) {
      const exten = util.extensions[key] || key;
      if (!util.extensions[key]) {
        return;
      }
      try {
        const stat = fs.statSync(pathStr + exten);
        if (parseFloat(stat.size) !== parseFloat(value)) {
          changes.push(pathStr + exten);
        }
      } catch(e) {
        if (e.code === 'ENOENT') {
          newDocs.push(pathStr + exten);
        }
      }
    }, {
      filter: function(item) {
        let okay = (item.__type === 'static');
        return okay;
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
      const parts = String(newDocs[i]).split(`docs${path.sep}`);
      if (parts[1]) {
        const lang = String(parts[1]).split('/')[0];
        if (usage[lang] && usage[lang] > 2) {
          clerk.updater.push(newDocs[i]);
        }
      }
    }
  },

  fetch(pathStr, type, cb) {
    cb = cb || function () {};
    clerk.lastUserAction = new Date();
    const self = clerk;
    const local = clerk.fetchLocal(pathStr, type);
    this.history.push({
      type: 'command',
      value: pathStr
    });
    if (local !== undefined) {
      const formatted = self.app.cosmetician.markdownToTerminal(local);
      cb(undefined, formatted);
    } else {
      const remoteDir = (type === 'auto') 
        ? clerk.paths.remote.autodocs
        : clerk.paths.remote.docs;
      util.fetchRemote(remoteDir + pathStr, function (err, data) {
        if (err) {
          if (String(err).indexOf('Not Found') > -1) {
            const response = `${chalk.yellow(`\n  Wat couldn\'t find the Markdown file for this command.\n  This probably means your index needs an update.\n\n`)}  File: ${remoteDir}${pathStr}\n`;
            cb(undefined, response);
          } else {
            cb(err);
          }
        } else {
          const formatted = self.app.cosmetician.markdownToTerminal(data);
          clerk.file(pathStr, type, data);
          cb(undefined, formatted);
        }
      });
    }
  },

  fetchLocal(pathStr, type) {
    const directory = (type === 'auto') 
      ? clerk.paths.temp.autodocs
      : clerk.paths.temp.docs;
    let file;
    try {
      file = fs.readFileSync(directory + pathStr, {encoding: 'utf-8'});
      return file;
    } catch(e) {
      return undefined;
    }
  },

  file(pathStr, type, data, retry) {
    const rootDir = (type === 'auto')
      ? clerk.paths.temp.autodocs
      : clerk.paths.temp.docs;
    const file = rootDir + pathStr;
    let dir = String(file).split(path.sep);
    dir.pop();
    dir = dir.join(path.sep);
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
