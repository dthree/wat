'use strict';

var chalk = require('chalk');
var tour = require('./touri');

module.exports = function (vorpal, options) {
  var app = options.app;

  vorpal.use(tour, {
    command: 'tour',
    description: 'A tour through Wat.',
    tour: function tour(_tour) {
      _tour = require('./../tour')(_tour, app);
      return _tour;
    }
  });
};