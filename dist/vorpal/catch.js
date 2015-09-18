'use strict';

var chalk = require('chalk');
var util = require('../util');
var _ = require('lodash');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal['catch']('[commands...]').option('-d, --detail', 'View detailed markdown on item.').option('-i, --install', 'View installation instructions.').autocompletion(function (text, iteration, cb) {
    var self = this;
    var index = app.clerk.indexer.index();
    var result = util.autocomplete(text, iteration, index, function (word, options) {
      var res = self.match(word, options);
      return res;
    });
    if (result[0] === 'build') {
      var command = String(result[1]).trim();
      var message = '';
      self.log('  ' + chalk.blue('Building, please wait...' + message) + '\n');
      app.autodocs.run(command, {}, function (err) {
        if (err) {
          self.log('  ' + err + '\n');
        } else {
          self.log('  ' + chalk.blue('Done.') + '\n');
        }
        cb();
      });
      result = result = result[1];
    }
    cb(undefined, result);
  }).action(function (args, cb) {
    var self = this;

    args = args || {};
    args.options = args.options || {};

    // Handle humans.
    if (String(args.commands[0]).toLowerCase() === 'wat') {
      args.commands.shift();
    }

    var command = args.commands.join(' ');

    var path = util.command.buildPath(command, args.options, app.clerk.indexer.index());

    function execPath(pathObj) {
      // If we are an unbuilt library, build it.
      if (pathObj.index && pathObj.index.__class === 'unbuilt-lib') {
        self.log('\n  ' + chalk.blue('Fetching ' + command + '...'));
        app.autodocs.run(command, {}, function (err) {
          if (err) {
            self.log('\n\n  ' + err + '\n');
          } else {
            self.log('  ' + chalk.blue('Done!') + '\n');
          }
          cb();
        });
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
        } else {
          self.log(data);
        }
        cb();
      });
    }

    if (path.exists === false) {
      if (path.suggestions) {
        self.log(chalk.yellow('\n  Sorry, there\'s no cheat sheet for that command. However, you can try these:\n'));
        for (var i = 0; i < path.suggestions.length; ++i) {
          var str = '  ' + String(String(path.path).split('/').join(' ')).trim() + ' ' + path.suggestions[i];
          self.log(str);
        }
        self.log(' ');
      } else {
        var results = app.clerk.search(args.commands.join(' '));
        if (results.length === 1 && results[0].points > 0) {
          self.log(chalk.yellow('\n  Showing results for \'' + results[0].command + '\':'));
          var _path = util.command.buildPath(results[0].command, args.options, app.clerk.indexer.index());
          execPath(_path);
        } else if (results.length > 0) {
          self.log(chalk.yellow('\n  Did you mean:'));
          for (var i = 0; i < results.length; ++i) {
            if (i > 7) {
              break;
            }
            var cmd = results[i].command;
            cmd = cmd.replace(args.commands, chalk.white(args.commands));
            self.log('  ' + cmd);
          }
          self.log(' ');
        } else {
          self.log(chalk.yellow('\n  Sorry, there\'s no command like that.\n'));
        }
      }
      cb();
    } else {
      execPath(path);
    }
  });
};