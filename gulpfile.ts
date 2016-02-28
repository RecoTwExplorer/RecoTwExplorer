/// <reference path="typings/main.d.ts"/>

import * as gulp from "gulp";
import * as del from "del";
import * as browserSync from "browser-sync";

var $ = require("gulp-load-plugins")();
var runSequence = require("run-sequence");

class ErrorNotifier {
    public static getErrorListener(title: string): (error: Error) => void {
        return $.notify.onError((error: Error) => ({
            title: title,
            message: error.message.replace(/\u001b\[\d+m/g, "")
        }));
    }
}

class Tasks {
    // [id: string]: gulp.ITaskCallback;

    private default(callback: (err: Error) => any): ReadWriteStream {
        return runSequence("styles", "lint", "build", ["html", "assets"], callback);
    }

    private clean(callback: (err: Error, deletedFiles: string[]) => any): void {
        del(["./dest/*", "./dev/*", "!./dest/.git"], { dot: true }, callback);
    }

    private build(): ReadWriteStream {
        return this.compile();
    }

    private compile(): ReadWriteStream {
        return gulp.src(["./src/ts/*.ts"])
                   .pipe($.sourcemaps.init())
                   .pipe($.typescript({
                       noEmitOnError: true,
                       noImplicitAny: true,
                       target: "ES5",
                       sortOutput: true
                   })).js
                   .on("error", ErrorNotifier.getErrorListener("TypeScript Compilation Error"))
                   .pipe($.sourcemaps.write("."))
                   .pipe(gulp.dest("./dev/js/"))
                   .pipe($.size());
    }

    private html(): ReadWriteStream {
        var assets = $.useref.assets();
        return gulp.src(["./*.html"])
                   .pipe(assets)
                   .pipe($.if("*.js", $.uglify({ preserveComments: "some" })))
                   .pipe($.if("*.css", $.csso()))
                   .pipe(assets.restore())
                   .pipe($.useref())
                   .pipe(gulp.dest("./dest/"))
                   .pipe($.size());
    }

    private styles(): ReadWriteStream {
        return gulp.src(["./src/scss/*.scss", "./lib/css/*.css", "!./lib/css/*.min.css"])
                   .pipe($.sass({
                       precision: 10
                   }))
                   .on("error", ErrorNotifier.getErrorListener("SCSS Compilation Error"))
                   .pipe(gulp.dest("dev/css"))
                   .pipe($.size({ title: "styles" }));
    }

    private copy(): ReadWriteStream {
        return gulp.src(["./favicon.ico", "CNAME"])
                   .pipe(gulp.dest("./dest/"))
                   .pipe($.size({ title: "copy" }));
    }

    private fonts(): ReadWriteStream {
        return gulp.src(["./bower_components/**/fonts/**"])
                   .pipe($.flatten())
                   .pipe(gulp.dest("./dev/fonts/"))
                   .pipe(gulp.dest("./dest/fonts/"))
                   .pipe($.size({ title: "fonts" }));
   }

    private images(): ReadWriteStream {
        return gulp.src(["./images/*"])
                   .pipe($.cache($.imagemin({
                       progressive: true,
                       interlaced: true
                   })))
                   .pipe(gulp.dest("./dest/images/"))
                   .pipe($.size());
    }

    private lint(): ReadWriteStream {
        return gulp.src("./src/ts/*.ts")
                   .pipe($.tslint())
                   .pipe($.tslint.report("verbose"))
                   .on("error", ErrorNotifier.getErrorListener("TypeScript Lint Error"));
    }

    private lint_noemit(): ReadWriteStream {
        return gulp.src("./src/ts/*.ts")
                   .pipe($.tslint())
                   .pipe($.tslint.report("verbose"), {
                       emitError: false
                   });
    }

    private bower(): ReadWriteStream {
        return $.bower({ cmd: "update" });
    }

    private serve(): void {
        browserSync({
            notify: false,
            logPrefix: "WSK",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
                get: () => void 0
            },
            server: ["."],
            files: ["*.html", "./dev/css/*.css", "./dev/js/*.js", "./images/**/*"]
        });
        gulp.watch(["./src/**/*.scss"], ["styles"]);
        gulp.watch(["./src/ts/*.ts"], ["build", "lint:noemit"]);
    }

    private serve_dest(): void {
        browserSync({
            notify: false,
            logPrefix: "WSK",
            server: "dest",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
                get: () => void 0
            }
        });
    }

    public static register(): void {
        var instance = new Tasks();
        for (var task in instance) {
            gulp.task((<string>task).replace("_", ":"), instance[task].bind(instance));
        }

        gulp.task("default", ["clean"], instance.default);
        gulp.task("assets", ["copy", "images", "fonts"]);
        gulp.task("full", ["bower", "clean"], instance.default);
    }
}

Tasks.register();
