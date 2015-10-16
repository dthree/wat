'use strict';

/**
 * Module dependencies.
 */

var Vorpal = require('vorpal');
var vorpal = new Vorpal();
var less = require('vorpal-less');

var app = {

  vorpal: vorpal,

  init: function init(options) {
    options = options || {};

    var dir = __dirname + '/.';

    this.clerk = require('./clerk/clerk')(app);
    this.spider = require('./spider/spider')(app);
    this.autodocs = require('./autodocs/autodocs')(app);
    this.cosmetician = require('./cosmetician/cosmetician')(app);

    vorpal.use(less).use(dir + '/vorpal/sigint.js', { app: app }).use(dir + '/vorpal/theme.js', { app: app }).use(dir + '/vorpal/indexer.js', { app: app }).use(dir + '/vorpal/updater.js', { app: app }).use(dir + '/vorpal/spider.js', { app: app }).use(dir + '/vorpal/catch.js', { app: app }).use(dir + '/vorpal/autodocs.js', { app: app }).use(dir + '/vorpal/hist.js', { app: app }).use(dir + '/vorpal/tour.js', { app: app }).delimiter('?').show();

    this.clerk.start(options);

    var help = vorpal.find('help');
    if (help) {
      //help.remove();
    }

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }
  }
};

module.exports = app;