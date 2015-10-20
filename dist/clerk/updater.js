'use strict';

var util = require('../util');
var path = require('path');

var updater = {

  queue: [],

  push: function push(obj) {
    if (this.queue.indexOf(obj) === -1) {
      this.queue.push(obj);
    }
  },

  nextQueueItem: function nextQueueItem() {
    var self = updater;
    var item = self.queue.shift();
    var lastAction = !self.app.clerk.lastUserAction ? 10000000 : new Date() - self.app.clerk.lastUserAction;
    if (item && lastAction > 10000) {
      (function () {
        var partial = String(item).split('docs' + path.sep);
        var url = partial.length > 1 ? partial[1] : partial[0];
        util.fetchRemote(self.app.clerk.paths.remote.docs + url, function (err, data) {
          if (err) {
            console.log('Error fetching update for ' + self.app.clerk.paths.remote.docs + url + ': ' + err);
          } else {
            self.app.clerk.file(url, 'static', data);
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