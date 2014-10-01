var gulp = require('gulp');
var concat = require('gulp-concat');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var coffeelint = require('gulp-coffeelint');
var coffee = require('gulp-coffee');
var less = require('gulp-less');

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
  less: [
    'public/css/*.less'
  ],
  assets: [
    'public/*.html',
    'public/partials/*.html',
    'public/sound/*',
    'public/img/*',
    'public/fonts/*',
    'public/css/*.css',
    'public/js/angular-inbox.js',
    'public/js/FileSaver.js',
    'public/js/infinite-scroll.js',
    'public/js/bootstrap-tokenfield.js',
    'public/js/minievents.js'
  ],
  components: [
    'bower_components/**'
  ]
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

// For compiling a minimal version of the app that can be deployed
// without any server whatsoever to gh-pages or S3:

gulp.task('compile-less', function() {
  return gulp.src(paths.less)
    .pipe(less({
      paths: ['public/css']
    }))
    .pipe(gulp.dest('gh-pages/css'));
});

gulp.task('compile-coffee', function() {
  return gulp.src(paths.coffeescript)
    .pipe(coffee())
    .pipe(gulp.dest('gh-pages/js'));
});

gulp.task('compile-js', function() {
  return gulp.src(paths.javascript)
    .pipe(gulp.dest('gh-pages/js'));
});

gulp.task('copy-assets', function() {
  gulp.src(paths.assets, {base: "public"})
    .pipe(gulp.dest('gh-pages'));
  gulp.src(paths.components, {base: "bower_components"})
    .pipe(gulp.dest('gh-pages/components'));
});

gulp.task('gh-pages', ['compile-less', 'compile-coffee', 'compile-js', 'copy-assets']);

