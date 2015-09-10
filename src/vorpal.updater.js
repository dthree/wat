'use strict';

const chalk = require('chalk');
const parser = require('./parser');

module.exports = function (vorpal, options) {
  const parent = options.parent;

  vorpal
    .command('update <lib>', 'Automatically rebuilds a given library.')
    .option('-r, --rebuild', 'Rebuild index after complete.')
    .action(function (args, cb) {
      const self = this;
      let lib = String(args.lib).trim();
      let config = parent.clerk.updater.config();
      if (!config) {
        this.log(`${chalk.yellow(`\n  Wat had trouble reading "./config/config.auto.json". \n`)}`);
        cb();
        return;
      }
      
      if (!config[lib]) {
        this.log(`${chalk.yellow(`\n  ${lib} is not on Wat's list of auto-updating libraries.\n  To include it, add it to ./config/config.auto.json and submit a PR.\n`)}`);
        cb();
        return;
      }

      let origDelimiter = self.delimiter();

      let data = config[lib];
      data.urls = data.urls || [];
      data.language = data.language || 'javascript';
      const options = {
        urls: data.urls,
        language: data.language,
        crawl: false,
        onFile: function(data) {
          let total = data.total;
          let downloaded = data.downloaded;
          //self.delimiter(`Downloading: ${chalk.cyan(`${downloaded}`)} of ${chalk.cyan(`${total}`)} done.`);
        },
      };

      let result = parser.scaffold(lib, options, function (err, data) {
        self.delimiter(origDelimiter);
        if (args.options.rebuild) {
          parent.clerk.indexer.build(function(index){
            parent.clerk.indexer.write(index);
            self.log('Rebuilt index.');
            cb();
          });
        } else {
          cb();
        }

      });

    });

  vorpal
    .command('update index', 'Forces an update of the document index.')
    .action(function (args, cb) {
      const self = this;
      parent.clerk.indexer.update({force: true}, function (err) {
        if (!err) {
          self.log(chalk.cyan('\n  Successfully updated index.'));
          const amt = parent.clerk.updater.queue.length;
          if (amt > 1) {
            self.log(`\n  ${amt} documents are queued for updating.`);
          }
          self.log(' ');
          cb();
        }
      });
    });

  vorpal
    .command('get updatable', 'Lists libraries able to be be auto-rebuilt.')
    .option('-m, --max', 'Maximum history items to show.')
    .alias('get updateable')
    .action(function (args, cb) {
      const self = this;
      const max = args.options.max || 30;
      const config = parent.clerk.updater.config();

      let items = `\n  ${Object.keys(config).join('\n  ')}\n`;

      this.log(items);

      cb();
    });

  vorpal
    .command('get updates', 'Shows what docs are mid being updated.')
    .option('-m, --max', 'Maximum history items to show.')
    .action(function (args, cb) {
      const queue = parent.clerk.updater.queue;
      const max = args.options.max || 30;
      let limit = queue.length - 1 - max;
      limit = (limit < 0) ? 0 : limit;
      if (queue.length > 0) {
        this.log(chalk.bold('\n  Command'));
      } else {
        this.log(chalk.bold(`\n  No updates in the queue.\n  To do a fresh update, run the "${chalk.cyan('update')}" command.`));
      }
      for (let i = queue.length - 1; i > limit; i--) {
        let item = String(queue[i]).split('docs/');
        item = (item.length > 1) ? item[1] : item[0];
        let cmd = String(item).split('/').join(' ');
        cmd = String(cmd).replace('.md', '');
        cmd = String(cmd).replace('.detail', chalk.gray(' (detailed)'));
        cmd = String(cmd).replace('.install', chalk.gray(' (install)'));
        cmd = String(cmd).replace(' index', chalk.gray(' '));
        this.log(`  ${cmd}`);
      }
      this.log(' ');
      cb();
    });
};
