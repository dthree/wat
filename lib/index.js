'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const Vantage = require('vantage');
const chalk = require('chalk');
const markterm = require('./markterm');
const highlighter = require('./highlighter');
const indexer = require('./indexer');
const util = require('./util');

var vantage = new Vantage();


markterm.setOptions({
  gfm: true,
  sanitize: true,
  highlight: function(code, lang) {
    let results = code;
    try {
      results = highlighter(code, lang, {});
      results = tab(results, 2, ' ');
      results = tab(results, 1, '|');
    } catch(e) {
      console.log(e.stack);
    }
    return results;
  }  
});


/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

module.exports = function(vantage) {


};

function pad(data, amt, char) {
  let str = data;
  for (var i = 0; i < amt; ++i) {
    str = str + char;
  }
  return str;
}

function tab(data, amt, char) {
  amt = amt || 2;
  char = char || ' ';
  var parts = String(data).split('\n');
  for (var i = 0; i < parts.length; ++i) {
    parts[i] = pad('', amt, char) + parts[i];
  }
  return parts.join('\n');
}

function shave(data) {
  var parts = String(data).split('\n');
  var shaveStart = function() {
    if (String(parts[0]).trim() === '') {
      parts.shift();
      return shaveStart();
    }
  }
  var shaveEnd = function() {
    if (String(parts[parts.length-1]).trim() === '') {
      parts.pop();
      return shaveEnd();
    }
  }
  shaveStart();
  shaveEnd();
  return parts.join('\n');
}

function formatMarkdown(data) {
  data = markterm(data, {});
  data = highlighter(data, 'markdown', {});
  data = tab(data, 2);
  data = shave(data);
  return `\n${data}\n`;
}


vantage
  .delimiter('?')
  .removeCommand('vantage')
  .removeCommand('repl')
  .show();

vantage
  .command('index', 'Rebuilds index.')
  .action(function(args, cb){
    indexer.build(function(index){
      console.log(index);
      cb();
    });
  })

vantage
  .catch('[commands...]')
  .option('-d, --detail', 'View detailed markdown on item.')
  .option('-i, --install', 'View installation instructions.')
  .autocompletion(function(text, iteration, cb) {
    const self = this;
    const index = indexer.index();
    const result = util.autocomplete(text, iteration, index, function(word, options){
      return self.match.call(self, word, options);
    });
    cb(void 0, result);
  })
  .action(function(args, cb){
    const self = this;

    args = args || {}
    args.options = args.options || {}

    var path = util.command.buildPath(args.commands.join(' '), args.options, indexer.index());

    if (path.exists === false) {
      if (path.suggestions) {
        self.log(chalk.yellow(`\n  Sorry, there's no cheat sheet for that command. However, you can try these:\n`));
        for (let i = 0; i < path.suggestions.length; ++i) {
          var str = '  ' + String(String(path.path).split('/').join(' ')).trim() + ' ' + path.suggestions[i];
          self.log(str);
        }
        self.log(' ');
      } else {
        self.log(chalk.yellow(`\n  Sorry, there's no command like that.\n`));
      }
      cb();
    } else {

      let fullPath = util.command.buildExtension(path.path, path.index, args.options);
      let noDetail = (args.options.detail && !path.index.___detail);
      let noInstall = (args.options.install && !path.index.___install);

      if (noDetail) {
        self.log(chalk.yellow(`\n  Sorry, there's no detailed write-up for this command. Showing the basic one instead.`));
      } else if (noInstall) {
        self.log(chalk.yellow(`\n  Sorry, there's no installation write-up for this command. Showing the basic one instead.`));
      }

      const base = 'https://raw.githubusercontent.com/vantagejs/uh/master/docs/';
      util.requestMarkdown(base + fullPath, function(err, data) {
        if (err) {
          self.log('Unexpected Error: ' + err);
        } else {
          if (String(data).indexOf('Markdown not found') > -1) {
            let response = chalk.yellow(`\n  Wat couldn't find the Markdown file for this command.\n  This probably means your index needs an update.\n\n`);
            response = response + `  File: ${base + fullPath}\n`;
            self.log(response);
          } else {
            data = formatMarkdown(data);
            self.log(data);
          }
        }
        cb();
      });

    }

  });


var block = ` 
  let foo = "bar";
  // see what I mean?

  for (var i = 0; i < item.length; ++i) {
    console.log('whatever');
  }
`;

//vantage.log(results);
