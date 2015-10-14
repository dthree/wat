'use strict';

require('assert');
var should = require('should');
var util = require('./../dist/util');
var app = require('./prepare');

var index;

describe('util', function () {
  this.timeout(10000);
  before(function (done) {
    app.autodocs.delete('vorpal', {}, function () {
      index = app.clerk.indexer.index();
      app.stdout();
      app.ready(done);
    });
  });


  it('should exist and be an object', function () {
    should.exist(util);
    util.should.be.type('object');
  });

  describe('util.autocomplete', function () {
    it('should run', function () {
      var result = util.autocomplete('j', 0, index, function (item, opts) {
        return opts || item;
      });
      result.mode.should.equal('default');
    });

    it('should run a pre-build', function () {
      var result = util.autocomplete('vorpal', 2, index, function (item, opts) {
        return opts || item;
      });
      result.mode.should.equal('pre-build');
      result.response.indexOf('This library has not been built.').should.not.equal(-1);
    });

    it('should run a build', function () {
      var result = util.autocomplete('vorpal', 3, index, function (item, opts) {
        return opts || item;
      });
      result.mode.should.equal('build');
      result.response.indexOf('vorpal ').should.not.equal(-1);
    });

    it('should fetch only docs', function (done) {
      this.timeout(10000);
      app.vorpal.exec('fetch vorpal', function (err, data) {
        index = app.clerk.indexer.index();
        var result = util.autocomplete('vorpal api', 2, index, function (item, opts) {
          return opts || item;
        });
        done();
      });
    });
  });

  describe('util.path.getDocRoot', function () {

    it('should error on an invalid path', function () {
      (function () {
        util.path.getDocRoot('cowasd/weagae');
      }).should.throw(Error);
    });

  });

});
