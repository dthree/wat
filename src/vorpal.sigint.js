"use strict";

const chalk = require('chalk');

module.exports = function(vorpal, options) {

  const parent = options.parent;

  // Goodbye in one of 12 languages on sigint.
  vorpal.sigint(function(){
    const goodbye = ['Adios', 'Goodbye', 'Au Revoir', 'Ciao', 'Pa', 'Ade', 'Dag', 'Farvel', 'Poka', 'Ćao', 'Shalom', 'Aloha'];
    const address = goodbye[Math.floor(Math.random() * goodbye.length)];
    vorpal.log(chalk.cyan(address + '!'));
    vorpal.ui.pause();
    process.exit(0);
  });
}
