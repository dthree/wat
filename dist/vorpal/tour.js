'use strict';

var chalk = require('chalk');
var wrap = require('wrap-ansi');

module.exports = function (vorpal) {

  function Step(number) {
    this._step = number;
    this._cb;
    this._fn;
    this._listener;
    this._events = {
      "submit": "client_prompt_submit",
      "command": "client_command_executed"
    };
    return this;
  }

  Step.prototype.exec = function (cb) {
    if (typeof cb !== 'function') {
      throw new Error('No callbend was passed into vorpal-tour\'s step.exec() command.');
    }
    this._cb = cb;
    if (typeof this._begin === 'function') {
      this._begin.call(vorpal);
    } else if (typeof this._begin === 'string') {
      this.log(this._begin);
    }
    vorpal.on(this._listener.event, this._listener.fn);
  };

  Step.prototype.expect = function (evt, _fn) {
    var self = this;
    var event = this._events[evt];
    if (event === undefined) {
      throw new Error('Invalid event passed into vorpal-tour\'s .on command.');
      process.exit(1);
    }
    this._l;
    this._listener = {
      event: event,
      fn: function fn(e) {
        _fn.call(vorpal, e, function (valid) {
          if (valid) {
            vorpal.removeListener(self._listener.event, self._listener.fn);
            if (typeof self._end === 'function') {
              self._end.call(vorpal);
            } else if (typeof self._end === 'string') {
              self.log(self._end);
            }
            if (self._cb) {
              self._cb();
            }
          } else {
            // ...
          }
        });
      }
    };
    return self;
  };

  Step.prototype.begin = function (x) {
    this._begin = x;
    return this;
  };

  Step.prototype.end = function (x) {
    this._end = x;
    return this;
  };

  Step.prototype.log = function (str) {
    str = chalk.blue(str);
    var leftWidth = String(this._step).length + 4;
    var mainWidth = process.stdout.columns - leftWidth - 2;
    var wrapped = wrap(str, mainWidth);
    wrapped = wrapped.split('\n').map(function (line) {
      return '\n  |   ' + line + '\n';
    }).join('\n');
    vorpal.log(wrapped);
    return this;
  };

  var tour = {

    _step: 0,

    _steps: [],

    step: function step() {
      var step = new Step(this._steps.length + 1);
      this._steps.push(step);
      return step;
    },

    next: function next() {
      var self = this;
      var step = this._steps[this._step];
      if (step) {
        step.exec(function () {
          self._step++;
          self.next();
        });
      } else {
        vorpal.log('Tour is done!!!');
      }
    }
  };

  tour.step().begin('Press [enter].').end('Great!').expect("submit", function (data, cb) {
    cb(true);
  });

  tour.step().begin('Now, let\'s enter "foo".').expect("command", function (data, cb) {
    var valid = data.command === 'foo';
    if (!valid) {
      this.log('\n  Err.. wrong command.');
    }
    cb(valid);
  });

  vorpal.command('tour').hidden().action(function (args, cb) {

    tour.next();
    cb();
  });
};