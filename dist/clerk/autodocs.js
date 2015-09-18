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
      var config = fs.readFileSync(self.app.clerk.paths['static'].autoConfig, { encoding: 'utf-8' });
      config = JSON.parse(config);
      self._config = config;
    } catch (e) {
      console.log(e.stack);
    }
    return self._config;
  }

};

module.exports = function (app) {
  autodocs.app = app;
  return autodocs;
};