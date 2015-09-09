'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const lev = require('leven');
const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');

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

  autocomplete(text, iteration, index, matchFn) {
    const commands = util.command.prepare(text, {}, index);
    const lastWord = String(commands[commands.length - 1]).trim();
    const otherWords = commands.slice(0, commands.length - 1);

    let levels = 0;
    const possibilities = util.traverseIndex(_.clone(commands), index, function () {
      levels++;
    });

    const match = matchFn(String(lastWord).trim(), possibilities);

    let response;
    if (match && levels !== otherWords.length + 1) {
      const space = (possibilities.indexOf(String(match).trim()) > -1) ? ' ' : '';
      response = `${String(`${otherWords.join(` `)} ${match}`).trim()}${space}`;
    } else {
      const space = (levels === otherWords.length + 1) ? ' ' : '';
      const original = `${commands.join(' ')}${space}`;
      if (iteration > 1 && possibilities.length > 1) {
        response = possibilities;
      } else if (iteration > 1 && possibilities.length === 1 && (otherWords.length !== levels)) {
        response = `${original}${possibilities[0]}  `;
      } else {
        response = original;
      }
    }
    return response;
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

  standardizeAgainstIndex(arr, idx, each, results) {
    results = results || [];
    each = each || function () {};
    let word = arr.shift();

    // Use a levenshtein distance algorithm
    // to look for appriximate matches. If we feel
    // safe enough, automagically adopt the match.
    if (String(word).trim().length > 0) {
      const res = util.levenshteinCompare(word, idx);

      if (res.distance === 0) {
        word = res.key;
      } else if (res.distance === 1 && res.difference > 3) {
        word = res.key;
      } else if (res.distance === 2 && res.difference > 5 && String(res.key).length > 5) {
        word = res.key;
      }
    }

    let response;
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

  parseCommandsFromPath(path) {
    const parts = String(path).split('docs/');
    let commands = '';
    if (parts.length > 1) {
      parts.shift();
      commands = parts.join('docs/');
    } else {
      commands = path;
    }
    return String(commands).split('/');
  },

  levenshteinCompare(word, obj) {
    const keys = Object.keys(obj);
    const results = {
      firstKey: undefined,
      firstDistance: 1000,
      secondKey: undefined,
      secondDistance: 1000
    };
    for (let i = 0; i < keys.length; ++i) {
      if (keys[i] === 'index') {
        continue;
      }
      const distance = lev(String(word).trim().toLowerCase(), String(keys[i]).trim().toLowerCase());
      if (distance < results.firstDistance) {
        results.firstDistance = distance;
        results.firstKey = keys[i];
      } else if (distance < results.secondDistance) {
        results.secondDistance = distance;
        results.secondKey = keys[i];
      }
    }
    return ({
      key: results.firstKey,
      distance: results.firstDistance,
      difference: results.secondDistance - results.firstDistance
    });
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

  traverseIndex(arr, idx, each) {
    each = each || function () {};
    const word = arr.shift();
    let result;
    if (idx[word]) {
      each(arr, idx[word]);
      result = util.traverseIndex(arr, idx[word], each);
    } else {
      const items = [];
      for (const item in idx) {
        if (idx.hasOwnProperty(item) && String(item).slice(0, 2) !== '__' && String(item) !== 'index') {
          const match = (String(word || '').toLowerCase() === String(item).slice(0, String(word || '').length).toLowerCase());
          if (match) {
            items.push(item);
          }
        }
      }
      result = items;
    }
    return result;
  },

  fetchRemote(path, cb) {
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

  pad(str, width, delimiter) {
    width = Math.floor(width);
    delimiter = delimiter || ' ';
    const len = Math.max(0, width - str.length);
    return str + Array(len + 1).join(delimiter);
  },

  /** 
   * Kind of like mkdirp, but without another depedency.
   *
   * @param {String} dir
   * @return {Util}
   * @api public
   */

  mkdirSafe(dir, levels) {
    return mkdirp.sync(dir);
    
    console.log('mkdirsafe', dir, levels);

    dir = String(dir).trim();
    if (dir === '') {
      return;
    }

    levels = levels || 0;
    let dirExists;
    try {
      dirExists = fs.statSync(dir);
    } catch(e) {
      console.log(e.stack)
      if (levels > 20) {
        throw new Error(e);
      }
      dirExists = false;
    }
    if (!dirExists) {
      let success = true;
      try {
        fs.mkdirSync(dir);
      } catch(e) {
        success = false;
      }

      if (!success) {
        const parts = dir.split('/');
        parts.pop();
        const parentDir = parts.join('/');
        this.mkdirSafe(parentDir, levels++);
        this.mkdirSafe(dir, levels++);
      }
    }
    return this;
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

    prepare(str, options, index) {
      options = options || {};
      const all = [];
      const commands = (_.isArray(str))
        ? str
        : String(str).trim().split(' ');
      for (let i = 0; i < commands.length; ++i) {
        const parts = commands[i].split('.');
        for (let j = 0; j < parts.length; ++j) {
          const word = String(parts[j])
            .trim()
            .replace(/\)/g, '')
            .replace(/\(/g, '')
            .replace(/\;/g, '');
          all.push(word);
        }
      }

      const standardized = util.standardizeAgainstIndex(_.clone(all), index);
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

    buildPath(str, options, index) {
      const all = util.command.prepare(str, options, index);
      const indexObject = util.command.getIndex(_.clone(all), index);
      const response = {
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
      const path = all.join('/');
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

    getIndex(arr, idx) {
      const word = arr.shift();
      let result;
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

    buildExtension(path, index, options) {
      let result;

      if (_.isObject(index) && index.__isIndexFile === true) {
        path += '/index';
      }

      if (options.detail && index.__detail) {
        result = `${path}.detail.md`;
      } else if (options.install && index.__install) {
        result = `${path}.install.md`;
      } else {
        result = `${path}.md`;
      }
      return result;
    },
  }
};

module.exports = util;
