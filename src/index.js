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
      .use(`${dir}/vorpal.updater.js`, {parent: app})
      .use(`${dir}/vorpal.spider.js`, {parent: app})
      .use(`${dir}/vorpal.catch.js`, {parent: app})
      .use(`${dir}/vorpal.hist.js`, {parent: app})
      .delimiter('?')
      .show();

    const xlt = {
      'd': 'detail',
      'i': 'install'
    };

    const args = {options: {}};
    for (const item in argv) {
      if (item === '_') {
        args.commands = argv[item];
      } else if (xlt[item]) {
        args.options[xlt[item]] = argv[item];
      } else {
        args.options[item] = argv[item];
      }
    }

    if (process.argv.length > 2) {
      vorpal.exec(args.commands.join(' '), args);
    }
  }
};

module.exports = app;
