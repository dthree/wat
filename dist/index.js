'use strict';

var Vorpal = require('vorpal');
var vorpal = new Vorpal();
var less = require('vorpal-less');
var grep = require('vorpal-grep');

var app = {

  vorpal: vorpal,

  init: function init(options) {
    options = options || {};

    var dir = __dirname + '/.';

    this.clerk = require('./clerk/clerk')(app);
    this.spider = require('./spider/spider')(app);
    this.autodocs = require('./autodocs/autodocs')(app);
    this.cosmetician = require('./cosmetician/cosmetician')(app);

    var modules = ['sigint', 'theme', 'indexer', 'updater', 'spider', 'catch', 'autodocs', 'hist', 'tour', 'proxy'];
    for (var i = 0; i < modules.length; ++i) {
      vorpal.use(dir + '/vorpal/' + modules[i] + '.js', { app: app });
    }

    vorpal.use(less).use(grep).delimiter('?').show();

    if (process.argv.indexOf('dev') > -1) {
      options.updateRemotely = false;
      process.argv.splice(2, process.argv.length);
      vorpal.log('\n  You\'re now in document development mode.\n  You will be able to see your local document changes.\n');
    }

    this.updateRemotely = options.updateRemotely;

    this.clerk.start(options);

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }
  }
};

module.exports = app;