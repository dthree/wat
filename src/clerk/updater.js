'use strict';

/**
 * Module dependencies.
 */

const fs = require('fs');
const util = require('../util');

const updater = {

  queue: [],

  push(obj) {
    if (this.queue.indexOf(obj) === -1) {
      this.queue.push(obj);
    }
  },

  nextQueueItem() {
    const self = updater;
    const item = self.queue.shift();
    const lastAction = (!self.app.clerk.lastUserAction) ? 10000000 : (new Date() - self.app.clerk.lastUserAction);
    if (item && lastAction > 10000) {
      const partial = String(item).split('docs/');
      const url = (partial.length > 1) ? partial[1] : partial[0];
      util.fetchRemote(self.app.clerk.paths.remote.docs + url, function (err, data) {
        if (err) {
          console.log('PROBLEM...');
          console.log(err);
        } else {
          self.app.clerk.file(url, data);
          self.app.clerk.history.push({
            type: 'update',
            value: url
          });
        }
      });
    }
  }
};

module.exports = function (app) {
  updater.app = app;
  return updater;
};
