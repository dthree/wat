'use strict';

var chalk = require('chalk');

module.exports = function (vorpal) {
  // Goodbye in one of 12 languages on sigint.
  vorpal.sigint(function () {
    var goodbye = ['Adios', 'Goodbye', 'Au Revoir', 'Ciao', 'Pa', 'Ade', 'Dag', 'Farvel', 'Poka', 'Ćao', 'Shalom', 'Aloha'];
    var address = goodbye[Math.floor(Math.random() * goodbye.length)];
    vorpal.log(chalk.cyan(address + '!'));
    vorpal.ui.pause();
    process.exit(0);
  });
};