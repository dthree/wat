
"use strict";

/**
 * Module dependencies.
 */

var _ = require('lodash');
var chalk = require('chalk');
var fs = require('fs');
var hljs = require('highlight.js');

/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

var preference = 'default';

var configPath = './../config/highlight/' + preference + '.json';
var config = undefined;

try {
  config = require(configPath);
} catch (e) {
  console.log('Dir Name:', __dirname);
  console.log('Base:', __base);
  console.log('Full Path:', configPath);
  console.log(e.stack);
}

var mapping = {};

for (var lang in config) {
  mapping[lang] = mapping[lang] || {};
  var ctr = 0;
  for (var item in config[lang]) {
    ctr++;
    if (lang === 'markdown') {
      mapping[lang][config[lang][item] + ctr] = new RegExp("\<md-" + item + "\>(.*?)\<\/md\>", "g");
    } else {
      mapping[lang][config[lang][item] + ctr] = new RegExp("\<span class=\"hljs-" + item + "\"\>(.*?)\<\/span\>", "g");
    }
  }
}

module.exports = function (data, lang, options) {

  var fallback = !mapping[lang] ? 'default' : void 0;

  var hl = undefined;
  data = module.exports.unescape(data);
  if (lang === 'markdown') {
    hl = data;
  } else {
    if (!lang) {
      hl = hljs.highlightAuto(data);
    } else {
      hl = hljs.highlight(lang, data);
    }
    if (hl.language) {
      fallback = hl.language;
    }
    hl = hl.value;
  }

  var mappingLang = fallback || lang;
  mappingLang = !mapping[mappingLang] ? 'default' : mappingLang;

  for (var color in mapping[mappingLang]) {
    var clr = String(color).replace(/[0-9]/g, '');
    hl = String(hl).replace(mapping[mappingLang][color], chalk[clr]('$1'));
  }

  // Catch any highlighting not seen with defaults.
  for (var color in mapping['default']) {
    var clr = String(color).replace(/[0-9]/g, '');
    hl = String(hl).replace(mapping['default'][color], chalk[clr]('$1'));
  }

  return hl;
};

_.extend(module.exports, {

  unescape: function unescape(data) {
    data = data.replace(/&lt;/g, '<');
    data = data.replace(/&gt;/g, '>');
    data = data.replace(/&apos;/g, '\'');
    data = data.replace(/&quot;/g, '"');
    data = data.replace(/&amp;/g, '&');
    data = data.replace(/&#39;/g, '\'');
    return data;
  }

});