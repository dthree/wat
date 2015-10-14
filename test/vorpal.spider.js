'use strict';

require('assert');
var should = require('should');
var app = require('./prepare');
 
describe('vorpal.spider', function () {
  before(function (done) {
    this.timeout(10000);
    done();
  });

  describe('stackoverflow', function () {
    it('should run with a choice', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('so js array slice --no-less', function (err, data) {
          var std = app.stdout();
          std.should.containEql('Stack Overflow');
          std.should.containEql('views');
          std.should.containEql('Answers');
          std.should.containEql('-------');
          done();
      })
      setTimeout(function () {
        app.vorpal.ui._activePrompt.rl.emit('line');
      }, 3000);
    });

    it('should run with -l', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('so js array slice --no-less -l', function (err, data) {
        var std = app.stdout();
        std.should.containEql('Stack Overflow');
        std.should.containEql('views');
        std.should.containEql('Answers');
        std.should.containEql('-------');
        done();
      })
    });

    it('should gracefully handle no matches', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('so asld fjl;j ;ewlij flfjsdl;kfjas;ljfa;lwjkf;aweijfa;lsifjsd;lkfjdkcdd,,d,i32423 --no-less', function (err, data) {
        var std = app.stdout();
        std.should.containEql('find any matches on Stack Overflow.');
        std.should.containEql('Try re-wording your command.');
        done();
      })
    });
  });

  describe('github', function () {
    it('should run with a choice', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('gh dthree --no-less', function (err, data) {
          var std = app.stdout();
          std.should.containEql('-------');
          done();
      })
      setTimeout(function () {
        app.vorpal.ui._activePrompt.rl.emit('line');
      }, 3000);
    });

    it('should run with -l', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('gh dthree wat --no-less -l', function (err, data) {
        var std = app.stdout();
        std.should.containEql('wat tour');
        done();
      })
    });

    it('should gracefully handle no matches', function (done) {
      app.stdout();
      this.timeout(10000);
      app.vorpal.exec('gh asld fjl;j ;ewlij flfjsdl;kfjas;ljfa;lwjkf;aweijfa;lsifjsd;lkfjdkcdd,,d,i32423 --no-less', function (err, data) {
        var std = app.stdout();
        std.should.containEql('find any matches on Github.');
        std.should.containEql('Try re-wording your command.');
        done();
      })
    });
  });
});
