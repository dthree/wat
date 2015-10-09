'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.autodocs', function () {
  before(function (done) {
    this.timeout(10000);
    app.ready(done);
  });

  it('should run "fetch mdast"', function (done) {
    app.stdout();
    this.timeout(20000);
    app.vorpal.exec('fetch mdast', function (err, data) {
      var std = app.stdout();
      done();
    })
  });

  it('should run "delete mdast"', function (done) {
    app.stdout();
    this.timeout(20000);
    app.vorpal.exec('delete mdast', function (err, data) {
      var std = app.stdout();
      done();
    })
  });
  
  it('should run "delete all"', function (done) {
    app.stdout();
    this.timeout(20000);
    app.vorpal.exec('delete all', function (err, data) {
      var std = app.stdout();
      done();
    })
  });

});
