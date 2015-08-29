'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var util = require('./util');

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

var config = {

  _config: {},

  init: function init(parent) {
    this.parent = parent;
  },

  getLocal: function getLocal() {
    var self = this;
    try {
      var _config = fs.readFileSync(path.join(__dirname, '/../', self.parent.paths.config), { encoding: 'utf-8' });
      _config = JSON.parse(_config);
      this._config = _config;
    } catch (e) {
      var error = chalk.yellow('\n\nHouston, we have a problem.\nWat can\'t read its local config file, which should be at `./config/config.json`. Without this, Wat can\'t do much. Try re-installing Wat from scratch.\n\nIf that doesn\'t work, please file an issue.\n');
      console.log(error);
      throw new Error(e);
    }

    // Read local config on how to find remote data.
    self.parent.paths.remoteDocUrl = this._config.remoteDocUrl || self.parent.paths.remoteDocUrl;
    self.parent.paths.remoteConfigUrl = this._config.remoteConfigUrl || self.parent.paths.remoteConfigUrl;
    self.parent.paths.remoteArchiveUrl = this._config.remoteArchiveUrl || self.parent.paths.remoteArchiveUrl;
    return this._config;
  },

  getRemote: function getRemote(callback) {
    callback = callback || function () {};
    var self = this;
    var url = self.parent.paths.remoteConfigUrl + 'config.json';
    util.fetchRemote(url, function (err, data) {
      if (!err) {
        try {
          var json = JSON.parse(data);
          callback(undefined, json);
        } catch (e) {
          callback('Error parsing json: ' + data + ', Error: ' + e + ', url: ' + url);
        }
      } else {
        callback(err);
      }
    });
  },

  setLocal: function setLocal(key, value) {
    var self = this;
    if (key && value) {
      this._config[key] = value;
    }
    fs.writeFileSync(path.join(__dirname, '/../', self.parent.paths.config), JSON.stringify(this._config, null, '  '));
  }
};

module.exports = config;