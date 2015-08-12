
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const request = require('request');
const Vantage = require('vantage');
const chalk = require('chalk');
const markterm = require('./markterm');
const highlighter = require('./highlighter');

var vantage = new Vantage();

//console.log(markterm)

markterm.setOptions({
  gfm: true,
  sanitize: true,
  highlight: function(code, lang) {
    let results = code;
    try {
      results = highlighter(code, lang, {});
    } catch(e) {
      console.log(e.stack);
    }
    return results;
  }  
});


/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

module.exports = function(vantage) {


};

const root = 'https://raw.githubusercontent.com/vantagejs/uh/master/docs/';

function getPath(path, cb) {
  const actual = `${path}.md`;
  const index = `${path}/index.md`;
  request(root + actual, function(err, response, body) {
    if (!err) {
      if (body === 'Not Found') {
        request(root + index, function(err2, response2, body2) {
          if (!err) {
            if (body2 === 'Not Found') {
              cb(void 0, `Markdown not found:\n${root + actual}`);
            } else {
              cb(void 0, `${body2}`);
            }
          } else {
            cb(err2, '');
          }
        });
      } else {
        cb(void 0, `${body}`);
      }
    } else {
      cb(err2, '');s
    }
  });
}

function pad(data, amt, char) {
  let str = data;
  for (var i = 0; i < amt; ++i) {
    str = str + char;
  }
  return str;
}

function tab(data, amt) {
  amt = amt || 2;
  var parts = String(data).split('\n');
  for (var i = 0; i < parts.length; ++i) {
    parts[i] = pad('', amt, ' ') + parts[i];
  }
  return parts.join('\n');
}

function shave(data) {
  var parts = String(data).split('\n');
  var shaveStart = function() {
    if (String(parts[0]).trim() === '') {
      parts.shift();
      return shaveStart();
    }
  }
  var shaveEnd = function() {
    if (String(parts[0]).trim() === '') {
      parts.pop();
      return shaveEnd();
    }
  }
  shaveStart();
  shaveEnd();
  return parts.join('\n');
}

function formatMarkdown(data) {
  data = markterm(data, {});
  data = shave(data);
  data = tab(data, 2);
  return `\n${data}\n`;
}

vantage
  .delimiter('?')
  .removeCommand('vantage')
  .show();

vantage
  .catch('[commands...]')
  .action(function(args, cb){
    const self = this;

    args = args || {}
    args.commands = args.commands || [];

    var path = args.commands.join('/');

    getPath(path, function(err, data) {
      if (err) {
        self.log('Error: ' + err);
      } else {
        if (String(data).indexOf('Markdown not found') == -1) {
          data = formatMarkdown(data);
        } 
        self.log(data);
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

//vantage.log(results);
