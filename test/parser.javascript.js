'use strict';

require('assert');
var should = require('should');
var parser = require('../dist/parser.javascript');

var fixtures = [
  'foo.bar',
  'foo#bar:goats',
  'foo#bar():goats',
  '.bar(a, b, c):goats',
  'foo.bar(command, [optionA], [ optionB... ]);',
  'foo.bar(command[, optionA][, optionB]);',
  'foo.bar(command[, optionA[, optionB]]);',
  'bar(a[, b...?]);',
  'foo.bar(a[, b[, c...]]);',
  'foo.bar([a[, b]];',
  'Commander.foo.bar(a?, b, c?[, d:string[, e:goat[, f:blah]]]);'
];

describe.only('parser.javascript', function () {

  after(function (done) {
    done();
  });

  describe('.parseCommandSyntax', function () {

    it('should exist and be a function', function () {
      should.exist(parser.parseCommandSyntax);
      parser.parseCommandSyntax.should.be.type('function');
    });

    it('should parse properties', function () {
      var res = parser.parseCommandSyntax('foo.bar');
      res.should.be.type('object');
      res.type.should.equal('property');
      res.name.should.equal('bar');
      res.parents[0].should.equal('foo');
      res.errors.length.should.equal(0);
    });

    it('should elminate header tags', function () {
      var res = parser.parseCommandSyntax('##foo.bar');
      res.parents[0].should.equal('foo');
    });

    it('should parse methods', function () {
      var res = parser.parseCommandSyntax('.bar()');
      res.type.should.equal('method');
      res.name.should.equal('bar');
      res.isImplicitChild.should.equal(true);
    });

    it('should eliminate semicolons', function () {
      var res = parser.parseCommandSyntax('.bar();');
      res.name.should.equal('bar');
      (res.errors.indexOf('no-trailing-semicolon') > -1).should.equal(true);
    });

    it('should parse parameters', function () {
      var res = parser.parseCommandSyntax('foo.bar(a, e3, ca4f:string);');
      res.params.join(',').should.equal('a,e3,ca4f:string');
    });

    it('should correct missing right-parens', function () {
      var res = parser.parseCommandSyntax('.bar(a, b, c;');
      res.params.join(',').should.equal('a,b,c');
      (res.errors.indexOf('method-missing-right-param') > -1).should.equal(true);
    });

    it('should parse optional parameters', function () {
      var res = parser.parseCommandSyntax('.bar(a[, b[, c]])');
      res.params.join(',').should.equal('a,[b],[c]');
    });

    it('should correctly parse improper optional parameters', function () {
      var res = parser.parseCommandSyntax('foo.bar(command, [optionA], [ optionB... ]);');
      res.params.join(',').should.equal('command,[optionA],[optionB...]');
      (res.errors.indexOf('embed-optional-parameters') > -1).should.equal(true);
    });

    it('should correctly parse another type of improper optional parameters', function () {
      var res = parser.parseCommandSyntax('foo.bar(command[, optionA][, optionB])');
      res.params.join(',').should.equal('command,[optionA],[optionB]');
      (res.errors.indexOf('embed-optional-parameters') > -1).should.equal(true);
    });

    it('should reject optional parameters before required parameters', function () {
      var res = parser.parseCommandSyntax('Commander.foo.bar(a?, b, c?[, d:string[, e:goat[, f:blah]]])');
      res.params.join(',').should.equal('a,b,[c],[d:string],[e:goat],[f:blah]');
      (res.errors.indexOf('no-optional-params-before-required-params') > -1).should.equal(true);
    });

  });

});
