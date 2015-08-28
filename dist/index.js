'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var Vorpal = require('vorpal');
var moment = require('moment');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));
var indexer = require('./indexer');
var spider = require('./spider');
var utili = require('./util');
var clerk = require('./clerk');
var cosmetician = require('./cosmetician');

var vorpal = new Vorpal();

clerk.start();

// Goodbye in one of 12 languages on sigint.
vorpal.sigint(function () {
  var goodbye = ['Adios', 'Goodbye', 'Au Revoir', 'Ciao', 'Pa', 'Ade', 'Dag', 'Farvel', 'Poka', 'Ćao', 'Shalom', 'Aloha'];
  var address = goodbye[Math.floor(Math.random() * goodbye.length)];
  vorpal.log(chalk.cyan(address + '!'));
  vorpal.ui.pause();
  process.exit(0);
});

var help = vorpal.find('help');
if (help) {
  help.remove();
}

vorpal.delimiter('?').show();

vorpal.command('index', 'Rebuilds index.').action(function (args, cb) {
  clerk.index.build(function (index) {
    cb();
  });
});

vorpal.command('search [command...]', 'Searches for a command.').action(function (args, cb) {
  var command = (args.command || []).join(' ');
  var matches = clerk.search(command);
  this.log(matches);
  cb();
});

vorpal.command('stackoverflow [command...]', 'Searches Stack Overflow.').alias('so').alias('stack').action(function (args, cb) {
  var command = (args.command || []).join(' ');
  var self = this;
  var sites = ['stackoverflow'];
  self.log(' ');

  function process(itm) {
    spider.stackoverflow.getPage(itm, function (err, text) {
      if (err) {
        self.log('Error: ', err);
      } else {
        self.log(text);
      }
      cb();
    });
  }

  spider.google(command, function (err, next, links) {
    var wanted = spider.filterGoogle(links, ['stackoverflow']);
    var item = wanted.shift();
    if (item) {
      process(item);
    } else {
      self.log(chalk.yellow('  Wat couldn\'t find any matches on Stack Overflow.') + '\n  Try re-wording your question.\n');
      cb();
    }
  });
});

vorpal.command('compare', 'Compare\'s index doc dates to existing dates in local docs.').action(function (args, cb) {
  clerk.compareDocs();
  cb();
});

vorpal.command('update', 'Forces an update of the document index.')
//.option('-a, --all', 'Downloads all Wat documents (takes a bit).')
.action(function (args, cb) {
  var self = this;
  if (args.options.all) {
    //clerk.fetchAll();
    cb();
  } else {
    clerk.index.update({ force: true }, function (err, data) {
      if (!err) {
        self.log(chalk.cyan('\n  Successfully updated index.'));
        var amt = clerk.updater.queue.length;
        if (amt > 1) {
          self.log('\n  ' + amt + ' documents are queued for updating.');
        }
        self.log(' ');
        cb();
      }
    });
  }
});

vorpal.command('show updates', 'Shows what docs are mid being updated.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
  var queue = clerk.updater.queue;
  var max = args.options.max || 30;
  var limit = queue.length - 1 - max;
  limit = limit < 0 ? 0 : limit;
  if (queue.length > 0) {
    this.log(chalk.bold('\n  Command'));
  } else {
    this.log(chalk.bold('\n  No updates in the queue.\n  To do a fresh update, run the "' + chalk.cyan('update') + '" command.'));
  }
  for (var i = queue.length - 1; i > limit; i--) {
    var item = String(queue[i]).split('docs/');
    item = item.length > 1 ? item[1] : item[0];
    var cmd = String(item).split('/').join(' ');
    cmd = String(cmd).replace('.md', '');
    cmd = String(cmd).replace('.detail', chalk.gray(' (detailed)'));
    cmd = String(cmd).replace('.install', chalk.gray(' (install)'));
    cmd = String(cmd).replace(' index', chalk.gray(' '));
    this.log('  ' + cmd);
  }
  this.log(' ');
  cb();
});

