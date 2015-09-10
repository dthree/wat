'use strict';

module.exports = function (vorpal, options) {
  var parent = options.parent;

  vorpal.command('index', 'Updates the index based on local docs.').action(function (args, cb) {
    var self = this;
    parent.clerk.indexer.build(function (index) {
      parent.clerk.indexer.write(index);
      self.log('Rebuilt index.');
      cb();
    });
  });
};