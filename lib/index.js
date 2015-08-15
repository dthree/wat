'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const Vantage = require('vantage');
const moment = require('moment');
const chalk = require('chalk');
const indexer = require('./indexer');
const util = require('./util');
const clerk = require('./clerk');

const vantage = new Vantage();

clerk.start();
indexer.init({ clerk: clerk });

vantage
  .delimiter('?')
  .hideCommand('help')
  .removeCommand('use')
  .removeCommand('vantage')
  .removeCommand('repl')
  .show();

vantage
  .command('index', 'Rebuilds index.')
  .action(function(args, cb){
    clerk.index.build(function(index){
      console.log(index);
      cb();
    });
  })

vantage
  .command('hist', 'Shows recent command history.')
  .option('-m, --max', 'Maximum history items to show.')
  .action(function(args, cb){
    let hist = clerk.history.get();
    let max = args.options.max || 20;
    let limit = hist.length -1 - max;
    limit = (limit < 0) ? 0 : limit;
    this.log('\n  Recent commands:\n');
    for (let i = hist.length - 1; i > limit; --i) {
      let date = moment(hist[i].date || '').format('DD MMM hh:mma');
      let cmd = hist[i].command;
      this.log('  ' + date + ' ' + cmd);
    }
    this.log(' ');
    cb();
  })

vantage
  .catch('[commands...]')
  .option('-d, --detail', 'View detailed markdown on item.')
  .option('-i, --install', 'View installation instructions.')
  .autocompletion(function(text, iteration, cb) {
    const self = this;
    const index = clerk.index.index();
    const result = util.autocomplete(text, iteration, index, function(word, options){
      return self.match.call(self, word, options);
    });
    cb(void 0, result);
  })
  .action(function(args, cb){
    const self = this;

    args = args || {}
    args.options = args.options || {}

    var path = util.command.buildPath(args.commands.join(' '), args.options, clerk.index.index());

    if (path.exists === false) {
      if (path.suggestions) {
        self.log(chalk.yellow(`\n  Sorry, there's no cheat sheet for that command. However, you can try these:\n`));
        for (let i = 0; i < path.suggestions.length; ++i) {
          var str = '  ' + String(String(path.path).split('/').join(' ')).trim() + ' ' + path.suggestions[i];
          self.log(str);
        }
        self.log(' ');
      } else {
        self.log(chalk.yellow(`\n  Sorry, there's no command like that.\n`));
      }
      cb();
    } else {

      let fullPath = util.command.buildExtension(path.path, path.index, args.options);
      let noDetail = (args.options.detail && !path.index.__detail);
      let noInstall = (args.options.install && !path.index.__install);

      if (noDetail) {
        self.log(chalk.yellow(`\n  Sorry, there's no detailed write-up for this command. Showing the basic one instead.`));
      } else if (noInstall) {
        self.log(chalk.yellow(`\n  Sorry, there's no installation write-up for this command. Showing the basic one instead.`));
      }

      clerk.fetch(fullPath, function(err, data) {
        if (err) {
          self.log('Unexpected Error: ', err);
        } else {
          self.log(data);
        }
        cb();
      });
    }
  });
