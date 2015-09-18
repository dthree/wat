'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

var prefs = {

  _prefs: {},

  get: function get() {
    var self = prefs;
    try {
      var _prefs = fs.readFileSync(self.app.clerk.paths.temp.prefs, { encoding: 'utf-8' });
      _prefs = JSON.parse(_prefs);
      self._prefs = _prefs;
    } catch (e) {}
    return self._prefs;
  },

  set: function set(key, value) {
    var self = prefs;
    if (key && value) {
      self._prefs[key] = value;
    }
    fs.writeFileSync(self.app.clerk.paths.temp.prefs, JSON.stringify(self._prefs, null, '  '));
  }
};

module.exports = function (app) {
  prefs.app = app;
  return prefs;
};