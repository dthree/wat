'use strict';

var chalk = require('chalk');
var autodocs = require('./autodocs');

module.exports = function (vorpal, options) {
  var parent = options.parent;

  vorpal.command('update <lib>', 'Automatically rebuilds a given library.').option('-r, --rebuild', 'Rebuild index after complete.').action(function (args, cb) {
    var self = this;
    var origDelimiter = self.delimiter();
    var lib = String(args.lib).trim();
    var config = parent.clerk.updater.config();
    if (!config) {
      this.log('' + chalk.yellow('\n  Wat had trouble reading "./config/config.auto.json". \n'));
      cb();
      return;
    }

    var libs = [];

    if (lib === 'all') {
      libs = Object.keys(config);
    } else {
      if (!config[lib]) {
        this.log('' + chalk.yellow('\n  ' + lib + ' is not on Wat\'s list of auto-updating libraries.\n  To include it, add it to ./config/config.auto.json and submit a PR.\n'));
        cb();
        return;
      }
      libs.push(lib);
    }

    function handleLib(libName) {
      var data = config[libName];
      data.urls = data.urls || [];
      data.language = data.language || 'javascript';
      var options = {
        urls: data.urls,
        language: data.language,
        aliases: data.aliases,
        crawl: false,
        onFile: function onFile(data) {
          var total = data.total;
          var downloaded = data.downloaded;
        }
      };

      var result = autodocs.scaffold(libName, options, function (err, data) {
        if (libs.length < 1) {
          self.delimiter(origDelimiter);
          if (args.options.rebuild) {
            parent.clerk.indexer.build(function (index) {
              parent.clerk.indexer.write(index);
              self.log('Rebuilt index.');
              cb();
            });
          } else {
            cb();
          }
        } else {
          var _next = libs.shift();
          handleLib(_next);
        }
      });
    }

    var next = libs.shift();
    handleLib(next);
  });

  vorpal.command('update index', 'Forces an update of the document index.').action(function (args, cb) {
    var self = this;
    parent.clerk.indexer.update({ force: true }, function (err) {
      if (!err) {
        self.log(chalk.cyan('\n  Successfully updated index.'));
        var amt = parent.clerk.updater.queue.length;
        if (amt > 1) {
          self.log('\n  ' + amt + ' documents are queued for updating.');
        }
        self.log(' ');
        cb();
      }
    });
  });

  vorpal.command('get updatable', 'Lists libraries able to be be auto-rebuilt.').option('-m, --max', 'Maximum history items to show.').alias('get updateable').action(function (args, cb) {
    var self = this;
    var max = args.options.max || 30;
    var config = parent.clerk.updater.config();

    var items = '\n  ' + Object.keys(config).join('\n  ') + '\n';

    this.log(items);

    cb();
  });

  vorpal.command('get updates', 'Shows what docs are mid being updated.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
    var queue = parent.clerk.updater.queue;
    var max = args.options.max || 30;
    var limit = queue.length - 1 - max;
    limit = limit < 0 ? 0 : limit;
    if (queue.length > 0) {
      this.log(chalk.bold('\n  Command'));
    } else {
      this.log(chalk.bold('\n  No updates in the queue.\n  To do a fresh update, run the "' + chalk.cyan('update') + '" command.'));
    }
    for (var i = queue.length - 1; i > limit; i--) {
      var item = String(queue[i]).split('docs/');
      item = item.length > 1 ? item[1] : item[0];
      var cmd = String(item).split('/').join(' ');
      cmd = String(cmd).replace('.md', '');
      cmd = String(cmd).replace('.detail', chalk.gray(' (detailed)'));
      cmd = String(cmd).replace('.install', chalk.gray(' (install)'));
      cmd = String(cmd).replace(' index', chalk.gray(' '));
      this.log('  ' + cmd);
    }
    this.log(' ');
    cb();
  });
};