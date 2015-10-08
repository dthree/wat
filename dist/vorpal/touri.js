'use strict';

var chalk = require('chalk');
var wrap = require('wrap-ansi');
var strip = require('strip-ansi');
var os = require('os');

var windows = os.platform() === 'win32';
var tl = windows ? '-' : '┌';
var tr = windows ? '-' : '┐';
var bl = windows ? '-' : '└';
var br = windows ? '-' : '┘';
var hl = windows ? '-' : '─';

function pad(str, width, delim) {
  delim = delim || ' ';
  var len = strip(str).length;
  for (var i = len; i < width; ++i) {
    str += delim;
  }
  return str;
}

function Step(number) {
  this._step = number;
  this._cb;
  this._fn;
  this._listener;
  this._noevent;
  this._events = {
    "nothing": "nothing",
    "submit": "client_prompt_submit",
    "keypress": "keypress",
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
    this._begin.call(this.tour.vorpal);
  } else if (typeof this._begin === 'string') {
    this.log(this._begin);
  }
  if (this._noevent === true) {
    this._listener.fn();
  } else {
    this.tour.vorpal.on(this._listener.event, this._listener.fn);
  }
};

Step.prototype.reject = function (str) {
  this._reject = str;
  return this;
};

Step.prototype.expect = function (evt, _fn) {
  var self = this;
  var event = this._events[evt] || evt;
  if (evt === "nothing") {
    this._noevent = true;
  }
  this._listener = {
    event: event,
    fn: function fn(e) {
      function end() {
        if (typeof self._end === 'function') {
          self._end.call(self.tour.vorpal);
        } else if (typeof self._end === 'string') {
          self.log(self._end);
        }
        if (self._cb) {
          self._cb();
        }
      }

      _fn.call(self.tour.vorpal, e, function (valid) {
        if (valid) {
          self.tour.vorpal.removeListener(self._listener.event, self._listener.fn);
          if (self._wait) {
            setTimeout(end, self._wait);
          } else {
            end();
          }
        } else {
          if (self._reject) {
            self.log(self._reject, { error: true });
          }
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

Step.prototype.wait = function (amt) {
  if (isNaN(amt)) {
    throw new Error('An invalid value was passed into vorpal-tour\'s step.wait() method. Expecting an integer of millis.');
  }
  this._wait = amt;
  return this;
};

Step.prototype.log = function (str, options) {
  options = options || {};
  var leftWidth = String('1').length + 4;
  var mainWidth = process.stdout.columns - leftWidth - 6;
  var wrapped = str.split('\n').map(function (s) {
    return wrap(s, mainWidth).split('\n').map(function (sub) {
      return pad(sub, mainWidth, ' ');
    }).join('\n');
  }).join('\n');

  var color = options.error ? 'yellow' : 'white';

  var top = chalk[color]('' + pad('', 2) + tl + pad('', mainWidth + 4, hl) + tr);
  var bottom = chalk[color]('' + pad('', 2) + bl + pad('', mainWidth + 4, hl) + br);

  wrapped = wrapped.split('\n').map(function (line) {
    return '  ' + chalk[color]('|') + '  ' + line + '  ' + chalk[color]('|');
  }).join('\n');

  wrapped = chalk[this.tour._color || 'reset']('\n' + wrapped + '\n');
  wrapped = '\n' + top + wrapped + bottom + '\n';
  this.tour.vorpal.log(wrapped);
  return this;
};

function Tour(vorpal) {
  this._step = 0;
  this._steps = [];
  this.vorpal = vorpal;
}

Tour.prototype.color = function (clr) {
  if (!chalk[clr]) {
    throw new Error('An invalid Chalk color was passed into `tour.color`.');
  }
  this._color = clr;
};

Tour.prototype.start = function () {
  var self = this;
  this._prepare = this._prepare || function (cb) {
    cb();
  };
  this._prepare(function () {
    self.next();
  });
  return this;
};

Tour.prototype.prepare = function (fn) {
  this._prepare = fn;
  return this;
};

Tour.prototype.step = function () {
  var step = new Step(this._steps.length + 1);
  step.tour = this;
  this._steps.push(step);
  return step;
};

Tour.prototype.wait = function (amt) {
  if (isNaN(amt)) {
    throw new Error('An invalid value was passed into vorpal-tour\'s tour.wait() method. Expecting an integer of millis.');
  }
  this.step().wait(amt).expect("nothing", function (data, cb) {
    cb(true);
  });
};

Tour.prototype.next = function () {
  var self = this;
  var step = this._steps[this._step];
  if (step) {
    step.exec(function () {
      self._step++;
      self.next();
    });
  }
};

Tour.prototype.end = function (msg) {
  var step = this.step();
  if (msg) {
    step.begin(msg);
  }
  step.expect("nothing", function (data, cb) {
    cb(true);
  });
};

module.exports = function (vorpal, options) {
  options = options || {};
  options.command = options.command || 'tour';
  options.description = options.description || 'A tour through the application.';
  options.tour = options.tour || function (tour) {
    return tour;
  };

  vorpal.command(options.command).hidden(options.description).action(function (args, cb) {
    cb();
    var tour = new Tour(vorpal);
    tour = options.tour(tour);
    setTimeout(function () {
      tour.start();
    }, 100);
  });
};