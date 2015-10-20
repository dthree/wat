'use strict';

const vtour = require('vorpal-tour');

module.exports = function (vorpal, options) {
  const app = options.app;

  vorpal.use(vtour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour(tour) {
      const t = require('./../tour')(tour, app);
      tour = t;
      return tour;
    }
  });
};
