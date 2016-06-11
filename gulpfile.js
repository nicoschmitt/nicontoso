var gulp        = require('gulp');
var gutil       = require('gulp-util');
var bowerMain   = require('bower-main');
var del         = require('del');
var concat      = require("gulp-concat");
var uglify      = require("gulp-uglify");
var rename      = require("gulp-rename");
var sass        = require("gulp-sass");
var cssnano     = require("gulp-cssnano");
var babel       = require("gulp-babel");
var usemin      = require('gulp-usemin');

// Auto

gulp.task('sass', function() {
    return gulp.src('client/css/*.scss')
                .pipe(sass.sync().on('error', sass.logError))
                .pipe(cssnano())
                .pipe(gulp.dest(function(f) {
                    return f.base;
                }));
});

gulp.task("watch-sass", function() {
   gulp.watch('client/css/*.scss', ['sass']); 
});

gulp.task("watch", [ "watch-sass" ]);

// Dev

gulp.task("clean", function() {
   del("client/lib/*"); 
});

gulp.task('bower-js', function() {
    return gulp.src(bowerMain('js','min.js').minifiedNotFound)
               .pipe(uglify())
               .pipe(rename({suffix: ".min"}))
               .pipe(gulp.dest("client/lib"));
});

gulp.task('bower-min-js', function() {
    return gulp.src(bowerMain('js','min.js').minified)
               .pipe(gulp.dest("client/lib"));
});

gulp.task('bower-css', function() {
    return gulp.src(bowerMain('css','min.css').minifiedNotFound)
               .pipe(uglify())
               .pipe(rename({suffix: ".min"}))
               .pipe(gulp.dest("client/lib"));
});

gulp.task('bower-min-css', function() {
    return gulp.src(bowerMain('css','min.css').minified)
               .pipe(gulp.dest("client/lib"));
});

// Main tasks

gulp.task('default', [ "clean", 'bower-js', 'bower-min-js', 'bower-css', 'bower-min-css', "sass" ]);

// Prod

gulp.task("replace-html", function() {
    return gulp.src("client/index.html")
                .pipe(usemin({
                    js: [
                        babel({ presets: ['es2015'] }),
                        uglify()
                    ]
                }))
                .pipe(gulp.dest("client/"));
});

gulp.task("prod", [ "sass", "replace-html" ]);
