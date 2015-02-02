var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var del = require("del");
var browserSync = require("browser-sync");
var reload = browserSync.reload;
var runSequence = require("run-sequence");

function build() {
    compile().on("end", minify);
}

function clean() {
    del(['./dest/**/*']);
    del(['./dev/**/*']);
    //del(["./dest/css/*"]);
    //del(["./dest/js/*"]);
    //del(["./dest/images/*"]);
    //del(["./dest/favicon.ico"]);
    //del(["index.html"]);
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
               .pipe(gulp.dest("./dev/js/"))
               .pipe($.size())
}

function minify() {
    return gulp.src(["./dev/js/*.js", "!./dev/js/*.min.js"])
               .pipe($.uglify({ preserveComments: "some" }))
               .pipe($.rename({ extname: ".min.js" }))
               .pipe(gulp.dest("./dest/js/"))
               .pipe($.size())
}

function html() {
    var assets = $.useref.assets();
    return gulp.src(["index.html"])
        .pipe(assets)
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.csso()))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe(gulp.dest("./dest/"))
        .pipe($.size());
}

function styles() {
    return gulp.src(["./src/scss/style.scss","./lib/css/*.css", "!./lib/css/*.min.css"])
        .pipe($.sass({
            precision: 10,
            onError: console.error.bind(console, 'Sass error:')
        }))
        .pipe(gulp.dest("dev/css"))
        //.pipe($.if('*.css', $.csso()))
        //.pipe(gulp.dest('dest/css'))
        .pipe($.size({title: 'styles'}));


}

function copy() {
    return gulp.src(['favicon.ico'])
        .pipe(gulp.dest('./dest/'))
        .pipe($.size({title: 'copy'}))
}

function fonts() {
    return gulp.src(['./lib/fonts/*'])
        .pipe(gulp.dest('./dest/fonts/'))
        .pipe($.size({title: 'fonts'}))
}

function images() {
    return gulp.src(['./images/*'])
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('./dest/images/'))
        .pipe($.size())
}

function serve() {
    browserSync({
        notify: false,
        logPrefix: 'WSK',
        server: ['.']
    });
    gulp.watch(["index.html"],reload);
    gulp.watch(["./src/**/*.scss"],[styles,reload]);
    gulp.watch(["./src/ts/*.ts"],[compile,reload]);
    gulp.watch(["./images/**/*"],reload);
}

function serveDist() {
    browserSync({
        notify:false,
        logPrefix:'WSK',
        server:'dest'
    })
}

gulp.task("default", ["clean"], function(cb){
    runSequence("styles","build",["html","assets"],cb);
});
gulp.task("assets", ["copy","images","fonts"]);


gulp.task("build", build);
gulp.task("clean", clean);
gulp.task("minify", minify);
gulp.task("html", html);
gulp.task("copy",copy);
gulp.task("images",images);
gulp.task("fonts",fonts);
gulp.task("styles",styles);

gulp.task("serve",serve);
gulp.task("serve:dist",serveDist);

