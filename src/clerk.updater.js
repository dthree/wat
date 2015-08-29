"use strict";

/**
 * Module dependencies.
 */

const util = require('./util');

const updater = {

  queue: [],

  init(parent) {
    this.parent = parent;
  },

  push(obj) {
    if (this.queue.indexOf(obj) === -1) {
      this.queue.push(obj);
    }
  },

  nextQueueItem() {
    const self = updater;
    let item = self.queue.shift();
    let lastAction = (!self.parent.lastUserAction) ? 10000000 : (new Date() - self.parent.lastUserAction);
    if (item && lastAction > 10000) {
      let partial = String(item).split('docs/');
      let url  = (partial.length > 1) ? partial[1] : partial[0];
      util.fetchRemote(self.parent.paths.remoteDocUrl + url, function(err, data) {
        if (err) {
          console.log('PROBLEM...');
          console.log(err);
        } else {
          self.parent.file(url, data);
          self.parent.history.push({
            type: 'update',
            value: url
          });
        }
      });
    }
  }

}

module.exports = updater;

