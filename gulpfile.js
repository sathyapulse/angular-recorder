var gulp = require('gulp');

var footer = require('gulp-footer'),
  header = require('gulp-header'),
  ngModuleSort = require('gulp-ng-module-sort'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  replace = require('gulp-replace'),
  rename = require('gulp-rename')
  ;

var scriptsGlob = 'src/**/*.js', outfile = 'angular-audio-recorder';


gulp.task('angularScripts', function () {

  return gulp.src('src/angular/**/*.js')
    .pipe(ngModuleSort())
    .pipe(replace(/\s*'use strict';?\s*/, ''))
    .pipe(concat(outfile + '.js'))         // do things that require all files
    .pipe(header('(function() {\n  \'use strict\';\n'))
    .pipe(footer('})();'))
    .pipe(gulp.dest('.tmp/'));
});


gulp.task('scripts', ['angularScripts'], function () {
  return gulp.src(['.tmp/' + outfile + '.js', 'src/*.js', '!src/angular/**/*.js'])
    .pipe(concat(outfile + '.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('minify', ['scripts'], function () {
  return gulp.src(['dist/' + outfile + '.js'])
    .pipe(uglify({
      outSourceMap: 'dist/' + outfile + ".js.map",
      mangle: true
    }))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('dist'));
});


gulp.task('build', ['scripts', 'minify']);

//@TODO add tests

gulp.task('default', ['build']);