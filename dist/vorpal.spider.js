'use strict';

var spider = require('./spider');
var chalk = require('chalk');

module.exports = function (vorpal, options) {
  var parent = options.parent;

  spider.init(options.parent);

  vorpal.command('search [command...]', 'Searches for a command.').action(function (args, cb) {
    var command = (args.command || []).join(' ');
    var matches = parent.clerk.search(command);
    this.log(matches);
    cb();
  });

  vorpal.command('stackoverflow [command...]', 'Searches Stack Overflow.').alias('so').alias('stack').action(function (args, cb) {
    var self = this;
    var command = (args.command || []).join(' ');
    self.log(' ');

    function process(itm) {
      spider.stackoverflow.getPage(itm, function (err, text) {
        if (err) {
          if (err === 'NO_ANSWERS') {
            self.log(chalk.yellow('  Wat couldn\'t find any matches on Stack Overflow.') + '\n  Try re-wording your command.\n');
          } else {
            self.log('Error: ', err);
          }
        } else {
          self.log(text);
        }
        cb();
      });
    }

    spider.google('stackoverflow ' + command, function (err, next, links) {
      var wanted = spider.filterGoogle(links, ['stackoverflow']);
      var item = wanted.shift();
      if (err) {
        self.log('  ' + chalk.yellow('Hmmm.. Wat had trouble searching this command.') + '\n');
        cb();
        return;
      }
      if (item) {
        process(item);
      } else {
        self.log(chalk.yellow('  Wat couldn\'t find any matches on Stack Overflow.') + '\n  Try re-wording your command.\n');
        cb();
      }
    });
  });

  vorpal.command('github [command...]', 'Searches Github.').alias('gh').action(function (args, cb) {
    var self = this;
    var command = (args.command || []).join(' ');
    self.log(' ');

    function process(itm) {
      spider.github.getPage(itm, function (err, text) {
        if (err) {
          self.log('Error: ', err);
        } else {
          self.log(text);
        }
        cb();
      });
    }

    spider.google('github ' + command, function (err, next, links) {
      var wanted = spider.filterGoogle(links, ['github']);
      var item = wanted.shift();
      if (err) {
        self.log('  ' + chalk.yellow('Hmmm.. Wat had trouble searching this command.') + '\n');
        cb();
        return;
      }
      if (item) {
        process(item);
      } else {
        self.log(chalk.yellow('  Wat couldn\'t find any matches on Github.') + '\n  Try re-wording your command.\n');
        cb();
      }
    });
  });
};