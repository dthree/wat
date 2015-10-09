'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.updater', function () {
  before(function (done) {
    this.timeout(10000);
    app.ready(done);
  });

  it('should run "updates" with no queue', function (done) {
    app.stdout();
    this.timeout(10000);
    app.queuecache = app.clerk.updater.queue;
    app.clerk.updater.queue = [];
    app.vorpal.exec('updates', function (err, data) {
      var std = app.stdout();
      std.should.containEql('To do a fresh update');
      done();
    })
  });

  it('should run "updates" with items in the queue', function (done) {
    app.stdout();
    this.timeout(10000);
    app.clerk.updater.queue.push('/tmp/.wat/.local/docs/js/array/from.md');
    app.clerk.updater.queue.push('/tmp/.wat/.local/docs/js/array/from.detail.md');
    app.vorpal.exec('updates', function (err, data) {
      var std = app.stdout();
      std.should.containEql('js array from');
      app.clerk.updater.queue = [];
      done();
    })
  });

});
