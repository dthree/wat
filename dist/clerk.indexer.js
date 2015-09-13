'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var walk = require('walk');
var fs = require('fs');
var path = require('path');
var util = require('./util');
var chalk = require('chalk');

var indexer = {

  // The JSON of the index.
  _index: undefined,

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

  init: function init(parent) {
    this.parent = parent;
  },

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
      }, 6000);
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
    var auto = undefined;
    var normal = undefined;
    var autoConfigs = {};
    var normalConfigs = {};
    var dones = 0;
    function checker() {
      dones++;
      if (dones === 4) {
        //console.log(normal);
        //console.log('----------')
        //console.log(auto);
        //console.log('----------')
        var idx = self.merge(normal, auto);
        var configs = self.merge(normalConfigs, autoConfigs);
        var final = self.applyConfigs(idx, configs);
        callback(final);
      }
    }
    this.buildDir(path.normalize(__dirname + '/../autodocs/'), 'auto', function (data) {
      auto = data;
      checker();
    });
    this.buildDir(path.normalize(__dirname + '/../docs/'), 'static', function (data) {
      normal = data;
      checker();
    });
    this.readConfigs(path.normalize(__dirname + '/../autodocs/'), 'auto', function (data) {
      autoConfigs = data || {};
      checker();
    });
    this.readConfigs(path.normalize(__dirname + '/../docs/'), 'auto', function (data) {
      normalConfigs = data || {};
      checker();
    });
  },

  buildDir: function buildDir(dir, dirType, callback) {
    callback = callback || {};
    var index = {};
    var walker = walk.walk(dir, {});
    walker.on('file', function (root, fileStats, next) {
      var parts = String(path.normalize(root)).split('docs/');
      if (parts[1] === undefined) {
        console.log('Invalid path passed into wat.indexer.build: ' + root);
        next();
        return;
      }
      if (String(fileStats.name).indexOf('.json') > -1) {
        next();
        return;
      }
      var file = parts[1];
      var dirs = String(path.normalize(file)).split('/');
      dirs.push(fileStats.name);
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

    walker.on('errors', function (root, nodeStatsArray) {
      console.log(root, nodeStatsArray);
      throw new Error(root);
    });

    walker.on('end', function () {
      callback(index);
    });
  },

  readConfigs: function readConfigs(dir, dirType, callback) {
    callback = callback || {};
    var configs = {};
    var walker = walk.walk(dir, {});
    walker.on('file', function (root, fileStats, next) {
      var parts = String(path.normalize(root)).split('docs/');
      if (parts[1] === undefined) {
        console.log('Invalid path passed into wat.indexer.build: ' + root);
        next();
        return;
      }
      if (String(fileStats.name).indexOf('config.json') === -1) {
        next();
        return;
      }
      var dirParts = String(parts[1]).split('/');
      var lib = dirParts.pop();
      var contents = undefined;
      try {
        contents = fs.readFileSync(root + '/' + fileStats.name, { encoding: 'utf-8' });
        contents = JSON.parse(contents);
      } catch (e) {}
      configs[lib] = contents;
      next();
    });

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
      if (idx[lib]) {
        util.each(idx[lib], function (key, node, tree) {
          var newTree = _.clone(tree);
          newTree.push(key);
          var treePath = newTree.join('/');
          if (_.isObject(node[key])) {
            if (methods.indexOf(treePath) > -1) {
              node[key].__class = 'method';
            } else if (properties.indexOf(treePath) > -1) {
              node[key].__class = 'property';
            } else {
              var found = false;
              for (var i = 0; i < docs.length; ++i) {
                if (treePath.slice(0, docs[i].length) === docs[i] || docs[i].slice(0, key.length) === key) {
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
                  var parts = combined[i].split('/');
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

  merge: function merge(a, b) {
    for (var item in b) {
      if (b.hasOwnProperty(item)) {
        if (a[item] === undefined) {
          a[item] = b[item];
        }
      }
    }
    return a;
  },

  /**
  * Writes an index JSON to the disk.
  *
  * @param {Object} json
  * @api public
  */

  write: function write(json) {
    var index = JSON.stringify(json, null, '');
    var result = fs.writeFileSync(__dirname + '/../config/index.json', JSON.stringify(json, null, '  '));
    this._index = json;
    indexer.clerk.config.setLocal('docIndexLastWrite', new Date());
    indexer.clerk.config.setLocal('docIndexSize', String(index).length);
    return result;
  },

  /**
  * Retrieves the index.json as it
  * sees fit.
  *
  * @return {Object} json
  * @api public
  */

  index: function index() {
    if (!this._index) {
      try {
        var index = fs.readFileSync(__dirname + '/../config/index.json', { encoding: 'utf-8' });
        var json = JSON.parse(index);
        this._index = json;
      } catch (e) {
        this._index = undefined;
        return undefined;
      }
    }
    return this._index;
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
    util.fetchRemote(self.clerk.paths.remoteConfigUrl + 'index.json', function (err, data) {
      if (!err) {
        var err2 = false;
        var json = undefined;
        try {
          json = JSON.parse(data);
        } catch (e) {
          err2 = true;
          callback('Error parsing remote index json: ' + data + ', Error: ' + e + ', url: ' + self.clerk.paths.remoteConfigUrl + 'index.json');
        }
        if (!err2) {
          callback(undefined, json);
        }
      } else {
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
      var stats = fs.statSync(path.join(__dirname, '/../config/index.json'));
      sinceUpdate = Math.floor(new Date() - stats.mtime);
    } catch (e) {}

    if (sinceUpdate > self._updateInterval || !sinceUpdate || options.force === true) {
      self.clerk.config.getRemote(function (err, remote) {
        if (!err) {
          var local = self.clerk.config.getLocal();
          var localSize = parseFloat(local.docIndexSize || 0);
          var remoteSize = parseFloat(remote.docIndexSize || -1);
          if (localSize !== remoteSize || options.force === true) {
            self.getRemoteIndex(function (err, index) {
              if (err) {
                console.log(err);
              } else {
                self.write(index);
                self.clerk.compareDocs();
                callback(undefined, 'Successfully updated index.');
              }
            });
          }
        } else if (String(err).indexOf('Not Found') > -1) {
          var lellow = chalk.yellow('\nWat could not locate the remote config directory and so does not know where to pull docs from.\nRe-installing your instance of Wat through NPM should solve this problem.');
          var error = lellow + '\n\nUrl Attempted: ' + self.clerk.paths.remoteConfigUrl + 'config.json';
          console.log(error);
          throw new Error(err);
        } else if (err.code === 'EAI_AGAIN') {
          var error = chalk.yellow('\n\nEr, Wat\'s having DNS resolution errors. Are you sure you\'re connected to the internet?');
          console.log(error);
          throw new Error(err);
        } else if (err.code === 'ETIMEDOUT') {
          var error = chalk.yellow('\n\nHmm.. Wat had a connection timeout when trying to fetch its index. \nHow\'s that internet connection looking?');
          console.log(error);
        } else {
          console.log(chalk.yellow('\nWat had an unexpected error while requesting the remote index:\n'));
          console.log(err);
        }
      });
    }
  }
};

module.exports = indexer;