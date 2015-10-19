'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const lev = require('leven');
const fs = require('fs');
const mkdirp = require('mkdirp');
const chalk = require('chalk');
const strip = require('strip-ansi');
const path = require('path');
const os = require('os');

const app = require('../');

let request = require('request');


const util = {

  /**
  * Handles tabbed auto-completion based on
  * the doc index. Works perfectly. Looks ugly
  * as hell. Hey: It works.
  *
  * @param {String} text
  * @param {Integer} iteration
  * @param {Object} index
  * @return {Array} [mode, data]
  * @api public
  */

  autocomplete(text, iteration, index, matchFn) {
    const commands = util.command.prepare(text, {}, index);
    const lastWord = String(commands[commands.length - 1]).trim();
    const otherWords = commands.slice(0, commands.length - 1);
    const words = String(text).trim().split(' ').length;
    const poss = [];

    // Find the deepest point on the index that
    // matches the given commands. i.e. 
    // "earth usa cali" against
    // { "earth": { "usa": { "cali": { "foo": "bar" } }}}
    // would return { "foo": "bar" }
    let levels = 0;
    const possibleObjects = util.matchAgainstIndex(_.clone(commands), index, function () {
      levels++;
    });

    const formatted = this.formatAutocomplete(possibleObjects);
    const possibilities = Object.keys(possibleObjects);
    const match = matchFn(String(lastWord).trim(), possibilities);

    let mode = 'default';
    let response;

    if (match && levels !== otherWords.length + 1) {
      const space = (possibilities.indexOf(String(match).trim()) > -1) ? ' ' : '';
      response = `${String(`${otherWords.join(` `)} ${match}`).trim()}${space}`;
    } else {
      const space = (levels === otherWords.length + 1) ? ' ' : '';
      const original = `${String(commands.join(' ')).trim()}${space}`;
      if (iteration > 1 && possibilities.length > 1) {
        response = [formatted];
      } else if (iteration > 1 && possibilities.length === 1 && (otherWords.length !== levels)) {
        response = `${String(`${original}${possibilities[0]}`).trim()} `;
      } else {
        if (levels === 1 && words === 1 && Object.keys(possibleObjects).length === 0 && iteration > 1) {
          // In this scenario, the user has chosen an autodoc 
          // lib that hasn't been downloaded yet, and has tabbed.
          // We tell the user what he can do.
          if (iteration < 3) {
            const times = chalk.cyan(`1 more time`);
            mode = 'pre-build';
            response = chalk.blue(`\n  This library has not been built. \n  To build, press ${chalk.cyan(`[tab]`)} ${times}, or press ${chalk.cyan(`[enter]`)}.`);
          } else if (iteration === 3) {
            mode = 'build';
            response = original;
          } else {
            response = original
          }
        } else {
          response = original;
        }
      }
    }

    return ({
      mode: mode,
      response: response
    });
  },

  /**
  * Takes an array of index items to be displayed
  * under tabbed autocompletion. Gathers their '__class'
  * from the index ('method', 'property', 'doc', etc.)
  * and separates them into groups based on this.
  * If worthwhile, draws and color-separates classes
  * into fancy columns so the data is really, really
  * easy to digest.
  *
  * @param {Array} possibilities
  * @return {String}
  * @api public
  */

  formatAutocomplete(possibilities) {
    const self = this;
    const cats = ['method', 'property', 'object', 'doc', 'lib', 'unbuilt-lib'];
    const data = {};
    
    let all = Object.keys(possibilities) || [];

    function filter(objs, type) {
      let results = {};
      for (const item in objs) {
        if (objs[item].__class === type) {
          results[item] = objs[item];
        }
      }
      if (type === 'doc') {
        // Get fancy by reading the __seq
        // property of the docs in the index,
        // and then sort them by that.
        let res = [];
        for (const item in results) {
          res.push([item, results[item].__seq]);
        }
        res = res.sort(function (a, b) { 
          return a[1] - b[1];
        }).map(function(itm) {
          return itm[0];
        });
        return res;
      } else {
        return Object.keys(results);
      }
    }
    
    // If the object has children, add a slash.
    let newPoss = {}
    for (const item in possibilities) {
      let keys = Object.keys(possibilities[item]);
      keys = keys.filter(function(key){
        return String(key).slice(0, 2) !== '__';
      });
      if (keys.length > 0) {
        newPoss[`${item}/`] = _.clone(possibilities[item]);
      } else {
        newPoss[item] = possibilities[item];
      }
    }

    // Build an array of each class ('method', 'doc', etc.),
    // filed under the `data` object.
    let matches = [];
    for (let i = 0; i < cats.length; ++i) {
      data[cats[i]] = filter(newPoss, cats[i]);
      matches = matches.concat(data[cats[i]]);
    }

    // Data.remainer takes care of any items that don't
    // have a `__class` attribute in the index.
    data.remainder = all.filter(function(item){
      return (matches.indexOf(item) > -1 || matches.indexOf(item + '/') > -1) ? false : true;
    });

    // All has been made inconsistent due to adding in '/'es
    // to the others. Reset it.
    all = [];
    for (let i = 0; i < cats.length; ++i) {
      all = all.concat(data[cats[i]]);
    }

    let totalWidth = all.join('  ').length + 4;

    // Get the widest item of them all 
    // (mirror, mirror on the wall).
    let maxWidth = 0;
    all.forEach(function(item){
      let width = String(item).length;
      maxWidth = (width > maxWidth) ? width : maxWidth;
    });
    maxWidth = maxWidth + 3;

    // The headers aren't measured for width, and
    // so if the thinnest property is less than the 
    // "Properties" header, it's goinna look ugly.
    maxWidth = (maxWidth < 12) ? 12 : maxWidth;

    // Determine how many display columns get allocated
    // per data class ('method', 'property', etc.),
    // based on how many children each data class has.
    let numColumns = Math.floor((process.stdout.columns - 2) / maxWidth);
    let dataColumns = {}
    let totalAllocated = 0;
    let maxItem;
    let max = 0;
    for (const item in data) {
      if (data[item].length > 0) {
        dataColumns[item] = Math.floor((data[item].length / all.length) * numColumns) || 1;
        totalAllocated += dataColumns[item];
        max = (dataColumns[item] > max) ? dataColumns[item] : max;
        maxItem = (dataColumns[item] === max) ? item : maxItem;
      }
    }

    // Do correction on the above figures to ensure we don't
    // top over the max column amount.
    let columnOverflow = totalAllocated - numColumns;
    if (columnOverflow > 0) {
      dataColumns[maxItem] = dataColumns[maxItem] - columnOverflow;
    }

    let types = Object.keys(dataColumns);
    let onlyDocs = (types.length === 1 && types[0] === 'doc');

    // Methods and Properties go alphabetical. 
    // Docs go in exact sequences.
    data.method.sort();
    data.property.sort();

    // Colors by class.
    const colors = {
      'method': 'green',
      'property': 'blue',
      'object': 'yellow',
      'doc': 'white',
      'lib': 'white',
      'unbuilt-lib': 'gray',
      'remainder': 'gray'
    };

    // Fancy names by class.
    const names = {
      'method': 'Methods',
      'property': 'Properties',
      'object': 'Objects',
      'doc': 'Docs',
      'lib': 'Libraries',
      'unbuilt-lib': 'Downloadable Libraries',
      'remainder': 'Other'
    };

    // Final formatting section.
    let fnl = '';

    // If we are only documents, do one straight
    // line. If we otherwise fit on one line, roll 
    // with that. Otherwise, do fancy columns.
    if (onlyDocs) {
      let docs = data['doc'];
      const max = process.stdout.rows - 5;
      const total = docs.length;
      docs = docs.slice(0, max);
      if (docs.length > 0 ) {
        const clr = colors['doc'];
        let set = '\n  ' + docs.join('\n  ') + '\n';
        set = (clr) ? chalk[clr](set) : set;
        fnl += set;
      }
      if (total !== docs.length) {
        fnl += chalk.grey('  ' + (total - docs.length) + ' more...\n');
      }
    } else if (totalWidth <= process.stdout.columns) {
      for (const item in data) {
        let arr = data[item];
        if (arr.length > 0 ) {
          let clr = colors[item];
          let set = arr.join('  ') + '  ';
          set = (clr) ? chalk[clr](set) : set;
          fnl += set;
        }
      }
      fnl = String(fnl).trim();
      fnl = `\n  ${String(fnl).trim()}\n`;
    } else {

      // This takes a class, such as `method`,
      // and draws x number of columns for that
      // item based on the allocated number of 
      // column (`dataColumns[class]`). Returns
      // a \n-broken chunk of text.
      function drawClassBlock(item) {
        let ctr = 1;
        let arr = data[item];
        let columns = dataColumns[item];
        let width = maxWidth - 2;
        let color = colors[item];
        let fullWidth = ((width + 2) * columns);
        let lines = '';
        let line = '';
        let longestLine = 0;
        function endLine() {
          let lineWidth = strip(line).length;
          longestLine = (lineWidth > longestLine) ? lineWidth : longestLine;
          lines += line + '\n';
          line = '';
          ctr = 1;
        }
        for (let i = 0; i < arr.length; ++i) {
          let item = self.pad(arr[i], width) + '  ';
          item = (color) ? chalk[color](item) : item;
          line += item;
          if (ctr >= columns) {
            endLine();
          } else {
            ctr++;
          }
        }
        if (line !== '') {
          endLine();
        }
        lines = lines.split('\n').map(function(ln){
          return self.pad(ln, longestLine);
        }).join('\n');
        let title = self.pad(names[item], longestLine);
        let divider = chalk.gray(self.pad('', longestLine - 2, '-') + '  ');
        lines = chalk.white(chalk.bold(title)) + '\n' + divider + '\n' + lines;
        return lines;
      }

      // Throw all blocks into an array, and
      // note how many rows down the longest block
      // goes.
      let combined = [];
      let longest = 0;
      for (const item in dataColumns) {
        let lines = drawClassBlock(item).split('\n');
        longest = (lines.length > longest) ? lines.length : longest;
        combined.push(lines);
      }

      let maxHeight = process.stdout.rows - 4;
      maxHeight = (maxHeight > 24) ? 24 : maxHeight; 

      // Match pad all other blocks with white-space 
      // lines at the bottom to match the length of 
      // the longest block. In other words, make the
      // blocks... blocks.
      combined = combined.map(function(lines){
        const lineLength = strip(lines[0]).length;
        for (let i = lines.length; i < longest; ++i) {
          lines.push(self.pad('', lineLength));
        }
        
        let numRealLines = lines.filter(function(line){
          return (strip(line).trim() !== '');
        }).length;

        // If we've exceeded the max height and have
        // content, do a fancy `...` and cut the rest
        // of the content.
        if (numRealLines > maxHeight && String(lines[maxHeight - 1]).trim() !== '') {
          let ellip = (numRealLines - maxHeight) + ' more ...';
          ellip = chalk.gray((ellip.length > lineLength) ? '...' : ellip);
          lines = lines.slice(0, maxHeight - 1);
          lines.push(self.pad(ellip, lineLength));
        }
        return lines;
      });

      longest = (maxHeight < longest) ? maxHeight + 1 : longest;

      // Now play Tetris. Join the blocks.
      for (let i = 0; i < longest; ++i) {
        for (let j = 0; j < combined.length; ++j) {
          if (combined[j][i]) {
            fnl += combined[j][i];
          }
        }
        fnl += '\n';
      }

      // Interject a two-space pad to the left of
      // the blocks, and do some cleanup at the end.
      fnl = fnl.split('\n').map(function(ln){
        return '  ' + ln;
      }).join('\n').replace(/ +$/, '').replace(/\n$/g, '') + '';

    }

    return fnl;
  }, 

  autocompletionHelper(root, array, text, iteration) {
    const txt = String(text).trim();
    let arr = array.filter(function (itm) {
      return (itm.slice(0, txt.length) === txt);
    });
    arr.unshift('\n');
    arr.push('\n');
    var match = this.match(txt, array);
    if (iteration > 1) {
      return arr;
    } else {
      if (match) {
        return 'theme ' + match;
      } else {
        return undefined;
      }
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

  matchAgainstIndex(arr, idx, each) {
    each = each || function () {};
    const word = arr.shift();
    let result;
    if (idx[word]) {
      each(arr, idx[word]);
      result = util.matchAgainstIndex(arr, idx[word], each);
    } else {
      const items = {};
      for (const item in idx) {
        if (idx.hasOwnProperty(item) && String(item).slice(0, 2) !== '__' && String(item) !== 'index') {
          const match = (String(word || '').toLowerCase() === String(item).slice(0, String(word || '').length).toLowerCase());
          if (match) {
            items[item] = idx[item];
          }
        }
      }
      result = items;
    }
    return result;
  },

  each(nodes, fn, parents) {
    const self = this;
    parents = parents || [];
    for (const node in nodes) {
      fn(node, nodes, parents);
      if (_.isObject(nodes[node])) {
        let parent = _.clone(parents);
        parent.push(node);
        self.each(nodes[node], fn, parent);
      }
    }
  },

  fetchRemote(path, cb) {
    let proxy;
    if (app.clerk.prefs.get('proxy') === 'on') {
      const address = app.clerk.prefs.get('proxy-address');
      const port = app.clerk.prefs.get('proxy-port');
      const user = String(app.clerk.prefs.get('proxy-user') || '').trim();
      const pass = String(app.clerk.prefs.get('proxy-pass') || '').trim();
      if (user === '' || pass === '') {
        proxy = `http://${address}:${port}`;
      } else {
        proxy = `http://${user}:${pass}@${address}:${port}`;
      }
    }
    var r = request.defaults({'proxy':proxy});
    request.get(path, function (err, response, body) {
      if (!err) {
        if (body === 'Not Found') {
          cb('Not Found', undefined);
        } else {
          cb(undefined, body, response);
        }
      } else {
        console.log(err, opts, response, body);
        throw new Error(err);
        cb(err, '');
      }
    });
  },

  pad(str, width, delimiter) {
    width = Math.floor(width);
    delimiter = delimiter || ' ';
    const len = Math.max(0, width - strip(str).length);
    return str + Array(len + 1).join(delimiter);
  },

  separator(str) {
    const windows = os.platform() === 'win32';
    const hl = windows ? '-' : '─';
    if (str.split('\n').length <= process.stdout.rows) {
      const padding = util.pad('', process.stdout.columns, chalk.blue(hl));
      str = `\n${padding}\n${str}`; 
    }
    return str;
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
      let commands = (_.isArray(str))
        ? str
        : String(str).trim().split(' ');
      commands = commands.join(' ')
        .replace(/\//g, ' ')
        .replace(/\\/g, ' ')
        .replace(/ +/g, ' ')
        .split(' ');
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
        let sugg = util.autocomplete(str, 2, index, function (word, options) {
          return options;
        }).response;
        if (_.isArray(sugg)) {
          response.suggestions = sugg;
        } else {
          response.suggestions = ['', sugg];
          //response.suggestions = indexObject;
        }
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
        } else if (idx.__class === 'unbuilt-lib') {
          // If we are an unbuilt library, accept it.
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
    }
  },

  path: {

    getDocRoot(pathString) {
      const normalized = path.normalize(pathString);
      const parts = String(normalized).split(`docs${path.sep}`);
      if (parts[1] === undefined) {
        throw new Error(`Invalid path passed into util.getDocRoot: "${pathString}". Parsed path: ${normalized}.`);
      }
      return parts[1];
    },
  }

};

module.exports = util;
