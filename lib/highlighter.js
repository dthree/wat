
"use strict";

/**
 * Module dependencies.
 */

const chalk = require('chalk');
const fs = require('fs');
const hljs = require('highlight.js');

/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

let preference = 'default';

const config = require(`./../config/highlight/${preference}.json`);

const mapping = {}

for (var lang in config) {
  mapping[lang] = mapping[lang] || {}
  let ctr = 0;
  for (let item in config[lang]) {
    ctr++;
    mapping[lang][config[lang][item] + ctr] = new RegExp("\<span class=\"hljs-" + item + "\"\>(.*?)\<\/span\>", "g");
  }
}

module.exports = function(lang, data, options) {

  let result = hljs.highlight(lang, data);
  let hl = result.value;

  if (!mapping[lang]) {
    throw new Error(`${lang} is not a supported highlighting language.`);
  }

  for (let color in mapping[lang]) {
    let clr = String(color).replace(/[0-9]/g, '');
    hl = hl.replace(mapping[lang][color], chalk[clr]('$1'));
  }

  hl = hl.replace(/&lt;/g, '<');

  return hl;
};

