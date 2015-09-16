'use strict';

/**
 * Module dependencies.
 */

const Vorpal = require('vorpal');
const vorpal = new Vorpal();

const app = {

  vorpal,

  init(options) {
    options = options || {};

    const dir = `${__dirname}/.`;

    vorpal
      .delimiter('?')
      .show()
      .use(`${dir}/vorpal/sigint.js`, {app: app})
      .use(`${dir}/vorpal/theme.js`, {app: app})
      .use(`${dir}/vorpal/indexer.js`, {app: app})
      .use(`${dir}/vorpal/updater.js`, {app: app})
      .use(`${dir}/vorpal/spider.js`, {app: app})
      .use(`${dir}/vorpal/catch.js`, {app: app})
      .use(`${dir}/vorpal/autodocs.js`, {app: app})
      .use(`${dir}/vorpal/hist.js`, {app: app});

    this.clerk = require('./clerk/clerk')(app);
    this.spider = require('./spider/spider')(app);
    this.autodocs = require('./autodocs/autodocs')(app);
    this.cosmetician = require('./cosmetician/cosmetician')(app);

    this.clerk.start(options);

    const help = vorpal.find('help');
    if (help) {
      help.remove();
    }

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }
  }
};


module.exports = app;