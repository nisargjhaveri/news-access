var gulp = require('gulp');
var del = require('del');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

var path = {
    css: {
        src: 'static/css/src/*.css',
        dest: 'static/css/build'
    },
};

gulp.task('clean', function() {
    // Must be synchronous if we're going to use this task as a dependency
    for (var taskPath in path) {
        if (path.hasOwnProperty(taskPath)) {
            del.sync(path[taskPath].dest + '/');
        }
    }
});

gulp.task('css', function() {
    return gulp.src(path.css.src)
        .pipe(postcss(
            [
                autoprefixer({ cascade: false })
            ]
        ))
        .pipe(gulp.dest(path.css.dest));
});

gulp.task('watch', ['default'], function() {
    gulp.watch(path.css.src, ['css']);
});

gulp.task('default', ['css']);
