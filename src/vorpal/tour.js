'use strict';

const chalk = require('chalk');
const vtour = require('vorpal-tour');

module.exports = function(vorpal, options) {
  const app = options.app;

  vorpal.use(vtour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour: function(tour) {
      tour = require('./../tour')(tour, app);
      return tour;
    }
  })
}
