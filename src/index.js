'use strict';

const Vorpal = require('vorpal');
const vorpal = new Vorpal();
const less = require('vorpal-less');
const grep = require('vorpal-grep');

const app = {

  vorpal,

  init(options) {
    options = options || {};

    const dir = `${__dirname}/.`;

    this.clerk = require('./clerk/clerk')(app);
    this.spider = require('./spider/spider')(app);
    this.autodocs = require('./autodocs/autodocs')(app);
    this.cosmetician = require('./cosmetician/cosmetician')(app);

    const modules = ['sigint', 'theme', 'indexer', 'updater', 'spider', 'catch', 'autodocs', 'hist', 'tour', 'proxy'];
    for (let i = 0; i < modules.length; ++i) {
      vorpal.use(`${dir}/vorpal/${modules[i]}.js`, {app: app});
    }

    vorpal
      .use(less)
      .use(grep)
      .delimiter('?')
      .show();

    this.clerk.start(options);

    if (process.argv.length > 2) {
      vorpal.parse(process.argv);
    }
  }
};

module.exports = app;
