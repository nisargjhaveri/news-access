var gulp = require('gulp');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

gulp.task('css', function() {
    return gulp.src('static/css/src/*.css')
        .pipe(postcss(
            [
                autoprefixer({ cascade: false })
            ]
        ))
        .pipe(gulp.dest('static/css'));
});

gulp.task('default', ['css']);
