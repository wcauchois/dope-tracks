var gulp = require('gulp'),
    less = require('gulp-less'),
    browserify = require('browserify'),
    reactify = require('reactify'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify');

gulp.task('scripts', function() {
  browserify('src/js/app.js')
    .transform(reactify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('build/scripts'));
});

gulp.task('styles', function() {
  gulp.src('src/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('build/styles'));
});

gulp.task('default', ['scripts', 'styles']);

gulp.task('watch', ['scripts', 'styles'], function() {
  gulp.watch('src/js/**', ['scripts']);
  gulp.watch('src/less/**', ['styles']);
});
