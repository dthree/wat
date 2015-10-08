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

app.isReady = false;

app.ready = function(done) {
  if (!app.isReady) {
    app.clerk.indexer.update({force: true, static: false}, function (err) {
      app.isReady = true;
      console.log('Test: Autodocs built.');
      done();
    });
  } else {
    done();
  }
}

app.stdout = function () {
  var out = _stdout;
  _stdout = '';
  return out;
}

module.exports = app;