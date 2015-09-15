'use strict';

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('index', 'Updates the index based on local docs.').action(function (args, cb) {
    var self = this;
    app.clerk.indexer.build(function (index) {
      app.clerk.indexer.write(index);
      self.log('Rebuilt index.');
      cb();
    });
  });
};