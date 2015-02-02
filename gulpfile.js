var gulp = require("gulp");
var typescript = require("gulp-typescript");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
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
               .pipe(typescript({
                   noEmitOnError: true,
                   noImplicitAny: true,
                   target: "ES5",
               })).js
               .pipe(gulp.dest("./dest/js/"))
}

function minify() {
    return gulp.src(["./dest/js/*", "!./dest/js/*.min.js"])
               .pipe(uglify({ preserveComments: "some" }))
               .pipe(rename({ extname: ".min.js" }))
               .pipe(gulp.dest("./dest/js/"));
}

gulp.task("default", ["build"]);

gulp.task("build", build);
gulp.task("clean", clean);
gulp.task("minify", minify);

