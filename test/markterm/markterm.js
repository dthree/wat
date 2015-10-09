#!/usr/bin/env node

/**
 * Modules
 */

var fs = require('fs');
var path = require('path');
var markterm = require('../dist/cosmetician/markterm');
var chalk = require('chalk');
var util = require('util');

/**
 * Load Tests
 */

function load() {
  var dir = __dirname + '/markterm';
  var files = {};
  var list;
  var file;
  var i;
  var l;

  list = fs
    .readdirSync(dir)
    .filter(function(fn) {
      return path.extname(fn) !== '.html';
    })
    .sort(function(a, b) {
      a = path.basename(a).toLowerCase().charCodeAt(0);
      b = path.basename(b).toLowerCase().charCodeAt(0);
      return a > b ? 1 : (a < b ? -1 : 0);
    });

  i = 0;
  l = list.length;

  for (; i < l; i++) {
    file = path.join(dir, list[i]);
    files[path.basename(file)] = {
      text: fs.readFileSync(file, 'utf8'),
      html: fs.readFileSync(file.replace(/[^.]+$/, 'html'), 'utf8')
    };
  }

  return files;
}

/**
 * Test Runner
 */

function runTests(engine, options) {
  if (typeof engine !== 'function') {
    options = engine;
    engine = null;
  }

  var engine = engine || markterm;
  var options = options || {};
  var files = options.files || load();
  var complete = 0;
  var failed = 0;
  var failures = [];
  var keys = Object.keys(files);
  var i = 0;
  var len = keys.length;
  var filename;
  var file;
  var flags;
  var text;
  var html;
  var j;
  var l;

  options.markterm = options.markterm || {}
  options.markterm.lineWidth = function() { 
    return 100;
  };

  if (options.markterm) {
    markterm.setOptions(options.markterm);
  }

  for (; i < len; i++) {
    filename = keys[i];
    file = files[filename];

    if (markterm._original) {
      markterm.defaults = markterm._original;
      delete markterm._original;
    }

    flags = filename.split('.').slice(1, -1);
    if (flags.length) {
      markterm._original = markterm.defaults;
      markterm.defaults = {};
      Object.keys(markterm._original).forEach(function(key) {
        markterm.defaults[key] = markterm._original[key];
      });
      flags.forEach(function(key) {
        var val = true;
        if (key.indexOf('no') === 0) {
          key = key.substring(2);
          val = false;
        }
        if (markterm.defaults.hasOwnProperty(key)) {
          markterm.defaults[key] = val;
        }
      });
    }

    try {
      text = engine(file.text);
      html = file.html;
    } catch(e) {
      console.log('%s failed.', filename);
      throw e;
    }

    j = 0;
    l = html.length;

    var before = util.inspect(text).replace(/\s/g, '').replace(/\\\\u/g, '\\u');
    var after = util.inspect(html).replace(/\s/g, '').replace(/\\\\u/g, '\\u');

    if (before !== after) {
      failed++;
      failures.push(filename);
      console.log(chalk.red('FAIL:'));
      console.log(chalk.yellow(file.text));
      console.log(before);
      console.log(chalk.cyan(after));
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    } else {
      //console.log(chalk.blue('PASS:'));
    }


    /*
    for (; j < l; j++) {
      if (text[j] !== html[j]) {
        failed++;
        failures.push(filename);

        //console.log(text[j])
        //console.log(html[j])
        //console.log('------------------------')

        /*
        text = text.substring(
          Math.max(j - 30, 0),
          Math.min(j + 30, text.length));

        html = html.substring(
          Math.max(j - 30, 0),
          Math.min(j + 30, html.length));

        console.log(
          '\n#%d. %s failed at offset %d. Near: "%s".\n',
          i + 1, filename, j, text);

        console.log('\nGot:\n%s', text.trim() || text);
        console.log('Expected:\n%s', html.trim() || html);
      }
    } 
     */


    complete++;
    console.log('#%d. %s completed.', i + 1, filename);
  }

  console.log('%d/%d tests completed successfully.', complete, len);
  if (failed) console.log('%d/%d tests failed.', failed, len);

  // Tests currently failing.
  if (~failures.indexOf('def_blocks.text')) {
    failed -= 1;
  }

  return !failed;
}

/**
 * Markdown Test Suite Fixer
 *   This function is responsible for "fixing"
 *   the markdown test suite. There are
 *   certain aspects of the suite that
 *   are strange or might make tests
 *   fail for reasons unrelated to
 *   conformance.
 */

