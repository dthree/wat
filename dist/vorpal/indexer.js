'use strict';

var chalk = require('chalk');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('index', 'Updates the index based on local docs.').alias('update').option('-s, --static', 'Overrides static files, for building and submitting new docs.').action(function (args, cb) {
    var self = this;
    var isStatic = args.options['static'] || false;
    app.clerk.indexer.update({ force: true, 'static': isStatic }, function (err, data) {
      if (!err) {
        self.log(chalk.cyan('\n  Successfully updated index.'));
        var amt = app.clerk.updater.queue.length;
        if (amt > 1) {
          self.log('\n  ' + amt + ' documents are queued for updating.');
        }
        self.log(' ');
        cb();
      } else {
        self.log('Error');
        self.log(err, data);
        cb();
      }
    });
  });
};