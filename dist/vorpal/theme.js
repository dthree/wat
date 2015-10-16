'use strict';

var chalk = require('chalk');
var util = require('./../util');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('theme [name]', 'Gets or sets the syntax highlighting theme.').alias('themes').autocompletion(function (text, iteration, cb) {
    var themes = app.cosmetician.getThemes() || [];
    cb(void 0, util.autocompletionHelper.call(this, 'theme ', themes, text, iteration));
  }).action(function (args, cb) {
    var _this = this;

    var theme = undefined;
    if (args.name) {
      theme = app.cosmetician.theme(args.name);
      if (theme === false) {
        this.log('\n  ' + chalk.yellow('Er... that\'s not a valid theme.') + '\n  What about one of these?\n');
        var themes = app.cosmetician.getThemes() || [];
        this.log('  ' + themes.join('\n  ') + '\n');
      } else {
        this.log('\n  Successfully set theme to ' + args.name + '.\n');
      }
    } else {
      (function () {
        _this.log('\n  ' + chalk.bold('Available themes:'));
        var prefs = app.clerk.prefs.get();
        var theme = prefs.theme || 'default';
        var themes = app.cosmetician.getThemes() || [];
        themes.sort(function (a, b) {
          if (a === theme) {
            return -1;
          } else if (b === theme) {
            return 1;
          } else {
            return 0;
          }
        });
        var stdout = '  ' + themes.join('\n  ') + '\n';
        var regex = new RegExp('(' + theme + ')');
        stdout = stdout.replace(regex, chalk.blue('$1 (active)'));
        _this.log(stdout);
      })();
    }
    cb(undefined, theme);
  });
};