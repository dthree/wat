'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var babel = require('gulp-babel');
var changed = require('gulp-changed');
var chalk = require('chalk');

var clerk;

gulp.task('lint', function(){
  return gulp.src(['lib/*.js', './*.js', './bin/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
    //.pipe(eslint.failOnError());
});

gulp.task('initClerk', function(){
  clerk = require('./dist/clerk');
  clerk.init();
  clerk.start({
    updateRemotely: false
  });
})

gulp.task('buildIndex', function(done) {
  clerk.indexer.build(function(index){
    clerk.indexer.write(index);
    console.log(chalk.cyan('\n           Wat: Rebuilt index.\n'));
    done();
  });
});

gulp.task('watch', function() {
  gulp.watch('docs/**/*.md', ['buildIndex']);
  gulp.watch('src/**/*.js', ['babel']);
});

gulp.task('babel', function() {

  var bab = babel();

  bab.on('error', function(e) {
    console.log(e.stack);
  });

  bab.on('end', function(e) {
    console.log(chalk.cyan('           Wat: Transpiled to ES5.\n'));
  });

  console.log(chalk.cyan('\n           Wat: Transpiling ES5.'));
  var stream = gulp.src('src/**/*.js')
    .pipe(changed('dist'))
    .pipe(bab)
    .pipe(gulp.dest('dist'));

  return;
});

gulp.task('default', ['babel', 'watch']);

gulp.task('all', ['babel', 'initClerk', 'buildIndex', 'watch']);
gulp.task('index', ['initClerk', 'buildIndex', 'watch']);


