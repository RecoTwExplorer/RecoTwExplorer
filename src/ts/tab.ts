import $ from "jquery";
import sffjs from "sffjs";
import { Options } from "./options";
import { Model } from "./model";
import { Controller } from "./controller";
import {
    APP_URL,
    LINK_TO_URL_HTML,
    NO_RESULT,
    SEARCH_RESULT,
    STATISTICS_COUNT,
    STATISTICS_COUNT_FILTERED,
    STATISTICS_TABLE_HTML,
    TWEET_REMOVED_HTML,
    TWEET_TIME_HTML,
} from "./resources";

/**
 * A tab.
 */
export class Tab {
    private readonly _id: string;

    private readonly _$element: JQuery;

    public rendered = false;

    public static home: HomeTab;

    public static statistics: StatisticsTab;

    public constructor(id: string) {
        this._id = id;
        this._$element = $(`a[href='#${id}']`).on("shown.bs.tab", () => {
            window.scrollTo(0, 0);
            this.render();
        });
    }

    public get id(): string {
        return this._id;
    }

    public get active(): boolean {
        return this.id === $(".tab-pane.active").attr("id");
    }

    public get element(): JQuery {
        return this._$element;
    }

    public show(): void {
        this._$element.tab("show");
    }

    public render(): void {
        this.rendered = true;
    }

    public clear(): void {
        this.rendered = false;
    }
}

/**
 * The home tab.
 */
export class HomeTab extends Tab {
    private static readonly TWEETS_COUNT = 25;

    private _current = 0;

    public constructor() {
        super("home-tab");
    }

    public render(next?: boolean, count?: number): void {
        if (!next && !count && this.rendered) {
            return;
        }

        $("#no-result-container").hide();
        Controller.loading = false;

        const $main = $("#main-area");
        let $container: JQuery;
        let entries = Model.entries?.enumerable;
        if (entries?.isEmpty()) {
            $("#no-result-container").fadeIn();
            return;
        }

        if (count) {
            entries = entries?.take(count);
            $container = $("<div></div>").prependTo($main);
        } else {
            entries = entries?.skip(this._current).take(HomeTab.TWEETS_COUNT);
            $container = $main;
        }

        entries?.forEach(x => HomeTab.renderTweet(x, $container));
        this._current += count ?? HomeTab.TWEETS_COUNT;
        super.render();
    }

    private static renderTweet(entry: RecoTwEntry, $container: JQuery): void {
        const $element = $("<div></div>", { id: `recotw-tweet-${entry.tweet_id}` }).appendTo($container);
        twttr.ready(twttr => {
            twttr.widgets.createTweet(entry.tweet_id, $element[0], {
                lang: "ja",
            }).then((widget?: HTMLElement): void => {
                if (!widget) {
                    HomeTab.showStatusLoadFailedMessage(entry, $element);
                }
            });
        });
    }

    private static replaceLinkToURL(target: string): string {
        return target.replace(/[\r\n]/gu, "<br>").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/gu, s => sffjs(LINK_TO_URL_HTML, s));
    }

    private static showStatusLoadFailedMessage(entry: RecoTwEntry, $target: JQuery): void {
        const tweetDate = Model.createDateByTweetID(entry);
        const time = sffjs(TWEET_TIME_HTML, Model.createStatusURL(entry), tweetDate, tweetDate?.toISOString());
        const $elm = $(sffjs(
            TWEET_REMOVED_HTML,
            Model.createProfileImageURL(entry),
            Model.createUserURL(entry),
            entry.target_sn,
            HomeTab.replaceLinkToURL(Model.escapeHtml(entry.content)),
            time,
        ));

        $target.empty().append($elm);
        $elm.find("img").on("error", ($event: JQueryEventObject) => ($event.target as HTMLImageElement).src = Model.createProfileImageURL(null));
    }

    public clear(): void {
        this._current = 0;
        $("#main-area").empty();
        super.clear();
    }
}

/**
 * The statistics tab.
 */
