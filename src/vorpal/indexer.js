'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('index', 'Updates the index based on local docs.')
    .alias('update')
    .option('-s, --static', 'Overrides static files, for building and submitting new docs.')
    .action(function (args, cb) {
      const self = this;
      const isStatic = args.options.static || false;
      app.clerk.indexer.update({force: true, static: isStatic}, function (err) {
        if (!err) {
          self.log(chalk.cyan('\n  Successfully updated index.'));
          const amt = app.clerk.updater.queue.length;
          if (amt > 1) {
            self.log(`\n  ${amt} documents are queued for updating.`);
          }
          self.log(' ');
          cb();
        }
      });
    });
};

