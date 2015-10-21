'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

var autodocs = {

  _config: [],

  config: function config() {
    var self = autodocs;
    try {
      var config = fs.readFileSync(self.app.clerk.paths.temp.autoConfig, { encoding: 'utf-8' });
      config = JSON.parse(config);
      self._config = config;
    } catch (e) {
      self._config = {};
      //console.log(e.stack);
    }
    return self._config;
  },

  write: function write(json) {
    var self = this;
    fs.writeFileSync(this.app.clerk.paths.temp.autoConfig, JSON.stringify(json));
    self.app.clerk.config.setLocal('autodocsSize', String(JSON.stringify(json)).length);
    self._config = json;
    return this;
  }

};

module.exports = function (app) {
  autodocs.app = app;
  return autodocs;
};