'use strict';

var chalk = require('chalk');
var util = require('../util');
var moment = require('moment');

module.exports = function (vorpal, options) {
  var app = options.app;
  var histTypes = {
    'command': 'Command',
    'update': 'Update'
  };

  vorpal.command('get hist', 'Shows recent command history.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
    var hist = app.clerk.history.get();
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