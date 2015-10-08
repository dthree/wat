'use strict';

var chalk = require('chalk');
var util = require('../util');
var _ = require('lodash');
var stripAnsi = require('strip-ansi');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal['catch']('[commands...]').option('-d, --detail', 'View detailed markdown on item.').option('-i, --install', 'View installation instructions.').parse(function (str) {
    return str + ' | less -F';
  }).autocompletion(function (text, iteration, cb) {

    var self = this;
    var index = app.clerk.indexer.index();

    var result = util.autocomplete(text, iteration, index, function (word, options) {
      var res = self.match(word, options);
      return res;
    });

    var mode = result.mode;
    var response = result.response;

    if (mode === 'pre-build') {
      vorpal.ui.imprint().redraw('\n\n\n\n').redraw('  ' + response + '\n\n').refresh();
      cb();
    } else if (mode === 'build') {
      (function () {
        vorpal.ui.redraw('\n\n\n\n').refresh();
        var command = String(response).trim();
        app.autodocs.run(command, {
          loader: function loader(_loader) {
            vorpal.ui.redraw(_loader).refresh();
          },
          done: function done(err) {
            vorpal.ui.redraw('\n\n\n  ' + chalk.blue('Done. Press ' + chalk.cyan('[tab]') + ' to explore ' + command + '.') + '\n').redraw.done();
            if (err) {
              self.log('  ' + err + '\n');
            }
          }
        });
        cb();
      })();
    } else {
      // vorpal.log(response[0].length, process.stdout.columns);
      // vorpal.log(require('util').inspect(response));
      // vorpal.log(response[0]);
      // vorpal.log(response[0]);
      cb(undefined, response);
      cb();
    }
  }).action(function (args, cb) {
    var self = this;

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

    var command = args.commands.join(' ');
    var path = util.command.buildPath(command, args.options, app.clerk.indexer.index());

    function logResults(str) {
      self.log(str);
      cb();
    };

    function execPath(pathObj) {
      // If we are an unbuilt library, build it.
      if (pathObj.index && pathObj.index.__class === 'unbuilt-lib') {
        //self.log(`\n  ${chalk.blue(`Fetching ${command}...`)}`);

        app.autodocs.run(command, {
          loader: function loader(_loader2) {
            vorpal.ui.redraw(_loader2).refresh();
          },
          done: function done(err) {
            vorpal.ui.redraw('\n\n\n  ' + chalk.blue('Done. Press ' + chalk.cyan('[tab]') + ' to explore ' + command + '.') + '\n').redraw.done();
            if (err) {
              self.log('  ' + err + '\n');
            }
            cb();
            setTimeout(function () {
              vorpal.ui.input(command + ' ');
            }, 25);
          }
        });

        /*
        app.autodocs.run(command, {}, function(err){
          if (err) {
            self.log(`\n\n  ${err}\n`);
          } else {
            self.log(`  ${chalk.blue(`Done!`)}\n`);
          }
          cb();
        });
        */
        return;
      }

      var fullPath = util.command.buildExtension(pathObj.path, pathObj.index, args.options);
      var type = pathObj.index.__type || 'static';
      var noDetail = args.options.detail && !pathObj.index.__detail;
      var noInstall = args.options.install && !pathObj.index.__install;

      if (noDetail) {
        self.log(chalk.yellow('\n  Sorry, there\'s no detailed write-up for this command. Showing the basic one instead.'));
      } else if (noInstall) {
        self.log(chalk.yellow('\n  Sorry, there\'s no installation write-up for this command. Showing the basic one instead.'));
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
        var log = '';
        log += chalk.yellow('\n  Sorry, there\'s no cheat sheet for that command. However, you can try "' + chalk.white(command + ' ...') + ' ":') + '\n\n';
        for (var i = 0; i < path.suggestions.length; ++i) {
          log += '' + path.suggestions[i];
        }
        // Ensure we don't double pad.
        log = log.replace(/\n\n\n/g, '\n\n');
        self.log(log);
        setTimeout(function () {
          vorpal.ui.input(String(command).trim() + ' ');
        }, 10);
      } else {
        var results = app.clerk.search(args.commands.join(' '));
        if (results.length === 1 && results[0].points > 0) {
          self.log('' + chalk.yellow('\n  Showing results for "') + results[0].commandMatch + chalk.yellow('":'));
          var _path = util.command.buildPath(results[0].command, args.options, app.clerk.indexer.index());
          execPath(_path);
        } else if (results.length > 0) {
          var _ret2 = (function () {
            //self.log(chalk.yellow(`\n  Did you mean:`));
            self.log(' ');

            var choices = [];
            results.forEach(function (res) {
              choices.push(res.commandMatch);
            });

            choices = choices.slice(0, 5);
            choices.push(chalk.grey('Cancel') + '\n ');

            self.prompt({
              type: 'list',
              message: chalk.yellow('Did you mean:'),
              choices: choices,
              name: 'choice'
            }, function (a, b) {
              var pick = stripAnsi(a.choice).replace('\n ', '');
              if (pick !== 'Cancel') {
                var _path2 = util.command.buildPath(pick, args.options, app.clerk.indexer.index());
                execPath(_path2);
              } else {
                cb();
              }
            });
            return {
              v: undefined
            };
          })();

          if (typeof _ret2 === 'object') return _ret2.v;
        } else {
          self.log(chalk.yellow('\n  Sorry, there\'s no command like that.\n'));
        }
      }
      cb();
    } else {
      execPath(path);
    }
  }).done(function () {
    //vorpal.exec('less', function () {
    //});
  });
};