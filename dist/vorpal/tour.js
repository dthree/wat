'use strict';

var chalk = require('chalk');
var vtour = require('vorpal-tour');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.use(vtour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour: function tour(_tour) {
      _tour = require('./../tour')(_tour, app);
      return _tour;
    }
  });
};