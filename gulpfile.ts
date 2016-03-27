/// <reference path="typings/main.d.ts"/>

import {Gulpclass, Task, SequenceTask} from "gulpclass/Decorators";
import * as gulp from "gulp";
import * as del from "del";
import * as browserSync from "browser-sync";

const $ = require("gulp-load-plugins")();

class ErrorNotifier {
    public static getErrorListener(title: string): (error: Error) => void {
        return $.notify.onError((error: Error) => ({
            title: title,
            message: error.message.replace(/\u001b\[\d+m/g, "")
        }));
    }
}

@Gulpclass()
export class Tasks {
    @SequenceTask()
    default(callback: (err: Error) => any): (string | string[])[] {
        return ["clean", "styles", "lint", "build", ["html", "assets"]];
    }

    @Task()
    clean(): Promise<string[]> {
        return del(["./dest/**/*", "./dev/**/*"]);
    }

    @Task()
    build(): NodeJS.ReadWriteStream {
        return this.compile();
    }

    @Task()
    compile(): NodeJS.ReadWriteStream {
        return gulp.src(["./src/ts/*.ts"])
                   .pipe($.tsconfigUpdate())
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

    @Task()
    html(): NodeJS.ReadWriteStream {
        return gulp.src(["./*.html"])
                   .pipe($.useref())
                   .pipe($.if("*.js", $.uglify({ preserveComments: "some" })))
                   .pipe($.if("*.css", $.csso()))
                   .pipe(gulp.dest("./dest/"))
                   .pipe($.size());
    }

    @Task()
    styles(): NodeJS.ReadWriteStream {
        return gulp.src(["./src/scss/*.scss", "./lib/css/*.css", "!./lib/css/*.min.css"])
                   .pipe($.sass({
                       precision: 10
                   }))
                   .on("error", ErrorNotifier.getErrorListener("SCSS Compilation Error"))
                   .pipe(gulp.dest("dev/css"))
                   .pipe($.size({ title: "styles" }));
    }

    @Task()
    copy(): NodeJS.ReadWriteStream {
        return gulp.src(["./favicon.ico", "CNAME"])
                   .pipe(gulp.dest("./dest/"))
                   .pipe($.size({ title: "copy" }));
    }

    @Task()
    fonts(): NodeJS.ReadWriteStream {
        return gulp.src(["./bower_components/**/fonts/**"])
                   .pipe($.flatten())
                   .pipe(gulp.dest("./dev/fonts/"))
                   .pipe(gulp.dest("./dest/fonts/"))
                   .pipe($.size({ title: "fonts" }));
    }

    @Task()
    images(): NodeJS.ReadWriteStream {
        return gulp.src(["./images/*"])
                   .pipe($.cache($.imagemin({
                       progressive: true,
                       interlaced: true
                   })))
                   .pipe(gulp.dest("./dest/images/"))
                   .pipe($.size());
    }

    @Task()
    lint(): NodeJS.ReadWriteStream {
        return gulp.src("./src/ts/*.ts")
                   .pipe($.tslint())
                   .pipe($.tslint.report("verbose"))
                   .on("error", ErrorNotifier.getErrorListener("TypeScript Lint Error"));
    }

    @Task("lint:noemit")
    lintNoemit(): NodeJS.ReadWriteStream {
        return gulp.src("./src/ts/*.ts")
                   .pipe($.tslint())
                   .pipe($.tslint.report("verbose"), {
                       emitError: false
                   });
    }

    @Task()
    bower(): NodeJS.ReadWriteStream {
        return $.bower({ cmd: "update" });
    }

    @Task()
    serve(): void {
        browserSync({
            notify: false,
            logPrefix: "WSK",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
            },
            server: ["."],
            files: ["*.html", "./dev/css/*.css", "./dev/js/*.js", "./images/**/*"]
        });
        gulp.watch(["./src/**/*.scss"], ["styles"]);
        gulp.watch(["./src/ts/*.ts"], ["build", "lint:noemit"]);
    }

    @Task("serve-dest")
    serve_dest(): void {
        browserSync({
            notify: false,
            logPrefix: "WSK",
            server: "dest",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
            }
        });
    }

    @SequenceTask()
    assets(): string[][] {
        return [["copy", "images", "fonts"]];
    }

    @SequenceTask()
    full(): (string | string[])[] {
        return [["bower", "clean"], "default"];
    }
}
