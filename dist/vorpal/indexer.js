'use strict';

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('index', 'Updates the index based on local docs.').option('-s, --static', 'Overrides static files, for building and submitting new docs.').action(function (args, cb) {
    var self = this;
    var options = {
      'static': args.options['static'] || false
    };
    app.clerk.indexer.build(function (staticIndex, tempIndex) {
      staticIndex = options['static'] === true ? staticIndex : undefined;
      app.clerk.indexer.write(staticIndex, tempIndex, options);
      self.log('Rebuilt index.');
      cb();
    });
  });
};