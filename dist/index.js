'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var Vorpal = require('vorpal');
var moment = require('moment');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));
var clerk = require('./clerk');
var cosmetician = require('./cosmetician');

var vorpal = new Vorpal();

var prefs = clerk.prefs.get();

var app = {

  vorpal: vorpal,

  cosmetician: cosmetician,

  clerk: clerk,

  init: function init() {
    this.cosmetician.init(app);
    this.clerk.init(app);

    this.clerk.start();
  }

};

app.init();

var help = vorpal.find('help');
if (help) {
  help.remove();
}

var dir = __dirname + '/./';

vorpal.use(dir + 'vorpal.sigint.js', { parent: app }).use(dir + 'vorpal.theme.js', { parent: app }).use(dir + 'vorpal.updater.js', { parent: app }).use(dir + 'vorpal.spider.js', { parent: app }).use(dir + 'vorpal.catch.js', { parent: app }).use(dir + 'vorpal.hist.js', { parent: app }).delimiter('?').show();

var xlt = {
  'd': 'detail',
  'i': 'install'
};

var args = { options: {} };
for (var item in argv) {
  if (item === '_') {
    args.commands = argv[item];
  } else {
    if (xlt[item]) {
      args.options[xlt[item]] = argv[item];
    } else {
      args.options[item] = argv[item];
    }
  }
}

if (process.argv.length > 2) {
  vorpal.exec(args.commands.join(' '), args);
}