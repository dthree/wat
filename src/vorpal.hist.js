"use strict";

const chalk = require('chalk');
const util = require('./util');

module.exports = function(vorpal, options) {

  const parent = options.parent;
  const histTypes = {
    'command': 'Command',
    'update': 'Update'
  };

  vorpal
    .command('show hist', 'Shows recent command history.')
    .option('-m, --max', 'Maximum history items to show.')
    .action(function(args, cb){
      let hist = parent.clerk.history.get();
      let max = args.options.max || 20;
      let limit = hist.length -1 - max;
      limit = (limit < 0) ? 0 : limit;
      this.log(chalk.bold('\n  Date            Type      Value'));
      for (let i = hist.length - 1; i > limit; --i) {
        let date = chalk.gray(util.pad(moment(hist[i].date || '').format('D MMM h:mma'), 15, ' '));
        let type = util.pad(histTypes[hist[i].type], 9, ' ');
        let cmd = hist[i].value;
        this.log('  ' + date + ' ' + type + ' ' + cmd);
      }
      this.log(' ');
      cb();
    });
}