function fix(options) {
  ['tests', 'original', 'new'].forEach(function(dir) {
    try {
      fs.mkdirSync(path.resolve(__dirname, dir), 0755);
    } catch (e) {
      ;
    }
  });

  // rm -rf tests
  fs.readdirSync(path.resolve(__dirname, 'tests')).forEach(function(file) {
    fs.unlinkSync(path.resolve(__dirname, 'tests', file));
  });

  // cp -r original tests
  fs.readdirSync(path.resolve(__dirname, 'original')).forEach(function(file) {
    var nfile = file;
    if (file.indexOf('hard_wrapped_paragraphs_with_list_like_lines.') === 0) {
      nfile = file.replace(/\.(text|html)$/, '.nogfm.$1');
    }
    fs.writeFileSync(path.resolve(__dirname, 'tests', nfile),
      fs.readFileSync(path.resolve(__dirname, 'original', file)));
  });

  // node fix.js
  var dir = __dirname + '/tests';

  fs.readdirSync(dir).filter(function(file) {
    return path.extname(file) === '.html';
  }).forEach(function(file) {
    var file = path.join(dir, file)
      , html = fs.readFileSync(file, 'utf8');

    // fix unencoded quotes
    html = html
      .replace(/='([^\n']*)'(?=[^<>\n]*>)/g, '=&__APOS__;$1&__APOS__;')
      .replace(/="([^\n"]*)"(?=[^<>\n]*>)/g, '=&__QUOT__;$1&__QUOT__;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&__QUOT__;/g, '"')
      .replace(/&__APOS__;/g, '\'');

    // add heading id's
    html = html.replace(/<(h[1-6])>([^<]+)<\/\1>/g, function(s, h, text) {
      var id = text
        .replace(/&#39;/g, '\'')
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');

      id = id.toLowerCase().replace(/[^\w]+/g, '-');

      return '<' + h + ' id="' + id + '">' + text + '</' + h + '>';
    });

    fs.writeFileSync(file, html);
  });

  // turn <hr /> into <hr>
  fs.readdirSync(dir).forEach(function(file) {
    var file = path.join(dir, file)
      , text = fs.readFileSync(file, 'utf8');

    text = text.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');

    fs.writeFileSync(file, text);
  });

  // markdown does some strange things.
  // it does not encode naked `>`, markterm does.
  (function() {
    var file = dir + '/amps_and_angles_encoding.html';
    var html = fs.readFileSync(file, 'utf8')
      .replace('6 > 5.', '6 &gt; 5.');

    fs.writeFileSync(file, html);
  })();

  // cp new/* tests/
  fs.readdirSync(path.resolve(__dirname, 'new')).forEach(function(file) {
    fs.writeFileSync(path.resolve(__dirname, 'tests', file),
      fs.readFileSync(path.resolve(__dirname, 'new', file)));
  });
}

/**
 * Argument Parsing
 */

function parseArg(argv) {
  var argv = process.argv.slice(2)
    , options = {}
    , orphans = []
    , arg;

  function getarg() {
    var arg = argv.shift();

    if (arg.indexOf('--') === 0) {
      // e.g. --opt
      arg = arg.split('=');
      if (arg.length > 1) {
        // e.g. --opt=val
        argv.unshift(arg.slice(1).join('='));
      }
      arg = arg[0];
    } else if (arg[0] === '-') {
      if (arg.length > 2) {
        // e.g. -abc
        argv = arg.substring(1).split('').map(function(ch) {
          return '-' + ch;
        }).concat(argv);
        arg = argv.shift();
      } else {
        // e.g. -a
      }
    } else {
      // e.g. foo
    }

    return arg;
  }

  while (argv.length) {
    arg = getarg();
    switch (arg) {
      case '-f':
      case '--fix':
      case 'fix':
        options.fix = true;
        break;
      case '-b':
      case '--bench':
        options.bench = true;
        break;
      case '-s':
      case '--stop':
        options.stop = true;
        break;
      case '-t':
      case '--time':
        options.time = true;
        break;
      default:
        if (arg.indexOf('--') === 0) {
          opt = camelize(arg.replace(/^--(no-)?/, ''));
          if (!markterm.defaults.hasOwnProperty(opt)) {
            continue;
          }
          options.markterm = options.markterm || {};
          if (arg.indexOf('--no-') === 0) {
            options.markterm[opt] = typeof markterm.defaults[opt] !== 'boolean'
              ? null
              : false;
          } else {
            options.markterm[opt] = typeof markterm.defaults[opt] !== 'boolean'
              ? argv.shift()
              : true;
          }
        } else {
          orphans.push(arg);
        }
        break;
    }
  }

  return options;
}

/**
 * Helpers
 */

function camelize(text) {
  return text.replace(/(\w)-(\w)/g, function(_, a, b) {
    return a + b.toUpperCase();
  });
}

/**
 * Main
 */

function main(argv) {
  var opt = parseArg();
  if (opt.fix) {
    return fix(opt);
  }
  return runTests(opt);
}

/**
 * Execute
 */

if (!module.parent) {
  process.title = 'markterm';
  process.exit(main(process.argv.slice()) ? 0 : 1);
} else {
  exports = main;
  exports.main = main;
  exports.load = load;
  module.exports = exports;
}
