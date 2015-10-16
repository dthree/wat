'use strict';

var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var wrapAnsi = require('wrap-ansi');
var util = require('../util');

function pickSearchResult(results, opts, cbk) {
  var self = this;
  if (results.length === 0) {
    cbk();
  } else if (results.length === 1 || opts.lucky) {
    cbk(results[0]);
  } else {
    (function () {
      var ctr = 0;
      var choices = results.map(function (itm) {
        var cols = process.stdout.columns - 16;
        var title = String(itm.title).replace(' - Stack Overflow', '').replace(' · GitHub', '').replace(' - GitHub', '');
        var res = chalk.white(ctr + 1 + '. ');
        res += chalk.blue(title);
        var desc = String(itm.description).slice(0, cols).replace(/\n/g, ' ') + '...';
        res += '\n     ' + chalk.grey(desc);
        ctr++;
        return res;
      }).slice(0, 3);
      choices.push(chalk.grey('   Cancel') + '\n ');
      self.prompt({
        type: 'list',
        message: chalk.yellow('Results:'),
        choices: choices,
        name: 'choice'
      }, function (a, b) {
        var pick = stripAnsi(a.choice).replace('\n ', '').split('. ')[0].trim();
        pick = isNaN(pick) ? 'Cancel' : results[parseFloat(pick) - 1] || 'Cancel';
        cbk(pick);
      });
    })();
  }
}

module.exports = function (vorpal, options) {
  var app = options.app;
  var spider = app.spider;

  vorpal.command('stackoverflow [command...]', 'Searches Stack Overflow.').alias('so').alias('stack').option('-l, --lucky', 'Have Wat pick the best result for you.').option('--less', 'Pipe into less. Defaults to true.').parse(function (str) {
    var res = str + ' | less -F';
    if (String(str).indexOf('--no-less') > -1) {
      res = str;
    }
    return res;
  }).action(function (args, cb) {
    var self = this;
    var command = (args.command || []).join(' ');
    var results = '\n';

    function end() {
      if (stripAnsi(results).replace(/\n/g, '').trim() !== '') {
        if (String(results).split('\n').length > 4) {
          results = util.separator(results);
        }
        self.log(results);
      }
      cb();
    }

    function processItem(itm) {
      spider.stackoverflow.getPage(itm, function (err, text) {
        if (err === 'NO_ANSWERS') {
          results += chalk.yellow('  Wat couldn\'t find any matches on Stack Overflow.') + '\n  Try re-wording your command.\n';
        } else if (err) {
          results += 'Error: ' + err;
        } else {
          results += text;
        }
        end();
      });
    }

    spider.google('stackoverflow ' + command, function (err, next, links) {
      if (err) {
        results += '  ' + chalk.yellow('Hmmm.. Wat had trouble searching this command.') + '\n';
        end();
        return;
      }
      var wanted = spider.filterGoogle(links, ['stackoverflow']);
      pickSearchResult.call(self, wanted, args.options, function (item) {
        if (item === 'Cancel') {
          end();
        } else if (item) {
          processItem(item);
        } else {
          results += chalk.yellow('  Wat couldn\'t find any matches on Stack Overflow.') + '\n  Try re-wording your command.\n';
          end();
        }
      });
    });
  });

  vorpal.command('github [command...]', 'Searches Github.').alias('gh', 'readme').option('-l, --lucky', 'Have Wat pick the best result for you.').option('--less', 'Pipe into less. Defaults to true.').parse(function (str) {
    var res = str + ' | less -F';
    if (String(str).indexOf('--no-less') > -1) {
      res = str;
    }
    return res;
  }).action(function (args, cb) {
    var self = this;

    // Get rid of any piped commands.
    if (args.command.indexOf('|') > -1) {
      args.command = args.command.slice(0, args.command.indexOf('|'));
    }

    var command = (args.command || []).join(' ');
    var results = '\n';

    function end() {
      if (stripAnsi(results).replace(/\n/g, '').trim() !== '') {
        if (String(results).split('\n').length > 4) {
          results = util.separator(results);
        }
        self.log(results);
      }
      cb();
    }

    function processItem(itm) {
      spider.github.getPage(itm, function (err, text) {
        if (err === 'Not found.') {
          results += 'Wat couldn\'t find a README in this repo.';
        } else if (err) {
          results += 'Error: ' + err;
        } else {
          results += text;
        }
        end();
      });
    }

    spider.google('github ' + command, function (err, next, links) {
      if (err) {
        results += '  ' + chalk.yellow('Hmmm.. Wat had trouble searching this command.') + '\n';
        end();
        return;
      }
      var wanted = spider.filterGoogle(links, ['github']);
      pickSearchResult.call(self, wanted, args.options, function (item) {
        if (item === 'Cancel') {
          end();
        } else if (item) {
          processItem(item);
        } else {
          results += chalk.yellow('  Wat couldn\'t find any matches on Github.') + '\n  Try re-wording your command.\n';
          end();
        }
      });
    });
  });
};