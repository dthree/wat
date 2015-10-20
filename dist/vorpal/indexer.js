'use strict';

var chalk = require('chalk');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('index', 'Updates the index based on local docs.').alias('update').option('-s, --static', 'Overrides static files, for building and submitting new docs.').action(function (args, cb) {
    var self = this;
    var isStatic = args.options['static'] || false;
    isStatic = app.updateRemotely === false ? true : isStatic;

    app.clerk.indexer.update({ force: true, 'static': isStatic }, function (err, data) {
      if (!err) {
        self.log(chalk.cyan('\n  Successfully updated index.'));
        var amt = app.clerk.updater.queue.length;
        if (amt > 1) {
          self.log('\n  ' + amt + ' documents are queued for updating.');
        }
        if (app.updateRemotely === false) {
          app.clerk.indexer.build(function (index) {
            app.clerk.indexer.write(index, undefined, { 'static': true });
            vorpal.log(chalk.cyan('\n  Sucessfully rebuilt index.\n'));
            cb();
          });
        } else {
          self.log(' ');
          cb();
        }
      } else {
        self.log('Error');
        self.log(err, data);
        cb();
      }
    });
  });
};