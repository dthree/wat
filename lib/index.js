
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const request = require('request');
const Vantage = require('vantage');
const chalk = require('chalk');

const highlighter = require('./highlighter');

var vantage = new Vantage();


/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

module.exports = function(vantage) {


};

const root = 'https://raw.githubusercontent.com/vantagejs/uh/master/docs/';

vantage
  .delimiter('?')
  .show();

vantage
  .command('[commands...]')
  .action(function(args, cb){
    const self = this;
    const file = 'js/array/slice.md';

    args = args || {}
    args.commands = args.commands || [];

    let actual = `js/${args.commands.join('/')}.md`;

    request(root + actual, function(err, response, body){
      if (!err) {
        if (body === 'Not Found') {
          self.log(`Markdown not found:\n${root + actual}`);
        } else {
          self.log(`\n${body}`);
        }
      } else {
        self.log('Err: ' + err);
      }
      cb();
    });

  });


var block = ` 
  let foo = "bar";
  // see what I mean?

  for (var i = 0; i < item.length; ++i) {
    console.log('whatever');
  }
`;

var results = highlighter('js', block, {});

vantage.log(results);
