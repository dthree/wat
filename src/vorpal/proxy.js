'use strict';

const chalk = require('chalk');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal
    .command('proxy add', 'Runs Wat through a proxy.')
    .action(function (args, cb) {
      const self = this;
      self.log('\n  This will set Wat up to connect through a proxy.\n  Please answer the following:\n');
      const questions = [{
        type: 'input',
        name: 'address',
        message: chalk.blue('  proxy address: ')
      }, {
        type: 'input',
        name: 'port',
        message: chalk.blue('  proxy port: ')
      }, {
        type: 'input',
        name: 'user',
        message: chalk.blue(`  user ${chalk.grey(`(optional)`)}: `)
      }, {
        type: 'input',
        name: 'pass',
        message: chalk.blue(`  pass ${chalk.grey(`(optional)`)}: `)
      }];
      this.prompt(questions, function (data) {
        app.clerk.prefs.set('proxy', 'on');
        app.clerk.prefs.set('proxy-address', data.address);
        app.clerk.prefs.set('proxy-port', data.port);
        app.clerk.prefs.set('proxy-user', data.user);
        app.clerk.prefs.set('proxy-pass', data.pass);
        self.log('\n  Great! Try out your connection.\n');
        cb();
      });
    });

  vorpal
    .command('proxy remove', 'Removes Wat\'s proxy settings.')
    .action(function (args, cb) {
      const self = this;
      const isOn = (app.clerk.prefs.get('proxy') === 'on');
      if (!isOn) {
        self.log('You aren\'t using a proxy!');
        cb();
        return;
      }
      const questions = [{
        type: 'confirm',
        name: 'remove',
        default: 'y',
        message: 'Remove proxy? '
      }];
      this.prompt(questions, function (data) {
        if (data.remove === true) {
          app.clerk.prefs.set('proxy', 'off');
        }
        cb();
      });
    });
};
