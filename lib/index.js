
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
const indexer = require('./indexer');

var vantage = new Vantage();

//console.log(markterm)

markterm.setOptions({
  gfm: true,
  sanitize: true,
  highlight: function(code, lang) {
    let results = code;
    try {
      results = highlighter(code, lang, {});
      results = tab(results, 2, ' ');
      results = tab(results, 1, '|');
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
      cb(err, '');
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

function tab(data, amt, char) {
  amt = amt || 2;
  char = char || ' ';
  var parts = String(data).split('\n');
  for (var i = 0; i < parts.length; ++i) {
    parts[i] = pad('', amt, char) + parts[i];
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
    if (String(parts[parts.length-1]).trim() === '') {
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
  data = highlighter(data, 'markdown', {});
  data = tab(data, 2);
  data = shave(data);
  return `\n${data}\n`;
}

function preparePath(commands) {
  commands = commands || [];

  let all = [];
  for (let i = 0; i < commands.length; ++i) {
    var parts = commands[i].split('.');
    for (let j = 0; j < parts.length; ++j) {
      let word = String(parts[j])
        .trim()
        .toLowerCase()
        .replace(/\)/g, '')
        .replace(/\(/g, '')
        .replace(/\;/g, '');
      all.push(word);
    }
  }
  
  let path = all.join('/');
  return path;
}


vantage
  .delimiter('?')
  .removeCommand('vantage')
  .show();

vantage
  .command('index', 'Rebuilds index.')
  .action(function(args, cb){
    indexer.build(function(index){
      console.log(index);
      cb();
    });
  })

vantage
  .catch('[commands...]')
  .action(function(args, cb){
    const self = this;

    args = args || {}

    var path = preparePath(args.commands);


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
