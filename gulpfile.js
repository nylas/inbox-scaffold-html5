var gulp = require('gulp');
var concat = require('gulp-concat');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var coffeelint = require('gulp-coffeelint');

var paths = {
  javascript: [
    'public/js/**/*.js',

    '!public/js/angular-inbox.js',
    '!public/js/FileSaver.js',
    '!public/js/infinite-scroll.js',
    '!public/js/bootstrap-tokenfield.js',
    '!public/js/minievents.js',
  ],
  coffeescript: [
    'public/js/**/*.coffee'
  ],
  tests: [
    'tests/**/*.js'
  ],
}

gulp.task('default', ['style', 'lint']);
gulp.task('style', ['jscs']);
gulp.task('lint', ['lint-js', 'lint-coffee']);

gulp.task('test', function (done) {
  var karma = require('karma').server;
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('jscs', function() {
  var src = gulp.src(paths.javascript).
    pipe(jscs());
  var test = gulp.src(paths.tests).
    pipe(jscs());
  return merge(src, test);
});

gulp.task('lint-js', function() {
  return gulp.src(paths.javascript).
    pipe(jshint()).
    pipe(jshint.reporter('jshint-stylish')).
    pipe(jshint.reporter('fail'));
});

gulp.task('lint-coffee', function() {
  return gulp.src(paths.coffeescript).
    pipe(coffeelint()).
    pipe(coffeelint.reporter());
});
