'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var lev = require('leven');
var request = require('request');

var util = {

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

  autocomplete: function autocomplete(text, iteration, index, matchFn) {
    var commands = util.command.prepare(text, {}, index);
    var lastWord = String(commands[commands.length - 1]).trim();
    var otherWords = commands.slice(0, commands.length - 1);

    var levels = 0;
    var possibilities = util.traverseIndex(_.clone(commands), index, function () {
      levels++;
    });

    var match = matchFn(String(lastWord).trim(), possibilities);

    var response = undefined;
    if (match && levels !== otherWords.length + 1) {
      var space = possibilities.indexOf(String(match).trim()) > -1 ? ' ' : '';
      response = '' + String(otherWords.join(' ') + '  match').trim() + space;
    } else {
      var space = levels === otherWords.length + 1 ? ' ' : '';
      var original = '' + commands.join(' ') + space;
      if (iteration > 1 && possibilities.length > 1) {
        response = possibilities;
      } else if (iteration > 1 && possibilities.length === 1 && otherWords.length !== levels) {
        response = '' + original + possibilities[0] + '  ';
      } else {
        response = original;
      }
      return response;
    }
  },

  /**
  * Takes an existing array of words
  * and matches it against the index.
  * Whenever a word can be standardized
  * with the index, such as on casing,
  * it cleans up the word and returns it.
  * For example,
  * ['the', 'veryquick ', 'fox'] will become
  * ['the', 'veryQuick', 'fox']
  * based on the index.
  *
  * @param {Array} arr
  * @param {Object} idx
  * @param {Function} each
  * @param {Array} results
  * @return {Array} results
  * @api public
  */

  standardizeAgainstIndex: function standardizeAgainstIndex(arr, idx, each, results) {
    results = results || [];
    each = each || function () {};
    var word = arr.shift();

    // Use a levenshtein distance algorithm
    // to look for appriximate matches. If we feel
    // safe enough, automagically adopt the match.
    if (String(word).trim().length > 0) {
      var res = util.levenshteinCompare(word, idx);

      if (res.distance === 0) {
        word = res.key;
      } else if (res.distance === 1 && res.difference > 3) {
        word = res.key;
      } else if (res.distance === 2 && res.difference > 5 && String(res.key).length > 5) {
        word = res.key;
      }
    }

    var response = undefined;
    if (idx[word]) {
      each(arr, idx[word]);
      results.push(word);
      response = util.standardizeAgainstIndex(arr, idx[word], each, results);
    } else {
      if (word) {
        results.push(word);
      }
      response = results;
    }
    return response;
  },

  parseCommandsFromPath: function parseCommandsFromPath(path) {
    var parts = String(path).split('docs/');
    var commands = '';
    if (parts.length > 1) {
      parts.shift();
      commands = parts.join('docs/');
    } else {
      commands = path;
    }
    return String(commands).split('/');
  },

  levenshteinCompare: function levenshteinCompare(word, obj) {
    var keys = Object.keys(obj);
    var results = {
      firstKey: undefined,
      firstDistance: 1000,
      secondKey: undefined,
      secondDistance: 1000
    };
    for (var i = 0; i < keys.length; ++i) {
      if (keys[i] === 'index') {
        continue;
      }
      var distance = lev(String(word).trim().toLowerCase(), String(keys[i]).trim().toLowerCase());
      if (distance < results.firstDistance) {
        results.firstDistance = distance;
        results.firstKey = keys[i];
      } else if (distance < results.secondDistance) {
        results.secondDistance = distance;
        results.secondKey = keys[i];
      }
    }
    return {
      key: results.firstKey,
      distance: results.firstDistance,
      difference: results.secondDistance - results.firstDistance
    };
  },

  /**
  * Takes an existing array of words
  * and matches it against the index, returning
  * all available commands for the next
  * command, having matched x commands so far.
  * For example,
  * ['the', 'quick', 'brown'] will return
  * ['fox', 'dog', 'goat']
  * based on the index, as the index has
  * three .md files in the `brown` folder.
  *
  * @param {Array} arr
  * @param {Object} idx
  * @param {Function} each
  * @return {Array} results
  * @api public
  */

  traverseIndex: function traverseIndex(arr, idx, each) {
    each = each || function () {};
    var word = arr.shift();
    var result = undefined;
    if (idx[word]) {
      each(arr, idx[word]);
      result = util.traverseIndex(arr, idx[word], each);
    } else {
      var items = [];
      for (var item in idx) {
        if (idx.hasOwnProperty(item) && String(item).slice(0, 2) !== '__' && String(item) !== 'index') {
          var match = String(word || '').toLowerCase() === String(item).slice(0, String(word || '').length).toLowerCase();
          if (match) {
            items.push(item);
          }
        }
      }
      result = items;
    }
    return result;
  },

  fetchRemote: function fetchRemote(path, cb) {
    request(path, function (err, response, body) {
      if (!err) {
        if (body === 'Not Found') {
          cb('Not Found', undefined);
        } else {
          cb(undefined, body, response);
        }
      } else {
        cb(err, '');
      }
    });
  },

  pad: function pad(str, width, delimiter) {
    width = Math.floor(width);
    delimiter = delimiter || ' ';
    var len = Math.max(0, width - str.length);
    return str + Array(len + 1).join(delimiter);
  },

  extensions: {
    '__basic': '.md',
    '__detail': '.detail.md',
    '__install': '.install.md'
  },

  command: {

    /**
    * Takes a raw string entered by the user,
    * sanitizes it and returns it as an array
    * of words.
    *
    * @param {String} str
    * @return {Array}
    * @api public
    */

    prepare: function prepare(str, options, index) {
      options = options || {};
      var all = [];
      var commands = _.isArray(str) ? str : String(str).trim().split(' ');
      for (var i = 0; i < commands.length; ++i) {
        var parts = commands[i].split('.');
        for (var j = 0; j < parts.length; ++j) {
          var word = String(parts[j]).trim().replace(/\)/g, '').replace(/\(/g, '').replace(/\;/g, '');
          all.push(word);
        }
      }

      var standardized = util.standardizeAgainstIndex(_.clone(all), index);
      return standardized;
    },

    /**
    * Takes a raw string and converts it into
    * a ready URL root to try loading.
    *
    * @param {String} str
    * @return {String}
    * @api public
    */

    buildPath: function buildPath(str, options, index) {
      var all = util.command.prepare(str, options, index);
      var indexObject = util.command.getIndex(_.clone(all), index);
      var response = {
        path: undefined,
        exists: false,
        suggestions: undefined,
        index: undefined
      };

      if (!indexObject) {
        response.exists = false;
      } else if (_.isArray(indexObject)) {
        response.suggestions = indexObject;
      } else {
        response.index = indexObject;
        response.exists = true;
      }
      var path = all.join('/');
      response.path = path;
      return response;
    },

    /**
    * Returns the deepest index object
    * for a given array of commands.
    *
    * @param {Array} arr
    * @param {Object} idx
    * @param {Array} results
    * @return {Boolean} valid
    * @api public
    */

    getIndex: function getIndex(arr, idx) {
      var word = arr.shift();
      var result = undefined;
      if (idx[word]) {
        result = util.command.getIndex(arr, idx[word]);
      } else if (!word) {
        if (idx.index) {
          if (_.isObject(idx.index)) {
            idx.index.__isIndexFile = true;
          }
          result = idx.index;
        } else if (idx.__basic) {
          result = idx;
        } else {
          result = Object.keys(idx);
        }
      }
      return result;
    },

    /**
    * Takes the end string of command,
    * 'splice' in 'js array splice',
    * reads its index JSON, and compares
    * these to the passed in options in order
    * to determine the valid .md structure, i.e.
    * splice.md, splice.detail.md, splice.install.md,
    * etc. etc. etc.
    *
    * @param {Array} arr
    * @param {Object} idx
    * @param {Array} results
    * @return {Boolean} valid
    * @api public
    */

    buildExtension: function buildExtension(path, index, options) {
      var result = undefined;

      if (_.isObject(index) && index.__isIndexFile === true) {
        path += '/index';
      }

      if (options.detail && index.__detail) {
        result = path + '.detail.md';
      } else if (options.install && index.__install) {
        result = path + '.install.md';
      } else {
        result = path + '.md';
      }
      return result;
    }
  }
};

module.exports = util;