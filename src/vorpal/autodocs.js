'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('fetch <lib>', 'Automatically downloads and builds a given library.')
    .option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.')
    .action(function (args, cb) {
      const self = this;
      let options = {}
      //self.delimiter(origDelimiter);
      options.rebuild = args.options.rebuild || true;
      app.autodocs.run(args.lib, options, function() {
        cb();
      });
    });

  vorpal
    .command('delete <lib>', 'Delete an auto-built library.')
    .option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.')
    .action(function (args, cb) {
      const self = this;
      let options = {}
      //options.rebuild = args.options.rebuild || true;
      app.autodocs.delete(args.lib, options, function(err) {
        if (err) { 
          self.log(chalk.yellow(err));
        }
        cb();
      });
    });

  vorpal
    .command('get fetchable', 'Lists libraries able to be be auto-built.')
    .option('-m, --max <amt>', 'Maximum libraries items to show.')
    .alias('get fetch')
    .action(function (args, cb) {
      const self = this;
      const max = args.options.max || 30;
      const config = app.clerk.updater.config();
      let items = `\n  ${Object.keys(config).join('\n  ')}\n`;
      this.log(items);
      cb();
    });


};