export class StatisticsTab extends Tab {
    private static readonly GRAPH_COLORS = [
        0xcccccc, 0x3366cc, 0xdc3912, 0xff9900, 0x109618, 0x990099, 0x0099c6, 0xdd4477,
        0x66aa00, 0xb82e2e, 0x316395, 0x994499, 0x22aa99, 0xaaaa11, 0x6633cc, 0xe67300,
        0x8b0707, 0x651067, 0x329262, 0x5574a6, 0x3b3eac, 0xb77322, 0x16d620, 0xb91383,
        0xf4359e, 0x9c5935, 0xa9c413, 0x2a778d, 0x668d1c, 0xbea413, 0x0c5922, 0x743411,
    ];

    private static readonly GRAPH_OPTIONS: google.visualization.PieChartOptions = {
        backgroundColor: "#FEFEFE",
        chartArea: {
            width: "90%",
            height: "100%",
        },
        is3D: true,
        legend: "none",
        sliceVisibilityThreshold: 0.0095,
    };

    private _chart: google.visualization.PieChart | null = null;

    public constructor() {
        super("statistics-tab");
    }

    public get chart(): google.visualization.PieChart {
        if (this._chart === null) {
            this._chart = new google.visualization.PieChart($("#statistics-chart")[0]);
            google.visualization.events.addListener(
                this._chart,
                "click",
                (slice: google.visualization.ClickEvent) => Controller.onChartSliceClick(slice),
            );
        }
        return this._chart;
    }

    public render(username?: string): void {
        if (!Model.isMobile() && !username) {
            $("#statistics-filter-textbox").focus();
            $("#statistics-table").delay(100)
                .animate({ scrollTop: 0 }, 400);
        }
        if (!Model.entries || !username && Tab.statistics.rendered) {
            return;
        }

        $("#no-result-container").hide();
        const options = Controller.getOptions();
        if (!username) {
            this.renderChart(options);
        }

        const table = Model.statistics?.users.map((user, index) => ({
            html: StatisticsTab.generateTableRow(user, options, index),
            screenName: user.target_sn.toLowerCase(),
        }))
            .filter(x => !username || x.screenName.startsWith(username));

        $("#statistics-table").html(table && table.length > 0 ? table.map(x => x.html).join("") : NO_RESULT);
        super.render();
    }

    private renderChart(options: Options): void {
        if (options.isFiltered()) {
            $("#statistics-filter").text(sffjs(SEARCH_RESULT, options.toKeywords()));
            $("#statistics-count").text(sffjs(STATISTICS_COUNT_FILTERED, Model.statistics?.length, Model.entries?.length));
        } else {
            $("#statistics-filter").text("");
            $("#statistics-count").text(sffjs(STATISTICS_COUNT, Model.statistics?.length));
        }

        if (Model.statistics?.length === 0) {
            $("#statistics-chart").hide();
            $("#no-result-container").fadeIn();
            return;
        }
        $("#statistics-chart").show();


        if (!Model.statistics) {
            throw new Error("Invalid statistics");
        }
        this.chart.draw(Model.statistics.table, StatisticsTab.GRAPH_OPTIONS);
    }

    private static generateTableRow(user: RecoTwUser, current: Options, index: number): string {
        const options = new Options([ user.target_sn ], current.body, current.id, current.regex, current.order, current.orderBy);
        return sffjs(
            STATISTICS_TABLE_HTML,
            user.percentage > Number(StatisticsTab.GRAPH_OPTIONS.sliceVisibilityThreshold)
                ? StatisticsTab.GRAPH_COLORS[index + 1]
                : StatisticsTab.GRAPH_COLORS[0],
            user.target_sn,
            user.count,
            user.percentage,
            APP_URL + options.toQueryString(),
        );
    }

    public clear(): void {
        $("#statistics-table").empty();
        super.clear();
    }

    public applySearchFilter(username: string): void {
        const options = Controller.getOptions();
        options.usernames = [ username ];
        Controller.setOptions(options, true, true, true);

        super.clear();
        Tab.home.show();
    }

    public applyChartFilter(username: string): void {
        this.render(username.toLowerCase());
    }
}
