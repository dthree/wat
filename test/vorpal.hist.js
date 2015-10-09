'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.hist', function () {
  before(function (done) {
    this.timeout(10000);
    app.ready(done);
  });

  it('should run', function (done) {
    app.stdout();
    this.timeout(10000);
    app.vorpal.exec('hist', function (err, data) {
      var std = app.stdout();
      std.should.containEql('Date');
      std.should.containEql('Type');
      std.should.containEql('Value');
      done();
    })
  });

});
