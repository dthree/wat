'use strict';

let gulp = require('gulp');
let eslint = require('gulp-eslint');
let clerk = require('./lib/clerk');
let chalk = require('chalk');

gulp.task('lint', function(){
  return gulp.src(['lib/*.js', './*.js', './bin/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('init', function(){
  clerk.start({
    updateRemotely: false
  });
})

gulp.task('buildIndex', function(done) {
  clerk.index.build(function(index){
    clerk.index.write(index);
    console.log(chalk.cyan('\n           Wat: Rebuilt index.\n'));
    done();
  });
});

gulp.task('watch', function() {
  gulp.watch('docs/**/*.md', ['buildIndex']);
});

gulp.task('default', ['init', 'watch', 'buildIndex']);

