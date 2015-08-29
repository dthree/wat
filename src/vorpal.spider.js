'use strict';

const spider = require('./spider');
const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const parent = options.parent;

  vorpal
    .command('search [command...]', 'Searches for a command.')
    .action(function (args, cb) {
      const command = (args.command || []).join(' ');
      const matches = parent.clerk.search(command);
      this.log(matches);
      cb();
    });

  vorpal
    .command('stackoverflow [command...]', 'Searches Stack Overflow.')
    .alias('so')
    .alias('stack')
    .action(function (args, cb) {
      const self = this;
      const command = (args.command || []).join(' ');
      self.log(' ');

      function process(itm) {
        spider.stackoverflow.getPage(itm, function (err, text) {
          if (err) {
            self.log('Error: ', err);
          } else {
            self.log(text);
          }
          cb();
        });
      }

      spider.google(command, function (err, next, links) {
        const wanted = spider.filterGoogle(links, ['stackoverflow']);
        const item = wanted.shift();
        if (err) {
          self.log(`  ${chalk.yellow(`Hmmm.. Wat had trouble searching this question.`)}\n`);
          cb();
          return;
        }
        if (item) {
          process(item);
        } else {
          self.log(`${chalk.yellow(`  Wat couldn\'t find any matches on Stack Overflow.`)}\n  Try re-wording your question.\n`);
          cb();
        }
      });
    });
};
