'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('../util');

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

const config = {

  _config: undefined,

  _staticConfig: undefined,

  getStatic() {
    const self = this;
    let config;
    try {
      config = JSON.parse(fs.readFileSync(self.app.clerk.paths.static.config, {encoding: 'utf-8'}));
      this._staticConfig = config;
    } catch(e) {
      console.log(chalk.yellow(`\n\nHouston, we have a problem.\nWat can\'t read its static config file, which should be at ${this.app.clerk.paths.static.config}. Without this, Wat can\'t do much. Try re-installing Wat from scratch.\n\nIf that doesn\'t work, please file an issue.\n`));
      throw new Error(e);
    }
    const tempStatic = this._staticConfig || {}
    self.app.clerk.paths.remote.docs = tempStatic.remoteDocUrl || self.app.clerk.paths.remote.docs;
    self.app.clerk.paths.remote.autodocs = tempStatic.remoteAutodocUrl || self.app.clerk.paths.remote.autodocs;
    self.app.clerk.paths.remote.config = tempStatic.remoteConfigUrl || self.app.clerk.paths.remote.config;
    self.app.clerk.paths.remote.archive = tempStatic.remoteArchiveUrl || self.app.clerk.paths.remote.archive;
    return config;
  },

  getLocal() {
    let config;
    if (!this._config) {
      try {
        config = JSON.parse(fs.readFileSync(this.app.clerk.paths.temp.config, {encoding: 'utf-8'}));
        this._config = config;
      } catch(e) {
        console.log(chalk.yellow(`\n\nHouston, we have a problem.\nWat can\'t read its local config file, which should be at ${this.app.clerk.paths.temp.config}. Without this, Wat can\'t do much. Try re-installing Wat from scratch.\n\nIf that doesn\'t work, please file an issue.\n`));
        throw new Error(e);
      }
    } else {
      config = this._config;
    }
    return config;
  },

  getRemote(callback) {
    callback = callback || function () {};
    const self = this;
    const url = `${self.app.clerk.paths.remote.config}config.json`;
    util.fetchRemote(url, function (err, data) {
      if (!err) {
        try {
          const json = JSON.parse(data);
          callback(undefined, json);
        } catch(e) {
          callback(`Error parsing json: ${data}, Error: ${e}, url: ${url}`);
        }
      } else {
        callback(err);
      }
    });
  },

  setLocal(key, value) {
    const self = this;
    if (key && value) {
      this._config[key] = value;
    }
    fs.writeFileSync(self.app.clerk.paths.temp.config, JSON.stringify(this._config, null, '  '));
  },

  setStatic(key, value) {
    const self = this;
    if (key && value) {
      this._staticConfig[key] = value;
    }
    fs.writeFileSync(self.app.clerk.paths.static.config, JSON.stringify(this._staticConfig, null, '  '));
  },

  writeLocal(data) {
    data = data || this._config;
    this._config = data;
    fs.writeFileSync(this.app.clerk.paths.temp.config, JSON.stringify(data));
    return this;
  }

};

module.exports = function (app) {
  config.app = app;
  return config;
};
