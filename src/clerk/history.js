'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');

/**
 * History stores records of the most recent commands,
 * which is kept for the user's convenience and reference,
 * as well as so as to optimize remote storage of
 * the user's most used languages.
 */

const history = {

  _hist: [],

  _adds: 0,

  _lastWrite: new Date(),

  _max: 600,

  getLocal() {
    let hist;
    if (!this._hist || this._hist.length === 0) {
      try {
        hist = fs.readFileSync(this.app.clerk.paths.temp.hist, {encoding: 'utf-8'});
        hist = JSON.parse(hist);
        this._hist = hist;
      } catch (e) {
        this._hist = [];
      }
    }
    return this._hist;
  },

  push(obj) {
    obj = obj || {
      type: 'unknown'
    };
    obj.date = new Date();
    this._hist.push(obj);
    this._adds++;
  },

  worker() {
    const self = this;
    const lastWrite = new Date() - self._lastWrite;
    let write = false;
    if (self._adds > 5) {
      write = true;
    } else if (self._adds > 0 && lastWrite > 30000) {
      write = true;
    }

    if (write) {
      self._adds = 0;
      self._lastWrite = new Date();
      self.write();
    }
  },

  write() {
    if (this._hist.length > this._max) {
      this._hist = this._hist.slice(this._hist.length - this._max);
    }
    fs.writeFileSync(this.app.clerk.paths.temp.hist, JSON.stringify(this._hist));
    return this;
  }
};

module.exports = function (app) {
  history.app = app;
  return history;
};
