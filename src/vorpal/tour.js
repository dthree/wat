'use strict';

const chalk = require('chalk');
const tour = require('./touri');

module.exports = function(vorpal, options) {
  const app = options.app;

  vorpal.use(tour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour: function(tour) {
      tour = require('./../tour')(tour, app);
      return tour;
    }
  })
}
