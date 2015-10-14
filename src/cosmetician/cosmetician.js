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

const markterm = require('./markterm');
const highlighter = require('./highlighter');
const chalk = require('chalk');

const cosmetician = {

  theme(theme) {
    const result = highlighter.theme(theme);
    if (result !== false) {
      this.app.clerk.prefs.set('theme', theme);
    }
    return result;
  },

  getThemes: highlighter.getThemes,

  markdownToTerminal(data, options) {
    data = markterm(data, options || {});
    data = highlighter.highlight(data, 'markdown', {});
    data = this.shave(data);
    data = this.tab(data, 2);
    return `\n${data}\n`;
  },

  tab(data, amt, char) {
    amt = amt || 2;
    char = char || ' ';
    const parts = String(data).split('\n');
    for (let i = 0; i < parts.length; ++i) {
      parts[i] = this.pad('', amt, char) + parts[i];
    }
    return parts.join('\n');
  },

  shave(data) {
    const parts = String(data).split('\n');
    function shaveStart() {
      if (String(parts[0]).trim() === '') {
        parts.shift();
        return shaveStart();
      }
    }
    function shaveEnd() {
      if (String(parts[parts.length - 1]).trim() === '') {
        parts.pop();
        return shaveEnd();
      }
    }
    shaveStart();
    shaveEnd();
    return parts.join('\n');
  },

  hr(pad) {
    pad = pad || 2;
    const width = process.stdout.columns - (pad * 2);
    let str = '';
    for (let i = 0; i < width; ++i) {
      str += '-';
    }
    return `${str}\n`;
  },

  pad(str, width, delimiter) {
    width = Math.floor(width);
    delimiter = delimiter || ' ';
    const len = Math.max(0, width - String(str).length);
    return str + Array(len + 1).join(delimiter);
  }
};

module.exports = function (app) {
  const self = cosmetician;
  cosmetician.app = app;
  markterm.cosmetician = cosmetician;
  markterm.setOptions({
    gfm: true,
    sanitize: true,
    highlight(code, lang) {
      let results = code;
      try {
        results = highlighter.highlight(code, lang, {});
        results = self.tab(results, 2, ' ');
        results = self.tab(results, 1, chalk.bgWhite(' '));
      } catch(e) {
        console.log(e.stack);
      }
      return results;
    }
  });
  highlighter.theme('default');
  return cosmetician;
};

