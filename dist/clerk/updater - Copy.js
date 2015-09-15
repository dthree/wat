'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var util = require('../util');

var updater = {

  queue: [],

  push: function push(obj) {
    if (this.queue.indexOf(obj) === -1) {
      this.queue.push(obj);
    }
  },

  config: function config() {
    var self = updater;
    try {
      var config = fs.readFileSync(__dirname + '/../../' + self.app.clerk.paths.autoConfig, { encoding: 'utf-8' });
      config = JSON.parse(config);
      self._config = config;
    } catch (e) {
      console.log(e.stack);
    }
    return self._config;
  },

  nextQueueItem: function nextQueueItem() {
    var self = updater;
    var item = self.queue.shift();
    var lastAction = !self.app.clerk.lastUserAction ? 10000000 : new Date() - self.app.clerk.lastUserAction;
    if (item && lastAction > 10000) {
      (function () {
        var partial = String(item).split('docs/');
        var url = partial.length > 1 ? partial[1] : partial[0];
        util.fetchRemote(self.app.clerk.paths.remoteDocUrl + url, function (err, data) {
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
      })();
    }
  }
};

module.exports = function (app) {
  updater.app = app;
  return updater;
};