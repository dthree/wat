'use strict';

var chalk = require('chalk');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('set theme <name>', 'Sets the syntax highlighting theme.').action(function (args, cb) {});

  vorpal.command('theme [name]', 'Gets or sets the syntax highlighting theme.').action(function (args, cb) {
    var theme = undefined;
    if (args.name) {
      theme = app.cosmetician.theme(args.name);
      if (theme === false) {
        this.log('\n  ' + chalk.yellow('Er... that\'s not a valid theme.') + '\n  What about one of these?\n');
        var themes = app.cosmetician.getThemes() || [];
        this.log('  ' + themes.join('\n  ') + '\n');
      } else {
        this.log('\n  ' + chalk.cyan('Successfully set theme to ' + args.name + '.') + '\n');
      }
    } else {
      var prefs = app.clerk.prefs.get();
      theme = prefs.theme || 'default';
      this.log('\n  ' + theme + '\n');
    }
    cb(undefined, theme);
  });

  vorpal.command('themes', 'Displays the current syntax highlighting theme.').action(function (args, cb) {
    this.log('\n  ' + chalk.bold('Available themes:') + '\n');
    var themes = app.cosmetician.getThemes() || [];
    var prefs = app.clerk.prefs.get();
    var theme = prefs.theme || 'default';
    var stdout = '  ' + themes.join('\n  ') + '\n';
    var regex = new RegExp('(' + theme + ')');
    stdout = stdout.replace(regex, chalk.blue('$1 (active)'));
    this.log(stdout);
    cb();
  });
};