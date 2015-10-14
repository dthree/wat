'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.theme', function () {
  before(function (done) {
    this.timeout(10000);
    app.ready(done);
  });

  it('should run "themes"', function (done) {
    this.timeout(10000);
    app.vorpal.exec('themes', function (err, data) {
      var std = app.stdout();
      std.should.containEql('default');
      std.should.containEql('nocolor');
      std.should.containEql('Available themes:');
      std.should.containEql('(active)');
      done();
    })
  });

  var currentTheme;  

  it('should run "theme nocolor"', function (done) {
    this.timeout(10000);
    app.vorpal.exec('theme nocolor', function (err, data) {
      var std = app.stdout();
      std.should.containEql('Successfully set theme to nocolor.');
      done();
    })
  });

  it('should read "theme" as "nocolor"', function (done) {
    this.timeout(10000);
    app.vorpal.exec('theme', function (err, data) {
      var std = app.stdout();
      std.should.containEql('nocolor');
      done();
    })
  });

  it('should reset the theme to default', function (done) {
    this.timeout(10000);
    app.vorpal.exec('theme ' + currentTheme, function (err, data) {
      var std = app.stdout();
      std.should.containEql(currentTheme);
      done();
    })
  });

  it('should shit on an invalid theme', function (done) {
    this.timeout(10000);
    app.vorpal.exec('theme fitbuzwackomagicianistical', function (err, data) {
      var std = app.stdout();
      std.should.containEql('that\'s not a valid theme');
      std.should.containEql('What about one of these?');
      std.should.containEql('nocolor');
      done();
    })
  });

});
