'use strict';

const chalk = require('chalk');
const util = require('../util');
const stripAnsi = require('strip-ansi');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .catch('[commands...]')
    .option('-v, --version', 'View the current version of Wat.')
    .option('-d, --detail', 'View detailed markdown on item.')
    .option('-i, --install', 'View installation instructions.')
    .parse(function (str) {
      return `${str} | less -F`;
    })
    .autocompletion(function (text, iteration, cb) {
      const self = this;
      const index = app.clerk.indexer.index();
      const result = util.autocomplete(text, iteration, index, function (word, options) {
        const res = self.match(word, options);
        return res;
      });

      const mode = result.mode;
      const response = result.response;

      if (mode === 'pre-build') {
        vorpal.ui
          .imprint()
          .redraw(`\n\n\n\n`)
          .redraw(`  ${response}\n\n`)
          .refresh();
        cb();
      } else if (mode === 'build') {
        vorpal.ui
          .redraw(`\n\n\n\n`)
          .refresh();
        const command = String(response).trim();
        app.autodocs.run(command, {
          loader(loader) {
            vorpal.ui.redraw(loader).refresh();
          },
          done(err) {
            vorpal.ui
              .redraw(`\n\n\n  ${chalk.blue(`Done. Press ${chalk.cyan(`[tab]`)} to explore ${command}.`)}\n`)
              .redraw.done();
            if (err) {
              self.log(`  ${err}\n`);
            }
          }
        });
        cb();
      } else {
        cb(undefined, response);
        cb();
      }
    })
    .action(function (args, cb) {
      const self = this;
      args = args || {};
      args.options = args.options || {};

      if (args.options.version) {
        this.log(app.clerk.version() || 'Unknown version');
        cb();
        return;
      }

      // Get rid of any piped commands.
      if (args.commands.indexOf('|') > -1) {
        args.commands = args.commands.slice(0, args.commands.indexOf('|'));
      }

      // Handle humans.
      if (String(args.commands[0]).toLowerCase() === 'wat') {
        args.commands.shift();
      }

      const command = args.commands.join(' ');
      const path = util.command.buildPath(command, args.options, app.clerk.indexer.index());

      if (String(command).trim() === '') {
        cb();
        return;
      }

      function logResults(str) {
        str = util.separator(str);
        self.log(str);
        cb();
      }

      function execPath(pathObj) {
        // If we are an unbuilt library, build it.
        if (pathObj.index && pathObj.index.__class === 'unbuilt-lib') {
          app.autodocs.run(command, {
            loader(loader) {
              vorpal.ui.redraw(loader).refresh();
            },
            done(err) {
              vorpal.ui
                .redraw(`\n\n\n  ${chalk.blue(`Done. Press ${chalk.cyan(`[tab]`)} to explore ${command}.`)}\n`)
                .redraw.done();
              if (err) {
                self.log(`  ${err}\n`);
              }
              cb();
              setTimeout(function () {
                vorpal.ui.input(`${command} `);
              }, 25);
            }
          });
          return;
        }

        const fullPath = util.command.buildExtension(pathObj.path, pathObj.index, args.options);
        const type = pathObj.index.__type || 'static';
        const noDetail = (args.options.detail && !pathObj.index.__detail);
        const noInstall = (args.options.install && !pathObj.index.__install);

        if (noDetail) {
          self.log(chalk.yellow(`\n  Sorry, there's no detailed write-up for this command. Showing the basic one instead.`));
        } else if (noInstall) {
          self.log(chalk.yellow(`\n  Sorry, there's no installation write-up for this command. Showing the basic one instead.`));
        }

        app.clerk.fetch(fullPath, type, function (err, data) {
          if (err) {
            self.log('Unexpected Error: ', err);
            cb();
          } else {
            logResults(data);
          }
        });
      }

      if (path.exists === false) {
        if (path.suggestions) {
          let log = '';
          log += `${chalk.yellow(`\n  Sorry, there's no cheat sheet for that command. However, you can try "${chalk.white(`${command} ...`)} ":`)}\n\n`;
          if (path.suggestions.length > 1) {
            log += `${path.suggestions.join('  ')}\n`;
          } else {
            log += path.suggestions[0];
          }
          // Ensure we don't double pad.
          log = log.replace(/\n\n\n/g, '\n\n');
          self.log(log);
          setTimeout(function () {
            vorpal.ui.input(`${String(command).trim()} `);
          }, 10);
        } else {
          const results = app.clerk.search(args.commands.join(' '));
          if (results.length === 1 && results[0].points > 0) {
            self.log(`${chalk.yellow(`\n  Showing results for "`)}${results[0].commandMatch}${chalk.yellow(`":`)}`);
            const path = util.command.buildPath(results[0].command, args.options, app.clerk.indexer.index());
            execPath(path);
          } else if (results.length > 0) {
            self.log(' ');

            let choices = [];
            results.forEach(function (res) {
              choices.push(res.commandMatch);
            });

            choices = choices.slice(0, 5);
            choices.push(`${chalk.grey(`Cancel`)}\n `);

            self.prompt({
              type: 'list',
              message: chalk.yellow('Did you mean:'),
              choices,
              name: 'choice'
            }, function (a) {
              const pick = stripAnsi(a.choice).replace('\n ', '');
              if (pick !== 'Cancel') {
                const path = util.command.buildPath(pick, args.options, app.clerk.indexer.index());
                execPath(path);
              } else {
                cb();
              }
            });
            return;
          } else {
            self.log(chalk.yellow(`\n  Sorry, there's no command like that.\n`));
          }
        }
        cb();
      } else {
        execPath(path);
      }
    });
};
