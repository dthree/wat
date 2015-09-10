'use strict';

const chalk = require('chalk');
const util = require('./util');
const _ = require('lodash');

module.exports = function (vorpal, options) {
  const parent = options.parent;

  vorpal
    .catch('[commands...]')
    .option('-d, --detail', 'View detailed markdown on item.')
    .option('-i, --install', 'View installation instructions.')
    .autocompletion(function (text, iteration, cb) {
      const self = this;
      const index = parent.clerk.indexer.index();
      let result = util.autocomplete(text, iteration, index, function (word, options) {
        const res = self.match(word, options);
        return res;
      });
      if (_.isArray(result)) {
        result.sort();
      }
      //self.log(iteration, '|' + result + '|');
      cb(undefined, result);
    })
    .action(function (args, cb) {
      const self = this;

      args = args || {};
      args.options = args.options || {};

      // Handle humans.
      if (String(args.commands[0]).toLowerCase() === 'wat') {
        args.commands.shift();
      }

      
      const path = util.command.buildPath(args.commands.join(' '), args.options, parent.clerk.indexer.index());

      //console.log(path)

      function execPath(pathObj) {
        const fullPath = util.command.buildExtension(pathObj.path, pathObj.index, args.options);
        const type = pathObj.index.__type || 'static';
        //console.log(fullPath, pathObj.index.__type)
        const noDetail = (args.options.detail && !pathObj.index.__detail);
        const noInstall = (args.options.install && !pathObj.index.__install);

        if (noDetail) {
          self.log(chalk.yellow(`\n  Sorry, there's no detailed write-up for this command. Showing the basic one instead.`));
        } else if (noInstall) {
          self.log(chalk.yellow(`\n  Sorry, there's no installation write-up for this command. Showing the basic one instead.`));
        }

        parent.clerk.fetch(fullPath, type, function (err, data) {
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
          self.log(chalk.yellow(`\n  Sorry, there's no cheat sheet for that command. However, you can try these:\n`));
          for (let i = 0; i < path.suggestions.length; ++i) {
            const str = `  ${String(String(path.path).split('/').join(' ')).trim()} ${path.suggestions[i]}`;
            self.log(str);
          }
          self.log(' ');
        } else {
          const results = parent.clerk.search(args.commands.join(' '));
          //console.log(results);
          if (results.length === 1 && results[0].points > 0) {
            self.log(chalk.yellow(`\n  Showing results for '${results[0].command}':`));
            const path = util.command.buildPath(results[0].command, args.options, parent.clerk.indexer.index());
            execPath(path);
          } else if (results.length > 0) {
            self.log(chalk.yellow(`\n  Did you mean:`));
            for (let i = 0; i < results.length; ++i) {
              if (i > 7) {
                break;
              }
              let cmd = results[i].command;
              cmd = cmd.replace(args.commands, chalk.white(args.commands));
              self.log(`  ${cmd}`);
            }
            self.log(' ');
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
