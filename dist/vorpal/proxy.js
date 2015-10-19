'use strict';

var chalk = require('chalk');
var util = require('../util');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.command('proxy add', 'Runs Wat through a proxy.').action(function (args, cb) {
    var self = this;
    self.log('\n  This will set Wat up to connect through a proxy.\n  Please answer the following:\n');
    var questions = [{
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
      message: chalk.blue('  user ' + chalk.grey('(optional)') + ': ')
    }, {
      type: 'input',
      name: 'pass',
      message: chalk.blue('  pass ' + chalk.grey('(optional)') + ': ')
    }];
    var address = app.clerk.prefs.get('proxy-address');
    var port = app.clerk.prefs.get('proxy-port');
    var user = app.clerk.prefs.get('proxy-user');
    var pass = app.clerk.prefs.get('proxy-pass');
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

  vorpal.command('proxy remove', 'Removes Wat\'s proxy settings.').action(function (args, cb) {
    var self = this;
    var isOn = app.clerk.prefs.get('proxy') === 'on' ? true : false;
    if (!isOn) {
      self.log('You aren\'t using a proxy!');
      cb();
      return;
    }
    var questions = [{
      type: 'confirm',
      name: 'remove',
      'default': 'y',
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