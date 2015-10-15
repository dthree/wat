'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var walk = require('walk');
var fs = require('fs');
var path = require('path');
var util = require('../util');
var chalk = require('chalk');

var indexer = {

  // The remote index.
  _remoteIndex: undefined,

  // The JSON of the local doc index.
  _localDocIndex: undefined,

  // The JSON of the local autodoc index.
  _localAutodocIndex: undefined,

  _localMergedIndex: undefined,

  // Last time the index was
  // pulled from online.
  _indexLastUpdate: undefined,

  // Always wait at least an hour since
  // the last index.json was pulled
  // before trying again, unless the
  // update is forced.
  _updateInterval: 3600000,

  // When building your docs with gulp,
  // you sometimes don't want Wat to
  // be smart and override your index.
  updateRemotely: true,

  /**
  * Thump, thump... It's alive!
  *
  * @param {Object} options
  * @return {Indexer}
  * @api public
  */

  start: function start(options) {
    var self = this;
    options = options || {};
    if (options.clerk) {
      indexer.clerk = options.clerk;
    }

    if (options.updateRemotely !== undefined) {
      this.updateRemotely = options.updateRemotely;
    }

    if (this.updateRemotely === true) {
      setInterval(this.update, 3600000);
      setTimeout(function () {
        self.update();
      }, 60000);
      self.update();
    }
    return this;
  },

  /**
  * Assembles the index based on the ./docs
  * folder. This needs to be called manually,
  * and is used by Gulp in rebuilding the
  * the index after doc work.
  *
  * @param {Function} callback
  * @api public
  */

  build: function build(callback) {
    var self = this;
    var autodocs = this.app.clerk.autodocs.config();
    var auto = undefined;
    var local = undefined;
    var staticf = undefined;
    var dones = 0;
    function checker() {
      dones++;
      if (dones === 2) {
        // Merge docs and autodocs folders.
        //let idx = self.merge(normal, auto);

        // Merge local /tmp docs.
        //idx = self.mergeLocal(idx, local);

        // Merge config files into index.
        //let configs = self.merge(normalConfigs, autoConfigs);
        //idx = self.applyConfigs(idx, configs);

        // Add in unloaded autodoc hints into index.
        //idx = self.applyLibs(idx);

        // Add in unloaded autodoc hints into index.
        // console.log(staticf, local);

        callback(staticf, local);
      }
    }
    /*
    this.buildDir(path.normalize(`${__dirname}/../../autodocs/`), 'auto', function (data) {
      auto = data;
      checker();
    });
    this.buildDir(path.normalize(`${__dirname}/../../docs/`), 'static', function (data) {
      normal = data;
      checker();
    });
    this.readConfigs(path.normalize(`${__dirname}/../../autodocs/`), function (data) {
      autoConfigs = data || {};
      checker();
    });
    this.readConfigs(path.normalize(`${__dirname}/../../docs/`), function (data) {
      normalConfigs = data || {};
      checker();
    });
    */
    this.buildLocation('temp', function (localIdx) {
      local = localIdx;
      checker();
    });
    this.buildLocation('static', function (localIdx) {
      staticf = localIdx;
      checker();
    });
  },

  buildLocation: function buildLocation(location, callback) {
    var self = this;
    var autodocs = this.app.clerk.autodocs.config();
    var manual = undefined;
    var auto = undefined;
    var manualConfigs = {};
    var autoConfigs = {};
    var dones = 0;
    function checker() {
      dones++;
      if (dones === 4) {
        var manualIdx = self.applyConfigs(manual, manualConfigs);
        var autoIdx = self.applyConfigs(auto, autoConfigs);
        manualIdx = self.applyLibs(manualIdx);
        autoIdx = self.applyLibs(autoIdx);
        if (location === 'temp') {
          autoIdx = self.applyAutodocs(autoIdx, autodocs);
        }
        callback(self.merge(manualIdx, autoIdx));
      }
    }
    this.buildDir(self.app.clerk.paths[location].docs, 'static', function (data) {
      manual = data;
      checker();
    });
    this.readConfigs(self.app.clerk.paths[location].docs, function (data) {
      manualConfigs = data || {};
      checker();
    });
    this.buildDir(self.app.clerk.paths[location].autodocs, 'auto', function (data) {
      auto = data;
      checker();
    });
    this.readConfigs(self.app.clerk.paths[location].autodocs, function (data) {
      autoConfigs = data || {};
      checker();
    });
  },

  buildDir: function buildDir(dir, dirType, callback) {
    callback = callback || {};
    var index = {};

    // Make sure dir exists.
    var exists = true;
    try {
      exists = fs.statSync(path.normalize(dir));
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      callback({});
      return;
    }

    var walker = walk.walk(dir, {});
    walker.on('file', function (root, fileStats, next) {
      if (String(fileStats.name).indexOf('.json') > -1) {
        next();
        return;
      }
      var pathStr = util.path.getDocRoot(root);
      var dirs = String(pathStr).split(path.sep);
      dirs.push(fileStats.name);
      // console.log('buildDir', pathStr, dirs);
      var remainder = _.clone(dirs);
      function build(idx, arr) {
        var item = String(arr.shift());
        if (item.indexOf('.md') > -1) {
          var split = item.split('.');
          split.pop();
          var last = split[split.length - 1];
          var special = split.length > 1 && ['install', 'detail'].indexOf(last) > -1;
          if (special) {
            split.pop();
          }
          var type = special ? last : 'basic';
          var filename = split.join('.');
          idx[filename] = idx[filename] || {};
          idx[filename]['__' + type] = fileStats.size;
          idx[filename]['__type'] = dirType;
        } else {
          idx[item] = idx[item] || {};
        }
        if (arr.length > 0) {
          idx[item] = build(idx[item], arr);
        }
        return idx;
      }
      index = build(index, remainder);
      next();
    });

    /* istanbul ignore next */
    walker.on('errors', function (root, nodeStatsArray) {
      console.log(root, nodeStatsArray);
      throw new Error(root);
    });

    walker.on('end', function () {
      callback(index);
    });
  },

  readConfigs: function readConfigs(dir, callback) {
    callback = callback || {};
    var configs = {};
    var walker = walk.walk(dir, {});
    walker.on('file', function (root, fileStats, next) {
      if (String(fileStats.name).indexOf('config.json') === -1) {
        next();
        return;
      }
      var pathStr = util.path.getDocRoot(root);
      var dirs = String(pathStr).split(path.sep);
      var lib = dirs.pop();
      var contents = undefined;
      try {
        contents = fs.readFileSync('' + path.normalize(root) + path.sep + fileStats.name, { encoding: 'utf-8' });
        contents = JSON.parse(contents);
      } catch (e) {}
      configs[lib] = contents;
      next();
    });

    /* istanbul ignore next */
    walker.on('errors', function (root, nodeStatsArray) {
      console.log(root, nodeStatsArray);
      throw new Error(root);
    });

    walker.on('end', function () {
      callback(configs);
    });
  },

  applyConfigs: function applyConfigs(idx, configs) {
    var _loop = function (lib) {
      var methods = configs[lib].methods || [];
      var properties = configs[lib].properties || [];
      var docs = configs[lib].docs || [];
      var docSequence = configs[lib].docSequence || [];
      //console.log(docSequence);
      if (idx[lib]) {
        util.each(idx[lib], function (key, node, tree) {
          var newTree = _.clone(tree);
          newTree.push(key);
          var treePath = newTree.join(path.sep);
          if (_.isObject(node[key])) {
            if (methods.indexOf(treePath) > -1) {
              node[key].__class = 'method';
            } else if (properties.indexOf(treePath) > -1) {
              node[key].__class = 'property';
            } else {
              var found = false;
              for (var i = 0; i < docs.length; ++i) {
                if (treePath.slice(0, docs[i].length) === docs[i] || docs[i].slice(0, key.length) === key) {
                  if (docSequence[treePath]) {
                    node[key].__seq = docSequence[treePath];
                  }
                  node[key].__class = 'doc';
                  found = true;
                  break;
                }
              }
              if (!found) {
                // If we still haven't found it, see if its
                // an object, like `foo` in `foo/bar`.
                var combined = methods.concat(properties);
                for (var i = 0; i < combined.length; ++i) {
                  var parts = combined[i].split(path.sep);
                  var _idx = parts.indexOf(key);
                  if (_idx > -1 && _idx != parts.length - 1) {
                    node[key].__class = 'object';
                    //console.log(key);
                  }
                }
              }
            }
          }
        });
      }
      //console.log(methods);
      //console.log(properties);
    };

    for (var lib in configs) {
      _loop(lib);
    }

    return idx;
  },

  applyLibs: function applyLibs(idx) {
    // Make the __class lib automatically.
    Object.keys(idx).map(function (value) {
      idx[value].__class = 'lib';
    });
    return idx;
  },

  applyAutodocs: function applyAutodocs(idx, autodocs) {
    // Throw downloadable auto-doc libraries in the index.
    Object.keys(autodocs).forEach(function (item) {
      var exists = idx[item] !== undefined ? true : false;
      if (!exists) {
        idx[item] = { __class: 'unbuilt-lib' };
      }
    });

    return idx;
  },

  /**
  * Does a safe merge, where the local
  * data is considered invalid where it
  * conflicts with official data contained
  * in the project folder. By local is meant
  * tmp/ data.
  *
  * @param {Object} official
  * @param {Object} local
  * @return {Object} merged
  * @api public
  */

  merge: function merge(official, local) {
    var result = {};
    for (var item in official) {
      if (official.hasOwnProperty(item)) {
        result[item] = official[item];
      }
    }
    for (var item in local) {
      if (local.hasOwnProperty(item)) {
        var nonexistent = result[item] === undefined;
        var unbuilt = result[item] && result[item].__class === 'unbuilt-lib';
        if (nonexistent || unbuilt) {
          result[item] = local[item];
        }
      }
    }
    return result;
  },

  /**
  * Writes an index JSON to the disk.
  *
  * @param {Object} json
  * @api public
  */

  write: function write(remoteIdx, localIdx, options) {
    var self = this;
    options = options || {
      'static': false
    };
    if (options['static'] === true && remoteIdx) {
      fs.writeFileSync(path.normalize(this.app.clerk.paths['static'].root + 'config/index.json'), JSON.stringify(remoteIdx, null));
      this._remoteIndex = remoteIdx;
      self.app.clerk.config.setStatic('docIndexLastWrite', new Date());
      self.app.clerk.config.setStatic('docIndexSize', String(JSON.stringify(remoteIdx)).length);
    } else if (remoteIdx) {
      fs.writeFileSync(this.app.clerk.paths.temp.index, JSON.stringify(remoteIdx, null));
      self.app.clerk.config.setLocal('docIndexLastWrite', new Date());
      self.app.clerk.config.setLocal('docIndexSize', String(JSON.stringify(remoteIdx)).length);
      this._remoteIndex = remoteIdx;
    }
    if (localIdx) {
      fs.writeFileSync(this.app.clerk.paths.temp.localIndex, JSON.stringify(localIdx, null));
      this._localIndex = localIdx;
    }
    this._mergedIndex = this.merge(this._remoteIndex, this._localIndex);
    return this;
  },

  /**
  * Retrieves the index.json as it
  * sees fit.
  *
  * @return {Object} json
  * @api public
  */

  index: function index() {
    var self = this;
    function readSafely(path) {
      var result = undefined;
      try {
        result = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));
      } catch (e) {
        /* istanbul ignore next */
        result = {};
      }
      return result;
    }
    if (!this._remoteIndex || !this._localIndex || this._mergedIndex) {
      this._localIndex = readSafely(this.app.clerk.paths.temp.localIndex);
      this._remoteIndex = readSafely(this.app.clerk.paths.temp.index);
      this._mergedIndex = this.merge(this._remoteIndex, this._localIndex) || {};
    }
    return this._mergedIndex;
  },

  /**
  * Pulls the index.json from the
  * main github doc repo.
  *
  * @param {function} callback
  * @api public
  */

  getRemoteIndex: function getRemoteIndex(callback) {
    var self = this;
    util.fetchRemote(self.clerk.paths.remote.config + 'index.json', function (err, data) {
      if (!err) {
        var err2 = false;
        var json = undefined;
        try {
          json = JSON.parse(data);
        } catch (e) {
          /* istanbul ignore next */
          err2 = true;
          /* istanbul ignore next */
          callback('Error parsing remote index json: ' + data + ', Error: ' + e + ', url: ' + self.clerk.paths.remote.config + 'index.json');
        }
        if (!err2) {
          callback(undefined, json);
        }
      } else {
        /* istanbul ignore next */
        callback(err);
      }
    });
  },

  /**
  * Interval that checks the
  * config.json online to see if the
  * index.json has changed. We go through
  * this hoop as the index.json will eventually
  * be huge, and that would be really messed up
  * to have every wat client on earth
  * pulling that regardless of updates or
  * not. And github might sue me.
  *
  * If { force: true } is passed in as an
  * option, update regardless of whether or
  * not we think the index change or if it's
  * past curfew.
  *
  * @param {Object} options
  * @api public
  */

  update: function update(options, callback) {
    options = options || {};
    callback = callback || function () {};
    var self = indexer;
    var sinceUpdate = undefined;

    // If we can't read the file,
    // assume we just download it newly.
    try {
      var stats = fs.statSync(this.app.clerk.paths.temp.index);
      sinceUpdate = Math.floor(new Date() - stats.mtime);
    } catch (e) {}

    if (sinceUpdate > self._updateInterval || !sinceUpdate || options.force === true) {
      self.clerk.config.getRemote(function (err, remote) {
        if (!err) {
          var local = self.clerk.config.getLocal();
          var staticConfig = self.clerk.config.getStatic();
          var localSize = parseFloat(local.docIndexSize || 0);
          var remoteSize = parseFloat(remote.docIndexSize || -1);
          if (localSize !== remoteSize || options.force === true) {
            self.getRemoteIndex(function (err, index) {
              if (err) {
                /* istanbul ignore next */
                throw new Error(err);
              } else {
                self.write(index);
                self.app.clerk.indexer.build(function (remoteIndex, tempIndex) {
                  self.app.clerk.indexer.write(undefined, tempIndex, options);
                  // Check what docs we don't have locally,
                  // and throw them into the updater.
                  try {
                    self.clerk.compareDocs();
                  } catch (e) {
                    console.log('HI', e);
                  }
                  callback(undefined, 'Successfully updated index.');
                });
              }
            });
          }
          /* istanbul ignore next */
        } else if (String(err).indexOf('Not Found') > -1) {
            var lellow = chalk.yellow('\nWat could not locate the remote config directory and so does not know where to pull docs from.\nRe-installing your instance of Wat through NPM should solve this problem.');
            var error = lellow + '\n\nUrl Attempted: ' + self.clerk.paths.remote.config + 'config.json';
            console.log(error);
            throw new Error(err);
            /* istanbul ignore next */
          } else if (err.code === 'EAI_AGAIN') {
              var error = chalk.yellow('\n\nEr, Wat\'s having DNS resolution errors. Are you sure you\'re connected to the internet?');
              console.log(error);
              throw new Error(err);
              /* istanbul ignore next */
            } else if (err.code === 'ETIMEDOUT') {
                var error = chalk.yellow('\n\nHmm.. Wat had a connection timeout when trying to fetch its index. \nHow\'s that internet connection looking?');
                console.log(error);
                /* istanbul ignore next */
              } else {
                  console.log(chalk.yellow('\nWat had an unexpected error while requesting the remote index:\n'));
                  console.log(err);
                }
      });
    }
  }
};

module.exports = function (app) {
  indexer.app = app;
  return indexer;
};