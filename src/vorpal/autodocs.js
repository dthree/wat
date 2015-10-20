'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('fetch <lib>', 'Automatically downloads and builds a given library.')
    .option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.')
    .action(function (args, cb) {
      const options = {};
      options.rebuild = args.options.rebuild || true;
      options.done = cb;
      app.autodocs.run(args.lib, options);
    });

  vorpal
    .command('delete <lib>', 'Delete an auto-built library.')
    .option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.')
    .action(function (args, cb) {
      const self = this;

      function progress(lib) {
        self.log(`Deleting ${lib}.`);
      }

      function back(err) {
        if (err) {
          self.log(chalk.yellow(err));
        }
        cb();
      }
      if (args.lib === 'all') {
        app.autodocs.deleteAll({progress}, back);
      } else {
        app.autodocs.delete(args.lib, {}, back);
      }
    });
};
