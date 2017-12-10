var gulp = require('gulp');
var watchLess = require('gulp-watch-less2');
var less = require('gulp-less');
var lessGlobs = 'app/resources/*.less';
gulp.task('default', function () {
    return gulp.src(lessGlobs)
        .pipe(watchLess(lessGlobs, {verbose: true}))
        .pipe(less())
        .pipe(gulp.dest('app/resources'));
});