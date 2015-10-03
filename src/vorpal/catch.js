'use strict';

const chalk = require('chalk');
const util = require('../util');
const _ = require('lodash');
const stripAnsi = require('strip-ansi');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .catch('[commands...]')
    .option('-d, --detail', 'View detailed markdown on item.')
    .option('-i, --install', 'View installation instructions.')
    .parse(function (str) {
      return str + ' | less -F';
    })
    .autocompletion(function (text, iteration, cb) {
      const self = this;
      const index = app.clerk.indexer.index();
      let result = util.autocomplete(text, iteration, index, function (word, options) {
        const res = self.match(word, options);
        return res;
      });

      function draw(done, total, action) {
        // Add time on to the end of the
        // loader to compensate for building.
        const doneString = done;
        let multiple = .6;
        if (action === 'parse') {
          multiple = .65;
        } else if (action === 'build') {
          multiple = .70;
        } else if (action === 'write') {
          multiple = .75;
        } else if (action === 'index') {
          multiple = .80;
        } else if (action === 'done') {
          multiple = .85;
        }
        done = Math.floor(done * multiple);
        done = (done < 0) ? 0 : done;
        let width = 40;
        let donesPerBar = total / width;
        let bars = Math.floor(donesPerBar * done);
        let loader = '';
        let message = ' you look good.';
        for (let i = 0; i < width; ++i) {
          let char = message[i] || ' ';
          if (i <= done) {
            loader += chalk.bgGreen(char);
          } else {
            loader += chalk.bgWhite(' ');
          }
        }
        let buildStr;
        if (total === 100) {
          buildStr = `Preparing...`;
        } else if (action === 'fetch') {
          buildStr = `Fetching ${doneString} of ${total} docs...`;
        } else if (['parse', 'build'].indexOf(action) > -1) {
          buildStr = `Housekeeping...`;
        } else if (['write', 'index', 'done'].indexOf(action) > -1) {
          buildStr = `Feng shui...`;
        }
        buildStr = chalk.grey(buildStr);
        const result = `\n  ${buildStr}\n\n  ${loader}`;
        return result;
      }

      if (result[0] === 'pre-build') {
        vorpal.ui.redraw(`\n  ${result[1]}`);
        cb(undefined, undefined);
      } else if (result[0] === 'build') {
        let command = String(result[1]).trim();
        let message = '';
        vorpal.ui.redraw(draw(0, 100));
        app.autodocs.run(command, {
          progress: function(data) {
            vorpal.ui.redraw(draw(data.downloaded, data.total, data.action));
          },
        }, function(err){
          vorpal.ui.redraw('\n\n  Done.\n');
          vorpal.ui.redraw.done();
          vorpal.ui.refresh();
          if (err) {
            self.log(`  ${err}\n`);
          }
          cb();
        });
        result = result = result[1];
        cb(undefined, undefined);
      } else {
        cb(undefined, result);
      }

    })
    .action(function (args, cb) {
      const self = this;

      args = args || {};
      args.options = args.options || {};

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
      //console.log(path)

      function logResults(str) {
        if (String(str).split('\n').length > process.stdout.rows && 1 == 2) {
          //console.log('doing less...');
          //vorpal._dude = str;
          cb();
        } else {
          self.log(str);
          cb();
        }
      };

      function execPath(pathObj) {
        // If we are an unbuilt library, build it.
        if (pathObj.index && pathObj.index.__class === 'unbuilt-lib') {
          self.log(`\n  ${chalk.blue(`Fetching ${command}...`)}`);
          app.autodocs.run(command, {}, function(err){
            if (err) {
              self.log(`\n\n  ${err}\n`);
            } else {
              self.log(`  ${chalk.blue(`Done!`)}\n`);
            }
            cb();
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
          self.log(chalk.yellow(`\n  Sorry, there's no cheat sheet for that command. However, you can try "${chalk.white(`${command} ...`)} ":\n`));
          for (let i = 0; i < path.suggestions.length; ++i) {
            const str = `${path.suggestions[i]}`;
            self.log(str);
          }
          self.log(' ');
          setTimeout(function(){
            vorpal.ui.input(`${String(command).trim()} `);
          }, 10);
        } else {
          const results = app.clerk.search(args.commands.join(' '));
          if (results.length === 1 && results[0].points > 0) {
            self.log(`${chalk.yellow(`\n  Showing results for "`)}${results[0].commandMatch}${chalk.yellow(`":`)}`);
            const path = util.command.buildPath(results[0].command, args.options, app.clerk.indexer.index());
            execPath(path);
          } else if (results.length > 0) { 
            //self.log(chalk.yellow(`\n  Did you mean:`));
            self.log(' ');

            let choices = [];
            results.forEach(function (res) {
              choices.push(res.commandMatch);
            });

            choices = choices.slice(0, 5);
            choices.push(`${chalk.grey(`Cancel`)}\n `);

            self.prompt({
              type: 'list',
              message: 'Did you mean:',
              choices: choices,
              name: 'choice',
            }, function(a, b) {
              let pick = stripAnsi(a.choice).replace('\n ', '');
              if (pick !== 'Cancel') {
                const path = util.command.buildPath(pick, args.options, app.clerk.indexer.index());
                execPath(path);
              } else {
                cb();
              }
            })
            return;

          } else {
            self.log(chalk.yellow(`\n  Sorry, there's no command like that.\n`));
          }
        }
        cb();
      } else {
        execPath(path);
      }
    }).done(function(){
      //vorpal.exec('less', function () {
      //});
    });
};
