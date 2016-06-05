import {Gulpclass, Task, SequenceTask} from "gulpclass/Decorators";
import * as gulp from "gulp";
import * as del from "del";
import * as browserSync from "browser-sync";
import * as url from "url";

const runSequence = require("run-sequence");
const proxy = require("proxy-middleware");
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
    default(): (string | string[])[] {
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
        const project = $.typescript.createProject("./src/tsconfig.json");
        return project.src()
                      .pipe($.sourcemaps.init())
                      .pipe($.typescript(project).js)
                      .on("error", ErrorNotifier.getErrorListener("TypeScript Compilation Error"))
                      .pipe($.sourcemaps.write("."))
                      .pipe($.flatten())
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
    lintNoEmit(): NodeJS.ReadWriteStream {
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
    async serve(): Promise<void> {
        const tasks: (string | string[] | gulp.TaskCallback)[] = this.default();
        await new Promise(resolve => runSequence.apply(runSequence, tasks.concat(resolve)));
        browserSync({
            notify: false,
            logPrefix: "WSK",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
            },
            server: ["."],
            files: ["*.html", "./dev/css/*.css", "./dev/js/*.js", "./images/**/*"],
            middleware: Tasks.browserSyncMiddleware(),
        });
        gulp.watch(["./src/**/*.scss"], ["styles"]);
        gulp.watch(["./src/ts/*.ts"], ["build", "lint:noemit"]);
    }

    @Task("serve-dest")
    serveDest(): void {
        browserSync({
            notify: false,
            logPrefix: "WSK",
            server: "dest",
            ghostMode: {
                clicks: true,
                forms: false,
                scroll: true,
            },
            middleware: Tasks.browserSyncMiddleware(),
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

    static browserSyncMiddleware(): browserSync.MiddlewareHandler {
        const proxyOptions: any = url.parse("http://157.112.147.23/");
        proxyOptions.route = "/api/recotw";
        proxyOptions.headers = {"Host": "api.recotw.black"};
        return proxy(proxyOptions);
    }
}
