'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var Vantage = require('vantage');
var moment = require('moment');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));
var indexer = require('./indexer');
var utili = require('./util');
var clerk = require('./clerk');

var vantage = new Vantage();

clerk.start();

// Goodbye in one of 12 languages on sigint.
vantage.sigint(function () {
  var goodbye = ['Adios', 'Goodbye', 'Au Revoir', 'Ciao', 'Pa', 'Ade', 'Dag', 'Farvel', 'Poka', 'Ćao', 'Shalom', 'Aloha'];
  var address = goodbye[Math.floor(Math.random() * goodbye.length)];
  vantage.log(chalk.cyan(address + '!'));
  vantage.ui.pause();
  process.exit(0);
});

vantage.delimiter('?').hideCommand('help').removeCommand('use').removeCommand('vantage').removeCommand('repl').show();

vantage.command('index', 'Rebuilds index.').action(function (args, cb) {
  clerk.index.build(function (index) {
    cb();
  });
});

vantage.command('compare', 'Compare\'s index doc dates to existing dates in local docs.').action(function (args, cb) {
  clerk.compareDocs();
  cb();
});

vantage.command('update', 'Forces an update of the document index.')
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

vantage.command('show updates', 'Shows what docs are mid being updated.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
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

vantage.command('show hist', 'Shows recent command history.').option('-m, --max', 'Maximum history items to show.').action(function (args, cb) {
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

vantage['catch']('[commands...]').option('-d, --detail', 'View detailed markdown on item.').option('-i, --install', 'View installation instructions.').autocompletion(function (text, iteration, cb) {
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

  var path = utili.command.buildPath(args.commands.join(' '), args.options, clerk.index.index());

  if (path.exists === false) {
    if (path.suggestions) {
      self.log(chalk.yellow('\n  Sorry, there\'s no cheat sheet for that command. However, you can try these:\n'));
      for (var i = 0; i < path.suggestions.length; ++i) {
        var str = '  ' + String(String(path.path).split('/').join(' ')).trim() + ' ' + path.suggestions[i];
        self.log(str);
      }
      self.log(' ');
    } else {
      self.log(chalk.yellow('\n  Sorry, there\'s no command like that.\n'));
    }
    cb();
  } else {

    var fullPath = utili.command.buildExtension(path.path, path.index, args.options);
    var noDetail = args.options.detail && !path.index.__detail;
    var noInstall = args.options.install && !path.index.__install;

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
  vantage.exec(args.commands.join(' '), args);
}

//console.log(args);