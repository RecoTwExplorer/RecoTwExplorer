import $ from "jquery";
import sffjs from "sffjs";
import "bootstrap-sass/assets/javascripts/bootstrap";
import { Options } from "./options";
import { Order, OrderBy } from "./order";
import { Model } from "./model";
import { View } from "./view";
import { HomeTab, StatisticsTab, Tab } from "./tab";
import {
    APP_VERSION,
    PAGE_TITLE_NORMAL,
    PAGE_TITLE_SEARCH_RESULT,
    SEARCH_HELP_HTML,
} from "./resources";

/**
 * The controller.
 */
export class Controller {
    private static _options = new Options();

    public static loading = false;

    public static getOptions(): Options {
        return Controller._options;
    }

    public static setOptions(options: Options, sortOnly: boolean, setQuery: boolean, setKeywords: boolean): void {
        try {
            Model.options = Controller._options = options;
        } catch (e: unknown) {
            console.log((e as Error).message);
            return;
        }

        if (setQuery) {
            Model.setSearchQueryString(options);
        }
        if (setKeywords) {
            View.setSearchKeywords(options);
        }

        if (options.isFiltered()) {
            $("#clear-search-filter").show();
            View.title = sffjs(PAGE_TITLE_SEARCH_RESULT, options.toKeywords());
        } else {
            $("#clear-search-filter").hide();
            View.title = PAGE_TITLE_NORMAL;
        }

        $("#statistics-filter-textbox").val("");
        if (Model.entries === null) {
            return;
        }

        if (Tab.statistics.active) {
            Tab.home.clear();
            if (!sortOnly) {
                Controller.reload();
            }
        } else {
            Controller.reload();
        }
    }

    public static main(): void {
        View.title = PAGE_TITLE_NORMAL;
        $("#app-version").text(APP_VERSION);

        Model.init();
        Tab.home = new HomeTab();
        Tab.statistics = new StatisticsTab();
        Controller.setOptions(Options.fromQueryString(location.search, Order.descending, OrderBy.recordedDate), false, false, true);

        google.charts.load("current", {
            packages: [ "corechart" ],
        });
        $("#loading-recotw").show();

        const $window = $(window);
        $window.on("unload", () => Model.save());
        $window.on("orientationchange", () => {
            $(document.body).toggleClass("standalone", Boolean(navigator.standalone));
        }).trigger("orientationchange");
        $window.on("scroll", () => {
            const height = Number($(document).height());
            const position = Number($window.height()) + Number($window.scrollTop());
            if ((height - position) / height <= 0.05 && Tab.home.active) {
                Controller.onPageBottom();
            }
        });
        $window.on("popstate", () => {
            Controller.setOptions(Options.fromQueryString(location.search, Controller.order, Controller.orderBy), false, false, true);
        });
        Tab.home.element.on("click", () => {
            if (!Tab.home.active) {
                return;
            }
            $("html, body").animate({ scrollTop: 0 }, 400);
        });
        $(".navbar-brand, #clear-search-filter").on("click", () => {
            Controller.setOptions(Options.fromKeywords("", Controller.order, Controller.orderBy), false, true, true);
        });
        $("[id^='order-by-']").on("change", () => {
            Controller.getOptions().order = Controller.order;
            Controller.getOptions().orderBy = Controller.orderBy;
            Controller.setOptions(Controller.getOptions(), true, false, false);
        });
        $("#order-shuffle").on("click", () => {
            Controller.getOptions().order = Controller.order;
            Controller.setOptions(Controller.getOptions(), true, false, false);
        });
        $("#search-form").on("submit", $event => {
            $event.preventDefault();
            Controller.setOptions(Options.fromKeywords(String($("#search-box").val()), Controller.order, Controller.orderBy), false, true, false);
        });
        $("#search-form-toggle-button").on("click", e => {
            const $target = $(e.currentTarget);
            const $elm = $("#search-form");
            const $main = $("#page-main");
            if ($target.hasClass("active")) {
                $target.removeClass("active");
                $main.removeClass("main-search-active");
                $elm.css({ display: "" });
            } else {
                $target.addClass("active");
                $main.addClass("main-search-active");
                $elm.css({ cssText: "display: block !important" });
            }
        });
        $<HTMLInputElement>("#statistics-filter-textbox").on("keyup change input", e => {
            Tab.statistics.applyChartFilter(e.target.value);
        });
        $("#statistics-table").on("mousedown click", ".statistics-table-header a", (e: JQuery.TriggeredEvent<HTMLElement, unknown, HTMLElement, HTMLElement>) => {
            if (e.type === "click") {
                e.preventDefault();
                return;
            }
            if (e.button === 0) {
                Tab.statistics.applySearchFilter(e.target.textContent ?? "");
            }
        });
        $("#search-box").popover({
            placement: "bottom",
            html: true,
            content: SEARCH_HELP_HTML,
            sanitize: false,
        }).on("blur", e => {
            $(e.currentTarget).popover("hide");
        }).on("keydown", e => {
            if (e.keyCode === 13 || e.keyCode === 27) {
                $(e.currentTarget).popover("hide");
            }
        });
    }

    public static get order(): Order {
        return $(".order-radio-box:checked").data("order") as Order;
    }

    public static get orderBy(): OrderBy {
        return $(".order-radio-box:checked").data("order-by") as OrderBy;
    }

    public static reload(): void {
        if (Model.entries === null) {
            return;
        }
        Tab.home.clear();
        Tab.statistics.clear();

        if (Tab.home.active) {
            Tab.home.render();
            $("#statistics-filter-textbox").val("");
        }
        if (Tab.statistics.active) {
            Tab.statistics.render();
        }
    }

    public static onEntriesLoaded(): void {
        $("#loading-recotw, #loading-panel-container").fadeOut();
        if (Model.entries === null) {
            return;
        }
        Controller.setOptions(Controller.getOptions(), false, false, true);
    }

    public static onEntriesLoadFailed(): void {
        $("#loading-panel").fadeOut()
            .promise()
            .done(() => $("#loading-error-panel").fadeIn());
    }

    private static onPageBottom(): void {
        if (Controller.loading) {
            return;
        }
        Controller.loading = true;
        Tab.home.render(true);
    }

    public static onChartSliceClick(slice: google.visualization.ClickEvent): void {
        const index = slice.targetID.indexOf("#");
        if (index < 0) {
            return;
        }
        const id = Number(slice.targetID.substring(index + 1));
        if (id < 0) {
            return;
        }
        Tab.statistics.applySearchFilter(Model.statistics?.users[id].target_sn ?? "");
    }

    public static showNewStatuses(count: number): void {
        Tab.home.show();
        const options = Controller.getOptions();
        if (options.isFiltered() || options.order !== Order.descending || options.orderBy !== OrderBy.recordedDate) {
            Controller.setOptions(new Options([], "", null, false, options.order, options.orderBy), false, true, true);
        } else {
            // Assign options in order to reset the enumerator
            Model.options = options;
            Tab.home.render(false, count);
        }
    }
}
