'use strict';

/**
 * Yes, I named it cosmetician intentionally.
 *
 *
 * Problems?
 */

/**
 * Module dependencies.
 */

var _ = require('lodash');
var chalk = require('chalk');
var markterm = require('./markterm');
var highlighter = require('./highlighter');

var cosmetician = {

  init: function init() {
    var self = this;
    markterm.cosmetician = cosmetician;
    markterm.setOptions({
      gfm: true,
      sanitize: true,
      highlight: function highlight(code, lang) {
        var results = code;
        try {
          results = highlighter(code, lang, {});
          results = self.tab(results, 2, ' ');
          results = self.tab(results, 1, '|');
        } catch (e) {
          console.log(e.stack);
        }
        return results;
      }
    });
  },

  markdownToTerminal: function markdownToTerminal(data, options) {
    data = markterm(data, options || {});
    data = highlighter(data, 'markdown', {});
    data = this.shave(data);
    //data = this.wrap(data, process.stdout.columns - 4);
    data = this.tab(data, 2);
    return '\n' + data + '\n';
  },

  tab: function tab(data, amt, char) {
    amt = amt || 2;
    char = char || ' ';
    var parts = String(data).split('\n');
    for (var i = 0; i < parts.length; ++i) {
      parts[i] = this.pad('', amt, char) + parts[i];
    }
    return parts.join('\n');
  },

  shave: function shave(data) {
    var parts = String(data).split('\n');
    function shaveStart() {
      var _again = true;

      _function: while (_again) {
        _again = false;

        if (String(parts[0]).trim() === '') {
          parts.shift();
          _again = true;
          continue _function;
        }
      }
    }
    function shaveEnd() {
      var _again2 = true;

      _function2: while (_again2) {
        _again2 = false;

        if (String(parts[parts.length - 1]).trim() === '') {
          parts.pop();
          _again2 = true;
          continue _function2;
        }
      }
    }
    shaveStart();
    shaveEnd();
    return parts.join('\n');
  },

  hr: function hr(pad) {
    pad = pad || 2;
    var width = process.stdout.columns - pad * 2;
    var str = '';
    for (var i = 0; i < width; ++i) {
      str += '-';
    }

    return '' + str + '\n';
  },

  pad: function pad(str, width, delimiter) {
    width = Math.floor(width);
    delimiter = delimiter || " ";
    var len = Math.max(0, width - String(str).length);
    return str + Array(len + 1).join(delimiter);
  },

  wrap: function wrap(string, width) {
    var lines = [];
    var stripped = chalk.stripColor(string);
    var text = util.inspect(string);
    text = text.slice(1, text.length - 1);
    var color = void 0;
    var line = '';
    var lineN = 0;
    var fullN = 0;
    function endLine() {
      if (color) {
        line += color;
      }
      lines.push(line);
      line = '';
      lineN = 0;
    }
    function nextSpace(str) {
      var ctr = 0;
      str = chalk.stripColor(str);
      for (var i = 0; i < str.length; ++i) {
        if (str[i] === ' ') {
          return ctr;
        } else {
          ctr++;
        }
      }
      return void 0;
    }
    for (var i = 0; i < text.length; ++i) {
      var spaceN = nextSpace(stripped.slice(fullN)) || 0;
      if (lineN + spaceN + 2 >= width) {
        endLine();
      }
      var char = text.slice(i, i + 1);
      var nChars = text.slice(i, i + 10);
      var nMatch = colors.indexOf(nChars) > -1 ? nChars : void 0;
      if (nMatch === undefined) {
        line += char;
        lineN++;
        fullN++;
      } else {
        color = nMatch === '\\u001b[39m' ? void 0 : nMatch;
        line += nChars;
        i += 9;
      }
    }
    endLine();
    return String(lines.join('\n')).replace(/\\u001b/g, '\u001b');
  }

};

var colors = ['\\u001b[0m', '\\u001b[1m', '\\u001b[2m', '\\u001b[3m', '\\u001b[4m', '\\u001b[5m', '\\u001b[6m', '\\u001b[7m', '\\u001b[8m', '\\u001b[30m', '\\u001b[31m', '\\u001b[32m', '\\u001b[33m', '\\u001b[34m', '\\u001b[35m', '\\u001b[36m', '\\u001b[37m', '\\u001b[39m', '\\u001b[40m', '\\u001b[41m', '\\u001b[42m', '\\u001b[43m', '\\u001b[44m', '\\u001b[45m', '\\u001b[46m', '\\u001b[47m'];
var util = require('util');

/*
const str = 
  'The quick brown ' + 
  chalk.red('fox jumped over ') + 
  'the lazy ' + 
  chalk.green('dog and then ran ' + 
    'away with the unicorn.');
*/

cosmetician.init();

module.exports = cosmetician;