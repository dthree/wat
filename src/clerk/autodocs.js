'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');

const autodocs = {

  _config: [],

  config() {
    const self = autodocs;
    const readPath = (this.app.updateRemotely === false) ? 
      this.app.clerk.paths.temp.autoConfig : 
      this.app.clerk.paths.static.autoConfig;
    try {
      let config = fs.readFileSync(readPath, {encoding: 'utf-8'});
      config = JSON.parse(config);
      self._config = config;
    } catch (e) {
      self._config = {}
      //console.log(e.stack);
    }
    return self._config;
  },

  write(json) {
    const self = this;

    const writeMethod = (this.app.updateRemotely === false) ? 'setStatic' : 'setLocal';
    const writePath = this.app.clerk.paths.temp.autoConfig; 
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
