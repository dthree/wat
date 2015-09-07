'use strict';

/**
 * Module dependencies.
 */

var util = require('./util');
var fs = require('fs');

var updater = {

  queue: [],

  init: function init(parent) {
    this.parent = parent;
  },

  push: function push(obj) {
    if (this.queue.indexOf(obj) === -1) {
      this.queue.push(obj);
    }
  },

  config: function config() {
    var self = updater;
    try {
      var config = fs.readFileSync(self.parent.paths.autoConfig, { encoding: 'utf-8' });
      config = JSON.parse(config);
      self._config = config;
    } catch (e) {
      console.log('WTF', e);
    }
    return self._config;
  },

  nextQueueItem: function nextQueueItem() {
    var self = updater;
    var item = self.queue.shift();
    var lastAction = !self.parent.lastUserAction ? 10000000 : new Date() - self.parent.lastUserAction;
    if (item && lastAction > 10000) {
      (function () {
        var partial = String(item).split('docs/');
        var url = partial.length > 1 ? partial[1] : partial[0];
        util.fetchRemote(self.parent.paths.remoteDocUrl + url, function (err, data) {
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
      })();
    }
  }
};

module.exports = updater;