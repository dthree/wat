'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');

var prefs = {

  _prefs: {},

  init: function init(parent) {
    this.parent = parent;
  },

  get: function get() {
    var self = prefs;
    try {
      var _prefs = fs.readFileSync(self.parent.paths.prefs, { encoding: 'utf-8' });
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
    fs.writeFileSync(self.parent.paths.prefs, JSON.stringify(self._prefs, null, '  '));
  }
};

module.exports = prefs;