'use strict';

require('assert');
var should = require('should');
var parser = require('../dist/autodocs/parser/markdown/parser.javascript');

describe('autodocs.javascript', function () {

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

    it('should handle <variable> methods', function () {
      var res = parser.parseCommandSyntax('chalk.<style>[.<style>...](string, [string...])');
      res.name.should.equal('<style>');
      res.parents[0].should.equal('chalk');
      res.parents.length.should.equal(1);
      res.params.length.should.equal(2);
      res.params[0].should.equal('string');
      res.params[1].should.equal('[string...]');
    });

  });

  describe('.stringifyCommandSyntax', function () {

    it('should exist and be a function', function () {
      should.exist(parser.stringifyCommandSyntax);
      parser.stringifyCommandSyntax.should.be.type('function');
    });

    it('should properly stringify properties', function () {
      var node = parser.parseCommandSyntax('foo.bar');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar');
    });

    it('should eliminate header tags', function () {
      var node = parser.parseCommandSyntax('##foo.bar');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar');
    });

    it('should handle methods', function () {
      var node = parser.parseCommandSyntax('.bar()');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar()');
    });

    it('should eliminate semicolons', function () {
      var node = parser.parseCommandSyntax('.bar();');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar()');
    });

    it('should handle parameters', function () {
      var node = parser.parseCommandSyntax('foo.bar(a, e3, ca4f:string);');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(a, e3, ca4f:string)');
    });

    it('should correct missing right-parens', function () {
      var node = parser.parseCommandSyntax('.bar(a, b, c;');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(a, b, c)');
    });

    it('should draw optional parameters', function () {
      var node = parser.parseCommandSyntax('.bar(a[, b[, c]])');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(a[, b[, c]])');
    });

    it('should correct improper optional parameters', function () {
      var node = parser.parseCommandSyntax('foo.bar(command, [optionA], [ optionB... ]);');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(command[, optionA[, optionB...]])');
    });

    it('should correct another type of improper optional parameters', function () {
      var node = parser.parseCommandSyntax('foo.bar(command[, optionA][, optionB])');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(command[, optionA[, optionB]])');
    });

    it('should correct optional parameters before required parameters', function () {
      var node = parser.parseCommandSyntax('Commander.foo.bar(a?, b, c?[, d:string[, e:goat[, f:blah]]])');
      var str = parser.stringifyCommandSyntax(node);
      str.should.equal('.bar(a, b[, c[, d:string[, e:goat[, f:blah]]]])');
    });

    it('should erase `new` tag', function () {
      var node = parser.parseCommandSyntax('## new Agent([options])');
      //console.log(node);
    });

  });

  describe('.isCommandSyntax', function () {

    it('should exist and be a function', function () {
      should.exist(parser.isCommandSyntax);
      parser.isCommandSyntax.should.be.type('function');
    });

    it('should determine whether headers are syntax', function () {
      var fixtures = {
        'Install': false,
        'this is a header': false,
        ';I like unicor:ns.great': false,
        'Example: Simple Protocol v1 (and so on)': false,
        '[({,%@623462wgxvl42': false,
        'foo.bar' : true,
        'foo.bar(a, b, c)': true,
        '.foo is bar': false,
        'clearImmediate(immediateObject)': true,
        'ref()': true,
        'new Agent([options])': true,
        '.foo': true,
        'FOO([a], [b]': true
      }
      for (var item in fixtures) {
        var result = parser.isCommandSyntax(item);
        result.should.equal(fixtures[item]);
      }
    });

  });

});

