'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('set theme <name>', 'Sets the syntax highlighting theme.')
    .action(function (args, cb) {
    });

  vorpal
    .command('theme [name]', 'Gets or sets the syntax highlighting theme.')
    .action(function (args, cb) {
      let theme;
      if (args.name) {
        theme = app.cosmetician.theme(args.name);
        if (theme === false) {
          this.log(`\n  ${chalk.yellow('Er... that\'s not a valid theme.')}\n  What about one of these?\n`);
          const themes = app.cosmetician.getThemes() || [];
          this.log(`  ${themes.join('\n  ')}\n`);
        } else {
          this.log(`\n  ${chalk.cyan(`Successfully set theme to ${args.name}.`)}\n`);
        }
      } else {
        const prefs = app.clerk.prefs.get();
        theme = prefs.theme || 'default';
        this.log(`\n  ${theme}\n`);
      }
      cb(undefined, theme);
    });

  vorpal
    .command('themes', 'Displays the current syntax highlighting theme.')
    .action(function (args, cb) {
      this.log(`\n  ${chalk.bold(`Available themes:`)}\n`);
      const themes = app.cosmetician.getThemes() || [];
      const prefs = app.clerk.prefs.get();
      const theme = prefs.theme || 'default';
      let stdout = `  ${themes.join(`\n  `)}\n`;
      const regex = new RegExp(`(${theme})`);
      stdout = stdout.replace(regex, chalk.blue(`$1 (active)`));
      this.log(stdout);
      cb();
    });
};
