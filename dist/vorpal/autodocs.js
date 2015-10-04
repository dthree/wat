'use strict';

var chalk = require('chalk');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('fetch <lib>', 'Automatically downloads and builds a given library.').option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.').action(function (args, cb) {
    var self = this;
    var options = {};
    //self.delimiter(origDelimiter);
    options.rebuild = args.options.rebuild || true;
    app.autodocs.run(args.lib, options, function () {
      cb();
    });
  });

  vorpal.command('delete <lib>', 'Delete an auto-built library.').option('-r, --rebuild', 'Rebuild index after complete. Defaults to true.').action(function (args, cb) {
    var self = this;

    function progress(lib) {
      self.log('Deleting ' + lib + '.');
    }

    function back(err) {
      if (err) {
        self.log(chalk.yellow(err));
      }
      cb();
    }
    if (args.lib === 'all') {
      app.autodocs.deleteAll({ progress: progress }, back);
    } else {
      app.autodocs['delete'](args.lib, {}, back);
    }
  });

  vorpal.command('get fetchable', 'Lists libraries able to be be auto-built.').option('-m, --max <amt>', 'Maximum libraries items to show.').alias('get fetch').action(function (args, cb) {
    var self = this;
    var max = args.options.max || 30;
    var config = app.clerk.updater.config();
    var items = '\n  ' + Object.keys(config).join('\n  ') + '\n';
    this.log(items);
    cb();
  });
};