'use strict';

require('assert');
var should = require('should');
var fs = require('fs');
var app = require('./prepare');

var _stdout = '';

var tab =  { 
  key: 'tab',
  value: '',
  e: { 
    value: '\t',
    key: { 
      sequence: '\t',
      name: 'tab',
      ctrl: false,
      meta: false,
      shift: false 
    }
  }
};

describe('vorpal.catch', function () {
  before(function (done) {
    this.timeout(10000);
    try {
      fs.unlinkSync(app.clerk.paths.temp.docs + 'js/array/slice.md')
    } catch(e) {}
    app.autodocs.delete('vorpal', {}, function () {
      app.autodocs.delete('node', {}, function () {
        app.stdout();
        app.ready(done);
      });
    });
  });

  after(function (done) {
    this.timeout(60000);
    try {
      fs.unlinkSync(app.clerk.paths.temp.docs + 'js/array/slice.md')
    } catch(e) {}
    done();
  });

  it('should reject an incorrect command', function (done) {
    this.timeout(10000);
    app.vorpal.exec('sumgum', function (err, data) {
      (typeof err).should.equal('undefined');
      app.stdout().should.containEql('Sorry, there\'s no command like that.');
      done();
    })
  });

  it('should fetch a remote lib', function (done) {
    this.timeout(10000);
    app.vorpal.exec('js array slice', function (err, data) {
      (typeof err).should.equal('undefined');
      app.stdout().should.containEql('array.slice');
      done();
    })
  });

  it('should have filed the remote lib', function (done) {
    this.timeout(10000);
    app.vorpal.exec('js array slice', function (err, data) {
      (function () { 
        fs.statSync(app.clerk.paths.temp.docs + 'js/array/slice.md');
      }).should.not.throw(Error);
      done();
    })
  });

  it('should fetch the lib locally now', function (done) {
    this.timeout(10000);
    fs.appendFileSync(app.clerk.paths.temp.docs + 'js/array/slice.md', 'catnip', 'utf8');
    app.vorpal.exec('js array slice', function (err, data) {
      (typeof err).should.equal('undefined');
      app.stdout().should.containEql('catnip');
      done();
    })
  });

  it('should shift wat if included', function (done) {
    this.timeout(10000);
    app.vorpal.exec('js array slice', function (err, data) {
      (typeof err).should.equal('undefined');
      app.stdout().should.containEql('catnip');
      done();
    })
  });

  it('build a library that doesn\'t exist', function (done) {
    this.timeout(20000);
    app.vorpal.exec('vorpal', function (err, data) {
      (typeof err).should.equal('undefined');
      done();
    })
  });

  it('build a very large library', function (done) {
    this.timeout(40000);
    app.vorpal.exec('node', function (err, data) {
      (typeof err).should.equal('undefined');
      done();
    })
  });

  it('should pull up autotype suggestions', function (done) {
    app.stdout();
    app.vorpal.ui.refresh();
    app.vorpal.ui.input('');
    app.vorpal.ui.emit('vorpal_ui_keypress', tab);
    app.vorpal.ui.emit('vorpal_ui_keypress', tab);
    app.vorpal.ui.emit('vorpal_ui_keypress', tab);
    setTimeout(function () {
      var out = app.stdout();
      out.should.containEql('Libraries')
      out.should.containEql('Downloadable Libraries')
      done();
    }, 1000);
  });

  /*
  it('should ask when there\'s multiple snippit results', function (done) {
    this.timeout(40000);
    app.stdout();
    app.vorpal.ui.submit('li');
    setTimeout( function() {
      app.vorpal.ui.cancel();
      setTimeout(function () {
        var out = app.stdout();
        done();
      }, 500);
    }, 500);
  });
  */

});