vorpal.command('show hist', 'Shows recent command history.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
  var types = {
    'command': 'Command',
    'update': 'Update'
  };
  var hist = clerk.history.get();
  var max = args.options.max || 20;
  var limit = hist.length - 1 - max;
  limit = limit < 0 ? 0 : limit;
  this.log(chalk.bold('\n  Date            Type      Value'));
  for (var i = hist.length - 1; i > limit; --i) {
    var date = chalk.gray(utili.pad(moment(hist[i].date || '').format('D MMM h:mma'), 15, ' '));
    var type = utili.pad(types[hist[i].type], 9, ' ');
    var cmd = hist[i].value;
    this.log('  ' + date + ' ' + type + ' ' + cmd);
  }
  this.log(' ');
  cb();
});

vorpal['catch']('[commands...]').option('-d, --detail', 'View detailed markdown on item.').option('-i, --install', 'View installation instructions.').autocompletion(function (text, iteration, cb) {
  var self = this;
  var index = clerk.index.index();
  var result = utili.autocomplete(text, iteration, index, function (word, options) {
    var result = self.match.call(self, word, options);
    return result;
  });
  if (_.isArray(result)) {
    result.sort();
  }
  cb(void 0, result);
}).action(function (args, cb) {

  var self = this;

  args = args || {};
  args.options = args.options || {};

  // Handle humans.
  if (String(args.commands[0]).toLowerCase() === 'wat') {
    args.commands.shift();
  }

  var path = utili.command.buildPath(args.commands.join(' '), args.options, clerk.index.index());

  function execPath(pathObj) {
    var fullPath = utili.command.buildExtension(pathObj.path, pathObj.index, args.options);
    var noDetail = args.options.detail && !pathObj.index.__detail;
    var noInstall = args.options.install && !pathObj.index.__install;

    if (noDetail) {
      self.log(chalk.yellow('\n  Sorry, there\'s no detailed write-up for this command. Showing the basic one instead.'));
    } else if (noInstall) {
      self.log(chalk.yellow('\n  Sorry, there\'s no installation write-up for this command. Showing the basic one instead.'));
    }

    clerk.fetch(fullPath, function (err, data) {
      if (err) {
        self.log('Unexpected Error: ', err);
      } else {
        self.log(data);
      }
      cb();
    });
  }

  if (path.exists === false) {
    if (path.suggestions) {
      self.log(chalk.yellow('\n  Sorry, there\'s no cheat sheet for that command. However, you can try these:\n'));
      for (var i = 0; i < path.suggestions.length; ++i) {
        var str = '  ' + String(String(path.path).split('/').join(' ')).trim() + ' ' + path.suggestions[i];
        self.log(str);
      }
      self.log(' ');
    } else {

      var results = clerk.search(args.commands);

      if (results.length === 1 && results[0].points > 0) {

        self.log(chalk.yellow('\n  Showing results for "' + results[0].command + '":'));
        var _path = utili.command.buildPath(results[0].command, args.options, clerk.index.index());
        execPath(_path);
      } else if (results.length > 0) {

        self.log(chalk.yellow('\n  Did you mean:'));
        for (var i = 0; i < results.length; ++i) {
          if (i > 7) {
            break;
          }
          var cmd = results[i].command;
          cmd = cmd.replace(args.commands, chalk.white(args.commands));
          self.log('  ' + cmd);
        }
        self.log(' ');
      } else {

        self.log(chalk.yellow('\n  Sorry, there\'s no command like that.\n'));
      }
    }
    cb();
  } else {
    execPath(path);
  }
});

var xlt = {
  'd': 'detail',
  'i': 'install'
};

var args = { options: {} };
for (var item in argv) {
  if (item === '_') {
    args.commands = argv[item];
  } else {
    if (xlt[item]) {
      args.options[xlt[item]] = argv[item];
    } else {
      args.options[item] = argv[item];
    }
  }
}

if (process.argv.length > 2) {
  vorpal.exec(args.commands.join(' '), args);
}

//console.log(args);