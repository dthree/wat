"use strict";

/**
 * Module dependencies.
 */

const fs = require('fs');

const prefs = {

  _prefs: {},

  init(parent) {
    this.parent = parent;
  },

  get() {
    const self = prefs;
    try {
      let prefs = fs.readFileSync(self.parent.paths.prefs, { encoding: 'utf-8' });
      prefs = JSON.parse(prefs);
      self._prefs = prefs;
    } catch(e) {}
    return self._prefs;
  },

  set(key, value) {
    const self = prefs;
    if (key && value) {
      self._prefs[key] = value;
    }
    fs.writeFileSync(self.parent.paths.prefs, JSON.stringify(self._prefs, null, '  '));
  }
}

module.exports = prefs;

