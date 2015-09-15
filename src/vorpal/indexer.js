'use strict';

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('index', 'Updates the index based on local docs.')
    .action(function (args, cb) {
      const self = this;
      app.clerk.indexer.build(function(index){
        app.clerk.indexer.write(index);
        self.log('Rebuilt index.');
        cb();
      });
    });
};

