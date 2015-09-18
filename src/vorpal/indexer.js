'use strict';

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('index', 'Updates the index based on local docs.')
    .action(function (args, cb) {
      const self = this;

      app.clerk.indexer.build(function(index, localIndex){
        app.clerk.indexer.write(index, localIndex);
        self.log('Rebuilt index.');
        cb();
      });
    });
};

