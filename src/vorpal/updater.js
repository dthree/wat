'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('updates', 'Shows what docs are mid being updated.')
    .option('-m, --max', 'Maximum history items to show.')
    .action(function (args, cb) {
      const queue = app.clerk.updater.queue;
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
