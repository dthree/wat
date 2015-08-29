"use strict";

var chalk = require('chalk');
var util = require('./util');

module.exports = function (vorpal, options) {

  var parent = options.parent;
  var histTypes = {
    'command': 'Command',
    'update': 'Update'
  };

  vorpal.command('show hist', 'Shows recent command history.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
    var hist = parent.clerk.history.get();
    var max = args.options.max || 20;
    var limit = hist.length - 1 - max;
    limit = limit < 0 ? 0 : limit;
    this.log(chalk.bold('\n  Date            Type      Value'));
    for (var i = hist.length - 1; i > limit; --i) {
      var date = chalk.gray(util.pad(moment(hist[i].date || '').format('D MMM h:mma'), 15, ' '));
      var type = util.pad(histTypes[hist[i].type], 9, ' ');
      var cmd = hist[i].value;
      this.log('  ' + date + ' ' + type + ' ' + cmd);
    }
    this.log(' ');
    cb();
  });
};