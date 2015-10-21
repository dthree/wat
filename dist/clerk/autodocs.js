'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

var autodocs = {

  _config: [],

  config: function config() {
    var self = autodocs;
    var readPath = this.app.updateRemotely === false ? this.app.clerk.paths.temp.autoConfig : this.app.clerk.paths['static'].autoConfig;
    try {
      var config = fs.readFileSync(readPath, { encoding: 'utf-8' });
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

    var writeMethod = this.app.updateRemotely === false ? 'setStatic' : 'setLocal';
    var writePath = this.app.clerk.paths.temp.autoConfig;
    fs.writeFileSync(writePath, JSON.stringify(json, null, '  '));
    self.app.clerk.config[writeMethod]('autodocsSize', String(JSON.stringify(json)).length);
    self._config = json;
    return this;
  }

};

module.exports = function (app) {
  autodocs.app = app;
  return autodocs;
};