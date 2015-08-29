'use strict';

require('assert');
var should = require('should');
var wat = require('../');

describe('wat', function () {
  before(function (done) {
    wat.init();
    done();
  });

  after(function (done) {
    done();
  });

  it('should exist and be a function', function () {
    should.exist(wat);
    wat.should.be.type('object');
  });

  it('should have a clerk', function () {
    should.exist(wat.clerk);
    wat.clerk.should.be.type('object');
  });

  it('should have a cosmetician', function () {
    should.exist(wat.cosmetician);
    wat.cosmetician.should.be.type('object');
  });

  it('should have vorpal', function () {
    should.exist(wat.vorpal);
    wat.vorpal.should.be.type('object');
  });
});
