'use strict';

const chalk = require('chalk');
const util = require('./../util');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('theme [name]', 'Gets or sets the syntax highlighting theme.')
    .alias('themes')
    .autocompletion(function(text, iteration, cb) {
      const themes = app.cosmetician.getThemes() || [];
      cb(void 0, util.autocompletionHelper.call(this, 'theme ', themes, text, iteration));
    })
    .action(function (args, cb) {
      let theme;
      if (args.name) {
        theme = app.cosmetician.theme(args.name);
        if (theme === false) {
          this.log(`\n  ${chalk.yellow('Er... that\'s not a valid theme.')}\n  What about one of these?\n`);
          const themes = app.cosmetician.getThemes() || [];
          this.log(`  ${themes.join('\n  ')}\n`);
        } else {
          this.log(`\n  Successfully set theme to ${args.name}.\n`);
        }
      } else {
        this.log(`\n  ${chalk.bold(`Available themes:`)}`);
        const prefs = app.clerk.prefs.get();
        const theme = prefs.theme || 'default';
        const themes = app.cosmetician.getThemes() || [];
        themes.sort(function(a, b) {
          if (a === theme) {
            return -1;
          } else if (b === theme) {
            return 1;
          } else {
            return 0;
          }
        })
        let stdout = `  ${themes.join(`\n  `)}\n`;
        const regex = new RegExp(`(${theme})`);
        stdout = stdout.replace(regex, chalk.blue(`$1 (active)`));
        this.log(stdout);
      }
      cb(undefined, theme);
    });

};
