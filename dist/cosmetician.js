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

  init: function init(parent) {
    var self = this;
    this.parent = parent;
    markterm.cosmetician = cosmetician;
    markterm.setOptions({
      gfm: true,
      sanitize: true,
      highlight: function highlight(code, lang) {
        var results = code;
        try {
          results = highlighter.highlight(code, lang, {});
          results = self.tab(results, 2, ' ');
          results = self.tab(results, 1, '|');
        } catch (e) {
          console.log(e.stack);
        }
        return results;
      }
    });
    highlighter.theme('default');
  },

  theme: function theme(_theme) {
    this.parent.clerk.prefs.set('theme', _theme);
    return highlighter.theme(_theme);
  },

  getThemes: highlighter.getThemes,

  markdownToTerminal: function markdownToTerminal(data, options) {
    data = markterm(data, options || {});
    data = highlighter.highlight(data, 'markdown', {});
    data = this.shave(data);
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
  }
};

module.exports = cosmetician;