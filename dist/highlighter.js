
"use strict";

/**
 * Module dependencies.
 */

var _ = require('lodash');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var hljs = require('highlight.js');

/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

var mapping = {};

var highlighter = {

  configPath: __dirname + '/../config/highlight',

  allClasses: ["class", "comment", "constant", "function", "keyword", "number", "regexp", "string", "subst", "symbol", "title", "variable", "addition", "annotaion", "annotation", "argument", "array", "aspect", "at_rule", "atom", "attr_selector", "attribute", "begin", "blockquote", "body", "built_in", "bullet", "cbracket", "cdata", "cell", "change", "char", "characteristic", "chunk", "code", "collection", "command", "commands", "component", "container", "data", "date", "decorator", "default", "deletion", "doctag", "doctype", "emphasis", "end", "envvar", "expression", "facet", "filename", "filter", "flow", "foreign", "formula", "func", "function_name", "generics", "header", "hexcolor", "horizontal_rule", "id", "import", "important", "infix", "inheritance", "input", "instance", "instruction", "io", "keywords", "kind", "label", "link_label", "link_reference", "link_url", "list", "literal", "localvars", "long_brackets", "matrix", "misc_keyword", "module", "operator", "output", "package", "param", "parameter", "params", "parent", "pi", "pod", "pp", "pragma", "preprocessor", "prompt", "property", "pseudo", "quoted", "record_name", "regex", "request", "reserved", "rest_arg", "rule", "rules", "section", "shader", "shading", "shebang", "special", "sqbracket", "status", "stream", "strong", "sub", "summary", "tag", "template_tag", "type", "typedef", "typename", "units", "value", "var_expand", "verb", "winutils", "xmlDocTag"],

  theme: function theme(str) {
    var theme = str || 'default';
    var config = undefined;
    var file = highlighter.configPath + '/' + theme + '.json';
    try {
      config = require(file);
    } catch (e) {
      return false;
    }

    this.mapping = {};

    for (var i = 0; i < this.allClasses.length; ++i) {
      this.mapping['fallback'] = new RegExp("\<span class=\"hljs-" + this.allClasses[i] + "\"\>(.*?)\<\/span\>", "g");
    }

    for (var lang in config) {
      this.mapping[lang] = this.mapping[lang] || {};
      var ctr = 0;
      for (var item in config[lang]) {
        ctr++;
        var styles = config[lang][item];
        styles = _.isArray(styles) ? styles : [styles];
        for (var j = 0; j < styles.length; ++j) {
          if (lang === 'markdown') {
            this.mapping[lang][styles[j] + ctr] = new RegExp("\<md-" + item + "\>(.*?)\<\/md\>", "g");
          } else {
            this.mapping[lang][styles[j] + ctr] = new RegExp("\<span class=\"hljs-" + item + "\"\>(.*?)\<\/span\>", "g");
          }
        }
      }
    }

    return this.mapping;
  },

  getThemes: function getThemes() {
    var themes = [];
    fs.readdirSync(highlighter.configPath).forEach(function (name) {
      var parts = String(name).split('.');
      if (parts[parts.length - 1] === 'json') {
        parts.pop();
        themes.push(parts.join('.'));
      }
    });
    return themes;
  },

  highlight: function highlight(data, lang, options) {
    var fallback = !this.mapping[lang] ? 'default' : void 0;
    var hl = this.unescape(data);

    if (lang !== 'markdown') {
      if (!lang) {
        hl = hljs.highlightAuto(hl);
      } else {
        try {
          hl = hljs.highlight(lang, hl);
        } catch (e) {
          hl = hljs.highlightAuto(hl);
        }
      }
      if (hl.language) {
        fallback = hl.language;
      }
      hl = hl.value;
    }

    var mappingLang = fallback || lang;
    mappingLang = !this.mapping[mappingLang] ? 'default' : mappingLang;

    // If a custom language is detected, apply its styles.
    for (var color in this.mapping[mappingLang]) {
      var clr = String(color).replace(/[0-9]/g, '');
      hl = String(hl).replace(this.mapping[mappingLang][color], chalk[clr]('$1'));
    }

    // If the "default" styles weren't applied, apply them now.
    if (mappingLang !== 'default') {
      for (var color in this.mapping['default']) {
        var clr = String(color).replace(/[0-9]/g, '');
        hl = String(hl).replace(this.mapping['default'][color], chalk[clr]('$1'));
      }
    }

    // Catch any highlighting tags not given in
    // that theme file, and reset any color on them.
    for (var style in this.mapping['fallback']) {
      hl = String(hl).replace(this.mapping['fallback'][style], chalk['reset']('$1'));
    }

    return hl;
  },

  unescape: function unescape(data) {
    data = data.replace(/&lt;/g, '<');
    data = data.replace(/&gt;/g, '>');
    data = data.replace(/&apos;/g, '\'');
    data = data.replace(/&quot;/g, '"');
    data = data.replace(/&amp;/g, '&');
    data = data.replace(/&#39;/g, '\'');
    return data;
  }

};

module.exports = highlighter;