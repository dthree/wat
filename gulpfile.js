"use strict";

var gulp = require("gulp");
var eslint = require("gulp-eslint");
var clerk = require('./lib/clerk');

gulp.task("lint", function(){
  return gulp.src(["lib/*.js", "./*.js", "./bin/*.js"])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task("buildIndex", function(done) {
  clerk.start();


  return;
  clerk.index.build(function(index){
    clerk.index.write(index);
    //console.log(index);
    done();
  });
});

gulp.task("watch", function() {
  gulp.watch("docs/**/*.*", ["buildIndex"]);
});

gulp.task("default", ["watch", "buildIndex"]);
