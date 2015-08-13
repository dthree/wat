
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');

const util = {

  /**
  * Handles tabbed auto-completion based on
  * the doc index. Works perfectly. Looks ugly
  * as hell. Hey: It works.
  *
  * @param {String} text
  * @param {Integer} iteration
  * @param {Object} index
  * @return {String or Array}
  * @api public
  */

  autocomplete: function(text, iteration, index) {
    let commands = sanitizePath(String(text).trim().split(' '));
    let lastWord = String(commands[commands.length-1]).trim();
    let otherWords = commands.slice(0, commands.length-1);

    let levels = 0;
    let remaining = _.clone(commands);
    function traverse(arr, idx) {
      var word = arr.shift();
      if (idx[word]) {
        levels++;
        return traverse(arr, idx[word]);
      } else {
        var items = [];
        for (let item in idx) {
          if (idx.hasOwnProperty(item)) {
            items.push(item);
          }
        }
        return items;
      }
    }

    const possibilities = traverse(remaining, index);
    const match = this.match(String(lastWord).trim(), possibilities);
    const exactMatch = (possibilities.indexOf(lastWord) > -1);

    if (match && levels !== otherWords.length + 1) {
      let space = (possibilities.indexOf(String(match).trim()) > -1) ? ' ' : '';
      let result = String(otherWords.join(' ') + ' ' + match).trim() + space;
      cb(void 0, result);
    } else {
      let space = (levels === otherWords.length + 1) ? ' ' : '';
      let original = commands.join(' ') + space;
      if (iteration > 1 && possibilities.length > 1) {
        cb(void 0, possibilities);
      } else if (iteration > 1 && possibilities.length === 1) {
        let result = original + possibilities[0] + ' ';
        cb(void 0, result);
      } else {
        cb(void 0, original);
      }
    }
  }

}

module.exports = util;

