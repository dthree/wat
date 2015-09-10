'use strict';

/**
 * Module dependencies.
 */

const Vorpal = require('vorpal');
const argv = require('minimist')(process.argv.slice(2));
const clerk = require('./clerk');
const cosmetician = require('./cosmetician');

const vorpal = new Vorpal();

const app = {

  vorpal,

  cosmetician,

  clerk,

  init(options) {
    options = options || {};
    this.cosmetician.init(app);
    this.clerk.init(app);
    this.clerk.start(options);

    const help = vorpal.find('help');
    if (help) {
      help.remove();
    }

    const dir = `${__dirname}/.`;

    vorpal
      .use(`${dir}/vorpal.sigint.js`, {parent: app})
      .use(`${dir}/vorpal.theme.js`, {parent: app})
      .use(`${dir}/vorpal.indexer.js`, {parent: app})
      .use(`${dir}/vorpal.updater.js`, {parent: app})
      .use(`${dir}/vorpal.spider.js`, {parent: app})
      .use(`${dir}/vorpal.catch.js`, {parent: app})
      .use(`${dir}/vorpal.hist.js`, {parent: app})
      .delimiter('?')
      .show();

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }

  }
};

module.exports = app;
