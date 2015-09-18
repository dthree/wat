'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');

const autodocs = {

  _config: [],

  config() {
    const self = autodocs;
    try {
      let config = fs.readFileSync(self.app.clerk.paths.static.autoConfig, {encoding: 'utf-8'});
      config = JSON.parse(config);
      self._config = config;
    } catch(e) {
      console.log(e.stack)
    }
    return self._config;
  },

};

module.exports = function (app) {
  autodocs.app = app;
  return autodocs;
};
