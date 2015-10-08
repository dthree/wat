'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.indexer', function () {
  before(function (done) {
    done();
  });

  after(function (done) {
    delete app.vorpal;
    app = undefined;
    done();
  });

  it('should run', function (done) {
    app.stdout();
    this.timeout(10000);
    app.vorpal.exec('index', function (err, data) {
      (typeof err).should.equal('undefined');
      let std = app.stdout();
      std.should.containEql('Successfully updated index.');
      done();
    })
  });
});
