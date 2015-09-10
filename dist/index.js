'use strict';

/**
 * Module dependencies.
 */

var Vorpal = require('vorpal');
var argv = require('minimist')(process.argv.slice(2));
var clerk = require('./clerk');
var cosmetician = require('./cosmetician');

var vorpal = new Vorpal();

var app = {

  vorpal: vorpal,

  cosmetician: cosmetician,

  clerk: clerk,

  init: function init(options) {
    options = options || {};
    this.cosmetician.init(app);
    this.clerk.init(app);
    this.clerk.start(options);

    var help = vorpal.find('help');
    if (help) {
      help.remove();
    }

    var dir = __dirname + '/.';

    vorpal.use(dir + '/vorpal.sigint.js', { parent: app }).use(dir + '/vorpal.theme.js', { parent: app }).use(dir + '/vorpal.indexer.js', { parent: app }).use(dir + '/vorpal.updater.js', { parent: app }).use(dir + '/vorpal.spider.js', { parent: app }).use(dir + '/vorpal.catch.js', { parent: app }).use(dir + '/vorpal.hist.js', { parent: app }).delimiter('?').show();

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }
  }
};

module.exports = app;