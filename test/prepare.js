'use strict';

require('assert');
var app = require('../');

app.init({
  updateRemotely: false
});

var _stdout = '';

app.vorpal.pipe(function(str) {
  _stdout += str;
  return '';
});

app.stdout = function () {
  var out = _stdout;
  _stdout = '';
  return out;
}

console.log('Prepared');

module.exports = app;