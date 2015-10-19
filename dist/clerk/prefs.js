'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

var prefs = {

  _prefs: {},

  get: function get(key) {
    var self = prefs;
    try {
      var _prefs = fs.readFileSync(self.app.clerk.paths.temp.prefs, { encoding: 'utf-8' });
      _prefs = JSON.parse(_prefs);
      self._prefs = _prefs;
    } catch (e) {}
    if (key === undefined) {
      return self._prefs;
    }
    return self._prefs[key];
  },

  set: function set(key, value) {
    var self = prefs;
    if (key !== undefined && value !== undefined) {
      self._prefs[key] = value;
    }
    fs.writeFileSync(self.app.clerk.paths.temp.prefs, JSON.stringify(self._prefs, null, '  '));
  }
};

module.exports = function (app) {
  prefs.app = app;
  return prefs;
};