var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var del = require("del");

function build() {
    compile().on("end", minify);
}

function clean() {
    del(["./dest/css/*"]);
    del(["./dest/js/*"]);
}

function compile() {
    return gulp.src(["./src/ts/*.ts"])
               .pipe($.sourcemaps.init())
               .pipe($.typescript({
                   noEmitOnError: true,
                   noImplicitAny: true,
                   target: "ES5",
                   sortOutput: true
               })).js
               .pipe($.sourcemaps.write("."))
               .pipe(gulp.dest("./dest/js/"))
}

function minify() {
    return gulp.src(["./dest/js/*.js", "!./dest/js/*.min.js"])
               .pipe($.uglify({ preserveComments: "some" }))
               .pipe($.rename({ extname: ".min.js" }))
               .pipe(gulp.dest("./dest/js/"));
}

gulp.task("default", ["build"]);

gulp.task("build", build);
gulp.task("clean", clean);
gulp.task("minify", minify);

