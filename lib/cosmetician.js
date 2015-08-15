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

const _ = require('lodash');
const markterm = require('./markterm');
const highlighter = require('./highlighter');

const cosmetician = {

  init() {
    const self = this;
    markterm.setOptions({
      gfm: true,
      sanitize: true,
      highlight: function(code, lang) {
        let results = code;
        try {
          results = highlighter(code, lang, {});
          results = self.tab(results, 2, ' ');
          results = self.tab(results, 1, '|');
        } catch(e) {
          console.log(e.stack);
        }
        return results;
      }  
    });
  },

  markdownToTerminal(data) {
    data = markterm(data, {});
    data = highlighter(data, 'markdown', {});
    data = this.tab(data, 2);
    data = this.shave(data);
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
      if (String(parts[parts.length-1]).trim() === '') {
        parts.pop();
        return shaveEnd();
      }
    }
    shaveStart();
    shaveEnd();
    return parts.join('\n');
  },

  pad(data, amt, char) {
    let str = data;
    for (var i = 0; i < amt; ++i) {
      str = str + char;
    }
    return str;
  },

}

cosmetician.init();

module.exports = cosmetician;
