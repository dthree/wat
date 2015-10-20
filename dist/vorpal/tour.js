'use strict';

var vtour = require('vorpal-tour');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.use(vtour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour: function tour(_tour) {
      var t = require('./../tour')(_tour, app);
      _tour = t;
      return _tour;
    }
  });
};