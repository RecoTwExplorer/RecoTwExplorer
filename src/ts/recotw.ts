/// <reference path="./recotw.d.ts"/>
/// <reference path="../../lib/js/typings/bootstrap/bootstrap.d.ts"/>
/// <reference path="../../lib/js/typings/google.visualization/google.visualization.d.ts"/>
/// <reference path="../../lib/js/typings/jquery/jquery.d.ts"/>
/// <reference path="../../lib/js/typings/libstring/libstring.d.ts"/>
/// <reference path="../../lib/js/typings/linq/linq.d.ts"/>
/// <reference path="../../lib/js/typings/linq/linq.jquery.d.ts"/>
/// <reference path="../../lib/js/typings/twitter.d.ts"/>

/*!
 * RecoTw Explorer - Copyright 2014, Chitoku
 * http://recotw.chitoku.jp/
 *
 * Licensed under MIT License
 * http://www.opensource.org/licenses/mit-license
 *
 * Required libraries:
 * - jQuery
 * - linq.js
 * - Bootstrap
 * - Google Charts
 */

module RecoTwExplorer {
    var APP_NAME = "RecoTw Explorer";
    var APP_VERSION = "2.32";

    /*
     * Bootstrap jQuery Shake Effect snippet - pAMmDzOfnL
     * http://www.bootply.com/60873
     */
    $.fn.shake = function (shakes: number, distance: number, duration: number): JQuery {
        "use strict";
        return (<JQuery>this).each(function () {
            var $this = $(this);
            for (var i = 0; i < shakes; i++) {
                $this.animate({ left: -distance }, duration / shakes / 4)
                     .animate({ left: distance }, duration / shakes / 2)
                     .animate({ left: 0 }, duration / shakes / 4);
            }
        });
    };

    /**
     * Specifies how entries are sorted.
     */
    const enum Order {
        /**
         * The default. No sort order is specified.
         */
        None,
        /**
         * Entries are sorted in ascending order.
         */
        Ascending,
        /**
         * Entries are sorted in descending order.
         */
        Descending,
        /**
         * Entries are shuffled.
         */
        Shuffle
    }

    /**
     * Specifies by how entries are sorted.
     */
    const enum OrderBy {
        /**
         * The default. No sort target is specified.
         */
        None,
        /**
         * Entries are sorted by their record_date values.
         */
        RecordedDate,
        /**
         * Entries are sorted by their tweet_id values.
         */
        CreatedDate
    }

    /**
     * Specifies a tab to show.
     */
    const enum Tab {
        /**
         * The default. No tab is specified.
         */
        None,
        /**
         * The home tab.
         */
        Home,
        /**
         * The statistics tab.
         */
        Statistics
    }

    /**
     * The resources for UI.
     */
    class Resources {
        public static INCORRECT_REGEX = "指定された正規表現は正しくありません。";
        public static INCORRECT_URL_OR_ID = "指定された URL または ID は正しくありません。";
        public static FAILED_TO_GENERATE_STATUS_URL = "ツイートの URL を生成できません。";
        public static FAILED_TO_GENERATE_USER_URL = "ユーザーへの URL を生成できません。";
        public static FAILED_TO_GENERATE_PROFILE_IMAGE_URL = "プロフィール画像の URL を生成できません。";
        public static FAILED_TO_LOAD_EMBEDDED_TWEET = "Twitter 埋め込みツイートの読み込みに失敗しました。";
        public static SEARCH_HELP_HTML = "<dl><dt>ツイート検索</dt><dd><code>/</code> と <code>/</code> で囲むと正規表現検索</dd><dt>ユーザー名検索</dt><dd><code>from:</code> でユーザーを検索<br>カンマ区切りで複数入力</dd><dt>ID 検索</dt><dd><code>id:</code> で ID 検索</dd></dl>";
        public static STATISTICS_TABLE_HTML = "<span class=\"statistics-table-header\" style=\"border-color: #{0:X6};\"><a href=\"javascript:void(0);\" onclick=\"RecoTwExplorer.Controller.setSearchFilterByUsername('{1}')\">{1}</a> ({2})&nbsp;&nbsp;&ndash;&nbsp;&nbsp;{3:P1}</span><br>";
        public static TWEET_REMOVED_HTML = "<blockquote>ツイートは削除されたか、または非公開に設定されています。<a href=\"{0}\" target=\"_blank\">表示</a><hr><div><img src=\"{1}\" onerror=\"RecoTwExplorer.Controller.onImageError(this)\"><span><a href=\"{2}\" target=\"_blank\">@{3}</a></span><p>{4}</p></div></blockquote>";
        public static LINK_TO_URL_HTML = "<a href=\"{0}\" target=\"_blank\">{0}</a>";
        public static URL_INPUT_AREA = $("#new-record-form .modal-body").html();
        public static USERNAME = "ユーザ名";
        public static TWEETS_COUNT = "ツイート数";
        public static NO_RESULT = "<p class=\"text-center\" style=\"margin-top: 200px;\">該当ユーザーなし</p>";
        public static SEARCH_RESULT = "検索結果: {0}";
        public static STATISTICS_COUNT = "({0:N0} 件)";
        public static PAGE_TITLE_SEARCH_RESULT = "検索結果: {0} - " + APP_NAME;
        public static PAGE_TITLE_NORMAL = APP_NAME;
        public static POST_ERRORS: {
            [code: string]: string;
            UNKNOWN_ERROR: string;
        } = {
            "400": "パラメーターが正しくありません。",
            "403": "ツイートの取得に失敗しました。",
            "404": "指定されたツイートは存在しません。",
            "500": "すでに登録されているツイートです。",
            "503": "サーバーで問題が発生しています。",
            UNKNOWN_ERROR: "原因不明のエラーです。"
        };
    }

    /**
     * Configurations to filter and sort entries.
     */
    class Options {
        /**
         * Initializes a new instance of a Options class with parameters.
         *
         * @param usernames A username to filter entries by their target_sn values.
         * @param body A string to filter entries by their content values.
         * @param id The ID to filter entries by their target_id values.
         * @param countIf The comparative expression to compare with count value.
         * @param regex A value that determines if the filter users RegExp or not.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        constructor(public usernames: string[] = [], public body: string = "", public id: string = null, public regex: boolean = false, public order: Order = Order.Descending, public orderBy: OrderBy = OrderBy.RecordedDate) { }

        private isFilteredByUsernames(): boolean {
            return this.usernames !== void 0 && this.usernames.length > 0;
        }

        private isFilteredByID(): boolean {
            return this.id !== void 0 && this.id !== null;
        }

        private isFilteredByBody(): boolean {
            return this.body !== void 0 && this.body.length > 0;
        }

        /**
         * Gets a value that determines if the options have filter or not.
         */
        public isFiltered(): boolean {
            return this.isFilteredByUsernames() || this.isFilteredByID() || this.isFilteredByBody();
        }

        /**
         * Converts the options to a search query string, which is used for location.search.
         */
        public toQueryString(): string {
            var queries: string[] = [];
            if (this.isFilteredByUsernames()) {
                queries[queries.length] = "username=" + encodeURIComponent(this.usernames.join(","));
            }
            if (this.isFilteredByID()) {
                queries[queries.length] = "id=" + encodeURIComponent(this.id);
            }
            if (this.isFilteredByBody()) {
                if (this.regex) {
                    queries[queries.length] = "body=" + encodeURIComponent("/" + this.body + "/");
                } else {
                    queries[queries.length] = "body=" + encodeURIComponent(this.body);
                }
            }
            if (queries.length > 0) {
                return "?" + queries.join("&");
            } else {
                return "";
            }
        }

        /**
         * Converts the options to a keywords string.
         */
        public toKeywords(): string {
            var keywords: string[] = [];
            if (this.isFilteredByUsernames()) {
                keywords[keywords.length] = "from:" + this.usernames.join(",");
            }
            if (this.isFilteredByID()) {
                keywords[keywords.length] = "id:" + this.id;
            }
            if (this.isFilteredByBody()) {
                if (this.regex) {
                    keywords[keywords.length] = "/" + this.body + "/";
                } else {
                    keywords[keywords.length] = this.body;
                }
            }
            return keywords.join(" ");
        }

        /**
         * Creates a new instance of a Options class with a query string.
         *
         * @param queryString A query string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        public static fromQueryString(queryString: string, order: Order, orderBy: OrderBy): Options {
            var options = new Options([], "", null, false, order, orderBy);
            if (queryString.length === 0 || queryString === "?") {
                return options;
            }
            var queries = queryString.substring(1).split("&").map(x => x.split("="))
                                                             .filter(x => x.length === 2)
                                                             .map(x => ({ property: x[0], value: decodeURIComponent(x[1]) }));

            queries.filter(x => x.property === "body").forEach(x => {
                var match: RegExpMatchArray;
                if ((match = x.value.match(/^\/(.*)\/$/)) !== null) {
                    options.body = match[1];
                    options.regex = true;
                } else {
                    options.body = x.value;
                    options.regex = false;
                }
            });
            queries.filter(x => x.property === "username").forEach(x => options.usernames = x.value.split(","));
            queries.filter(x => x.property === "id").forEach(x => options.id = x.value);
            return options;
        }

        /**
         * Creates a new instance of a Options class with a keywords string.
         *
         * @param keywords A keywords string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        public static fromKeywords(keywords: string, order: Order, orderBy: OrderBy): Options {
            var options = new Options([], "", null, false, order, orderBy);
            var value = keywords.split(" ");
            var match: RegExpMatchArray;

            for (var i = 0; i < value.length; i++) {
                if ((match = value[i].match(/^from:([a-zA-Z0-9_]+(?:,[a-zA-Z0-9_]+)*)$/)) !== null) {
                    options.usernames = match[1].split(",");
                    continue;
                }
                if ((match = value[i].match(/^id:(\d+)$/)) !== null) {
                    options.id = match[1];
                    continue;
                }
                options.body += value[i];
            }
            if ((match = options.body.match(/^\/(.*)\/$/)) !== null) {
                options.body = match[1];
                options.regex = true;
            }
            return options;
        }
    }

    /**
     * Information which aggregates users.
     */
    class RecoTwStatistics {
        public users: RecoTwUser[];
        public entryLength: number;
        public dataTable: google.visualization.DataTable;

        /**
         * Initializes a new instance of RecoTwStatistics class with parameters.
         *
         * @param enumrable An object to enumerate the entries.
         */
        public constructor(enumerable: linqjs.IEnumerable<RecoTwEntry>) {
            this.users = enumerable.groupBy(x => x.target_id)
                                   .select(x => ({ target_sn: x.firstOrDefault().target_sn, count: x.count() }))
                                   .orderByDescending(x => x.count)
                                   .thenBy(x => x.target_sn.toLowerCase())
                                   .toArray();

            this.entryLength = enumerable.count();
            this.dataTable = new google.visualization.DataTable({
                cols: [
                    { type: "string", label: Resources.USERNAME },
                    { type: "number", label: Resources.TWEETS_COUNT }
                ],
                rows: this.users.map(x => ({ c: [{ v: x.target_sn }, { v: x.count }] }))
            })
        }
    }

    /**
     * The collection of RecoTw Entries.
     */
    class RecoTwEntryCollection {
        /**
         * Initializes a new instance of RecoTwEntryCollection class with parameters.
         *
         * @param elements All the entries.
         * @param userIDs A unique hash set of screen_names and user IDs.
         * @param enumerable An object to enumerate the entries.
         */
        public constructor(private elements: RecoTwEntry[], private userIDs: linqjs.IDictionary<string, string> = null, private enumerable: linqjs.IEnumerable<RecoTwEntry> = Enumerable.from(elements)) {
            if (userIDs === null) {
                this.userIDs = this.enumerable.toDictionary(x => x.target_id, x => x.target_sn);
                this.enumerable.forEach(x => x.target_sn = this.userIDs.get(x.target_id));
            }
        }

        /**
         * Adds items to the entries.
         *
         * @param items The items to add.
         */
        public addRange(items: linqjs.IEnumerable<RecoTwEntry>): void {
            items.forEach(x => this.elements[this.elements.length] = x);
        }

        /**
         * Returns a copy of this instance.
         */
        public clone(): RecoTwEntryCollection {
            return new RecoTwEntryCollection(this.elements, this.userIDs, this.enumerable);
        }

        /**
         * Returns a new instance which has the same elements.
         */
        public reset(): RecoTwEntryCollection {
            return new RecoTwEntryCollection(this.elements, this.userIDs);
        }

        /**
         * Gets a number of all the entries.
         */
        public getAllLength(): number {
            return this.elements.length;
        }

        /**
         * Gets an object to enumerate the entries.
         */
        public getEnumerable(): linqjs.IEnumerable<RecoTwEntry> {
            return this.enumerable;
        }

        /**
         * Creates a statistics information by current entries.
         */
        public createStatistics(): RecoTwStatistics {
            return new RecoTwStatistics(this.enumerable);
        }

        /**
         * Returns a new instance which has the entries sorted when they are enumerated.
         *
         * @param options Configurations to sort entries.
         */
        public sort(options: Options): RecoTwEntryCollection {
            var result = this.clone();
            if (!options) {
                return result;
            }
            var order = options.order || Order.Descending;
            var orderBy = options.orderBy || OrderBy.RecordedDate;
            var sortCallback = (x: any, y: any) => x - y;
            if (order === Order.Ascending) {
                if (orderBy === OrderBy.RecordedDate) {
                    result.enumerable = result.enumerable.orderBy(x => x.record_date);
                } else if (orderBy === OrderBy.CreatedDate) {
                    result.enumerable = result.enumerable.orderBy(x => x.tweet_id, sortCallback);
                }
            } else if (order === Order.Descending) {
                if (orderBy === OrderBy.RecordedDate) {
                    result.enumerable = result.enumerable.orderByDescending(x => x.record_date);
                } else if (orderBy === OrderBy.CreatedDate) {
                    result.enumerable = result.enumerable.orderByDescending(x => x.tweet_id, sortCallback);
                }
            } else if (order === Order.Shuffle) {
                result.enumerable = result.enumerable.shuffle();
            }
            return result;
        }

        /**
         * Returns a new instance which has the entries filtered when they are enumerated.
         *
         * @param options Configurations to filter entries.
         */
        public filter(options: Options): RecoTwEntryCollection {
            var result = this.clone();
            if (options === void 0 || options === null) {
                return result;
            }
            var re: RegExp;
            if (options.body !== void 0 && options.body.length > 0) {
                if (options.regex) {
                    try {
                        re = new RegExp(options.body, "i");
                    } catch (e) {
                        throw new Error(Resources.INCORRECT_REGEX);
                    }
                    result.enumerable = result.enumerable.where(x => re.test(x.content));
                } else {
                    options.body = options.body.toLowerCase();
                    result.enumerable = result.enumerable.where(x => x.content.toLowerCase().contains(options.body));
                }
            }
            if (options.usernames !== void 0 && options.usernames.length > 0) {
                result.enumerable = result.enumerable.where(x => options.usernames.some(y => x.target_sn.toLowerCase() === y.toLowerCase()));
            }
            if (options.id !== null) {
                result.enumerable = result.enumerable.where(x => x.tweet_id === options.id);
            }
            return result;
        }
    }

    /**
     * The model.
     */
    class Model {
        private static ALTERNATIVE_ICON_URL = "./images/none.png";
        private static TWITTER_STATUS_URL = "https://twitter.com/show/status/{0}";
        private static TWITTER_USER_URL = "https://twitter.com/{0}";
        private static TWITTER_PROFILE_IMAGE_URL = "http://www.paper-glasses.com/api/twipi/{0}/";
        private static RECOTW_GET_ALL_URL = "http://api.recotw.black/1/tweet/get_tweet_all";
        private static RECOTW_POST_URL = "http://api.recotw.black/1/tweet/record_tweet";
        private static RECOTW_COUNT_URL = "http://api.recotw.black/1/tweet/count_tweet";
        private static POLLING_INTERVAL = 20000;

        private static entries: RecoTwEntryCollection = null;
        private static statistics: RecoTwStatistics = null;
        private static pollingID: number = null;

        /**
         * Initializes the model, loads the entries from localStorage, and starts to download new entries.
         */
        public static init(): void {
            var entries: RecoTwEntry[] = [];
            var item = localStorage.getItem("entries");
            if (item) {
                entries = JSON.parse(item);
            }
            Model.getLatestEntries(entries).then(Controller.onEntriesLoaded, Controller.onEntriesLoadFailed);
        }

        /**
         * Save all the entries to localStorage.
         */
        public static save(): void {
            localStorage.setItem("entries", JSON.stringify(Model.entries.reset().getEnumerable().toArray()));
        }

        /**
         * Gets an entry by Tweet ID.
         *
         * @param id The ID of the Tweet.
         */
        public static getEntry(id: string): RecoTwEntry {
            if (Model.entries === null) {
                return null;
            } else {
                return Model.entries.getEnumerable().firstOrDefault(x => x.tweet_id === id);
            }
        }

        /**
         * Gets an object to enumerate filtered and sorted entries.
         */
        public static getEntries(): linqjs.IEnumerable<RecoTwEntry> {
            if (Model.entries === null) {
                return null;
            } else {
                return Model.entries.getEnumerable();
            }
        }

        /**
         * Gets a statistics information by current options. The data is cached if possible.
         *
         * @param username A username to filter.
         */
        public static getStatistics(): RecoTwStatistics {
            if (Model.entries === null) {
                return null;
            } else {
                return Model.statistics !== null ? Model.statistics : (Model.statistics = Model.entries.createStatistics());
            }
        }

        /**
         * Sets options to determine how to enumerate entries.
         *
         * @param options Configurations to enumerate entries.
         */
        public static setOptions(options: Options): void {
            if (Model.entries === null) {
                return null;
            }
            Model.entries = Model.entries.reset().sort(options).filter(options);
            Model.statistics = null;
        }

        /**
         * Validates an input as Tweet URL/ID or throws an error.
         *
         * @param input A string to validate.
         */
        public static validateURLorID(input: string): string {
            var match: RegExpMatchArray;
            if (input === void 0 || input === null || input.length === 0) {
                return null;
            } else if ((match = input.match(/^(?:(?:https?:\/\/(?:www\.|mobile\.)?)?twitter\.com\/(?:#!\/)?[a-zA-Z0-9_]+\/status(?:es)?\/(\d+)|(\d+))$/)) !== null) {
                return match[1] || match[2];
            } else {
                throw new Error(Resources.INCORRECT_URL_OR_ID);
            }
        }

        /**
         * Retrieves new entries from the remote.
         *
         * @param entries The entries to initialize with.
         */
        public static getLatestEntries(entries?: RecoTwEntry[]): JQueryPromise<RecoTwEntry[]> {
            var sinceID: number;
            if (Model.entries !== null) {
                sinceID = +Model.entries.reset().getEnumerable().lastOrDefault().id + 1;
            } else if (entries && entries.length > 0) {
                sinceID = +Enumerable.from(entries).lastOrDefault().id + 1;
            }

            var deferred = $.Deferred<RecoTwEntry[]>();
            $.ajax({
                url: Model.RECOTW_GET_ALL_URL,
                dataType: "json",
                data: { since_id: sinceID }
            }).done((data: RecoTwEntry[], status: string, xhr: JQueryXHR) => {
                if (Model.entries === null) {
                    Model.entries = new RecoTwEntryCollection(entries);
                }
                if (data.length > 0) {
                    Model.entries.addRange(Enumerable.from(data));
                }
                deferred.resolve(data);
            }).fail((xhr: JQueryXHR, status: string, e: Error) => {
                deferred.reject(xhr);
            });
            return deferred.promise();
        }

        /**
         * Registers a Tweet to RecoTw as an entry.
         *
         * @param input A URL or ID of a Tweet to register.
         */
        public static postEntriesFromInputs(inputs: string[]): JQueryPromise<RecoTwRecordResponse> {
            var deferred = $.Deferred<RecoTwRecordResponse>();
            var ids = inputs.map(x => Model.validateURLorID(x));
            $.ajax({
                url: this.RECOTW_POST_URL,
                type: "POST",
                data: {
                    id: ids[0],
                    /**
                     * [FUTURE] The following code is to send comma-separated ids for multiple entries registration.
                     */
                    //ids: ids.join(",")
                },
                dataType: "json"
            }).done((data: RecoTwRecordResponse, status: string, xhr: JQueryXHR) => {
                if (+data.id - 1 === +Model.entries.reset().getEnumerable().lastOrDefault().id) {
                    delete data.result;
                    Model.entries.addRange(Enumerable.make(data));
                    Controller.onNewEntries();
                }
                deferred.resolve(data);
            }).fail((xhr: JQueryXHR, status: string, e: Error) => {
                var response = <RecoTwErrorResponse>xhr.responseJSON;
                if (!response || !response.errors) {
                    deferred.reject(Resources.POST_ERRORS.UNKNOWN_ERROR);
                } else {
                    deferred.reject(Resources.POST_ERRORS[response.errors[0].code] || response.errors[0].message);
                }
            });
            return deferred.promise();
        }

        /**
         * Creates a Twitter status URL by the ID.
         *
         * @param id The ID of the Tweet.
         */
        public static createStatusURL(id: string): string;
        /**
         * Creates a Twitter status URL from an entry.
         *
         * @param entry An entry from which the URL to be created.
         */
        public static createStatusURL(entry: RecoTwEntry): string;
        /**
         * Creates a Twitter status URL.
         *
         * @param item An object that contains the ID of the Tweet or itself.
         */
        public static createStatusURL(item: string | RecoTwEntry): string {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_STATUS_URL, item);
            } else {
                if (item.target_sn !== void 0 && item.tweet_id !== void 0) {
                    return String.format(Model.TWITTER_STATUS_URL.replace(/show/, item.target_sn), item.tweet_id);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_STATUS_URL);
                }
            }
        }

        /**
         * Creates a Twitter user URL by the screen_name.
         *
         * @param screenName The screen_name of the user.
         */
        public static createUserURL(screenName: string): string;
        /**
         * Creates a Twitter user URL from an entry.
         *
         * @param entry An entry from which the URL to be created.
         */
        public static createUserURL(entry: RecoTwEntry): string;
        /**
         * Creates a Twitter user URL.
         *
         * @param item An object that contains the screen_name of the user, or itself.
         */
        public static createUserURL(item: string | RecoTwEntry): string {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_USER_URL, item);
            } else {
                if (item.target_sn !== void 0) {
                    return String.format(Model.TWITTER_USER_URL, item.target_sn);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_USER_URL);
                }
            }
        }

        /**
         * Creates a profile image URL by the ID.
         *
         * @param id The ID of the user.
         */
        public static createProfileImageURL(id: string): string;
        /**
         * Creates a profile image URL from an entry.
         *
         * @param entry An entry from which the URL to be created.
         */
        public static createProfileImageURL(entry: RecoTwEntry): string;
        /**
         * Creates a profile image URL.
         *
         * @param item An object that contains the screen_name of the user or itself.
         */
        public static createProfileImageURL(item: string | RecoTwEntry): string {
            if (item === null) {
                return Model.ALTERNATIVE_ICON_URL;
            } else if (typeof item === "string") {
                return String.format(Model.TWITTER_PROFILE_IMAGE_URL, item);
            } else {
                if (item.target_sn !== void 0) {
                    return String.format(Model.TWITTER_PROFILE_IMAGE_URL, item.target_sn);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_PROFILE_IMAGE_URL);
                }
            }
        }

        /**
         * Sets a search query string from options.
         *
         * @param options Options to create a search query.
         */
        public static setSearchQueryString(options: Options): void {
            if (history && history.pushState) {
                history.pushState(null, null, location.pathname + options.toQueryString());
            } else {
                location.hash = options.toQueryString().slice(1);
            }
        }

        /**
         * Starts polling to observe whether new entries would be registered or not.
         */
        public static startPolling(): void {
            if (Model.pollingID !== null) {
                return;
            }
            Model.pollingID = window.setInterval(() => Model.getLatestEntries().then(data => {
                if (data.length > 0) {
                    Controller.onNewEntries();
                }
            }), Model.POLLING_INTERVAL);
        }

        /**
         * Stops RecoTw polling.
         */
        public static stopPolling(): void {
            window.clearInterval(Model.pollingID);
            Model.pollingID = null;
        }
    }

    /**
     * The view.
     */
    class View {
        private static TWEETS_COUNT = 25;
        private static GRAPH_COLORS = [
            0xcccccc, 0x3366cc, 0xdc3912, 0xff9900, 0x109618, 0x990099, 0x0099c6, 0xdd4477,
            0x66aa00, 0xb82e2e, 0x316395, 0x994499, 0x22aa99, 0xaaaa11, 0x6633cc, 0xe67300,
            0x8b0707, 0x651067, 0x329262, 0x5574a6, 0x3b3eac, 0xb77322, 0x16d620, 0xb91383,
            0xf4359e, 0x9c5935, 0xa9c413, 0x2a778d, 0x668d1c, 0xbea413, 0x0c5922, 0x743411,
        ];
        private static GRAPH_OPTIONS = {
            backgroundColor: "#FEFEFE",
            chartArea: {
                width: "90%",
                height: "100%"
            },
            is3D: true,
            legend: "none",
            sliceVisibilityThreshold: 0.0099
        };
        private static chart: google.visualization.PieChart = null;
        private static current = 0;
        private static widgetID = -1;

        public static getTabFromID(id: string): Tab {
            switch (id) {
                case "home-tab":
                    return Tab.Home;
                case "statistics-tab":
                    return Tab.Statistics;
                default:
                    return Tab.None;
            }
        }

        public static getCurrentTab(): Tab {
            return View.getTabFromID($(".tab-pane.active").attr("id"));
        }

        public static setCurrentTab(tab: Tab): JQuery {
            switch (tab) {
                case Tab.Home:
                    return $("a[href='#home-tab']").tab("show");
                case Tab.Statistics:
                    return $("a[href='#statistics-tab]").tab("show");
                default:
                    return null;
            }
        }

        public static setTitle(title: string): void {
            if (location.hostname === "" || location.hostname === "localhost") {
                title = "[DEBUG] " + title;
            }
            document.title = title;
        }

        private static createTwitterCB(callback: (twttr: Twitter) => void): void {
            if (!twttr.widgets) {
                twttr.ready(callback);
            } else {
                callback(twttr);
            }
        }

        public static renderHome(): void {
            $("#no-result-container").hide();
            Controller.setLoadingState(false);

            var entries = Model.getEntries();
            if (entries.isEmpty()) {
                $("#no-result-container").fadeIn();
                return;
            }
            entries.skip(View.current).take(View.TWEETS_COUNT).forEach(entry => {
                View.createTwitterCB(() => {
                    twttr.widgets.createTweet(entry.tweet_id, $("#main-area")[0], { lang: "ja" }).then(((widgetID: number, entry: RecoTwEntry, element: Element) => {
                        if (!element) {
                            View.showStatusLoadFailedMessage(widgetID, entry);
                        } else {
                            $(element).contents().find(".standalone-tweet").css({ borderRadius: 0 });
                        }
                    }).bind(this, ++View.widgetID, entry));
                });
            });
            View.current += View.TWEETS_COUNT;
        }

        public static renderStatistics(username?: string): void {
            if (Model.getEntries() === null) {
                return;
            }

            var statistics = Model.getStatistics();
            $("#no-result-container").hide();

            if (View.chart === null) {
                View.chart = new google.visualization.PieChart($("#statistics-chart")[0]);
                google.visualization.events.addListener(View.chart, "click", Controller.onChartSliceClick);
            }

            if (username === void 0) {
                $("#statistics-count").text(String.format(Resources.STATISTICS_COUNT, statistics.entryLength));

                var options = Controller.getOptions();
                if (options.isFiltered()) {
                    $("#statistics-filter").text(String.format(Resources.SEARCH_RESULT, options.toKeywords()));
                } else {
                    $("#statistics-filter").text("");
                }

                if (statistics.entryLength === 0) {
                    $("#statistics-chart").hide();
                    $("#no-result-container").fadeIn();
                    return;
                } else {
                    $("#statistics-chart").show();
                }

                View.chart.draw(statistics.dataTable, View.GRAPH_OPTIONS);
            }

            View.renderStatisticsTable(username, statistics);
        }

        private static renderStatisticsTable(username: string, statistics: RecoTwStatistics): void {
            // Counts colored slices in the chart.
            var colored = statistics.users.filter(x => x.count / statistics.entryLength > View.GRAPH_OPTIONS.sliceVisibilityThreshold).length;
            var $table = $("#statistics-table").empty();
            var html = "";
            username = username !== void 0 ? username.toLowerCase() : void 0;
            var isTarget = (x: string) => username === void 0 || x.toLowerCase().startsWith(username);

            for (var i = 0; i < colored; i++) {
                if (!isTarget(statistics.users[i].target_sn)) {
                    continue;
                }
                html += String.format(Resources.STATISTICS_TABLE_HTML, View.GRAPH_COLORS[i + 1], statistics.users[i].target_sn, statistics.users[i].count, statistics.users[i].count / statistics.entryLength);
            }
            for (var i = colored; i < statistics.users.length; i++) {
                if (!isTarget(statistics.users[i].target_sn)) {
                    continue;
                }
                html += String.format(Resources.STATISTICS_TABLE_HTML, View.GRAPH_COLORS[0], statistics.users[i].target_sn, statistics.users[i].count, statistics.users[i].count / statistics.entryLength);
            }
            if (html.length === 0) {
                $table.append(Resources.NO_RESULT);
            } else {
                $table.append(html);
            }
        }

        public static clearHome(): void {
            View.current = 0;
            $("#main-area").empty();
        }

        public static setSearchKeywords(options: Options): void {
            $("#search-box").val(options.toKeywords());
        }

        public static postEntries(): void {
            var inputs: string[] = $("#new-record-modal input[type='text']").map(function () { return $(this).val(); }).get();
            try {
                Model.postEntriesFromInputs(inputs.filter(x => x.length > 0)).then(View.showPostSuccessMessage, View.showPostFailedMessage);
                $("#new-record-modal").modal("hide");
            } catch (e) {
                $("#inputPostStatus").val("").focus();
                $("#new-record-modal .modal-dialog").shake(2, 18, 300);
            }
        }

        private static showPostSuccessMessage(response: RecoTwRecordResponse): void {
            var $elm = $("#post-result");
            $elm.hide();
            $elm[0].className = "alert alert-success";
            $("#post-failed").hide();
            $("#post-success").show();
            $elm.fadeIn();
        }

        private static showPostFailedMessage(error: string): void {
            var $elm = $("#post-result");
            $elm.hide();
            $elm[0].className = "alert alert-danger";
            $("#post-success").hide();
            $("#post-failed").show();
            $("#post-failed-reason").text(error);
            $elm.fadeIn();
        }

        private static replaceLinkToURL(target: string) {
            return target.replace(/[\r\n]/g, "<br>").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, s => String.format(Resources.LINK_TO_URL_HTML, s));
        }

        public static showStatusLoadFailedMessage(widgetID: number, entry: RecoTwEntry): void {
            $("#twitter-widget-" + widgetID).after(String.format(Resources.TWEET_REMOVED_HTML, Model.createStatusURL(entry), Model.createProfileImageURL(entry), Model.createUserURL(entry), entry.target_sn, View.replaceLinkToURL(entry.content)))
                                            .remove();
        }
    }

    /**
     * The controller.
     */
    export class Controller {
        private static options = new Options();
        private static loading = false;
        private static homeRendered = false;
        private static statisticsRendered = false;

        public static getOptions(): Options {
            return Controller.options;
        }

        public static setOptions(options: Options, sortOnly: boolean, setQuery: boolean, setKeywords: boolean): void {
            try {
                Model.setOptions(Controller.options = options);
            } catch (e) {
                console.log(e.message);
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
                View.setTitle(String.format(Resources.PAGE_TITLE_SEARCH_RESULT, options.toKeywords()));
            } else {
                $("#clear-search-filter").hide();
                View.setTitle(Resources.PAGE_TITLE_NORMAL);
            }

            $("#statistics-filter-textbox").val("");
            if (Model.getEntries() === null) {
                return;
            }

            var current = View.getCurrentTab();
            if (current === Tab.Statistics) {
                View.clearHome();
                if (sortOnly) {
                    Controller.homeRendered = false;
                } else {
                    Controller.reload();
                }
            } else {
                Controller.reload();
            }
        }

        public static setLoadingState(state: boolean) {
            Controller.loading = state;
        }

        public static main(): void {
            View.setTitle(Resources.PAGE_TITLE_NORMAL);
            $("#app-version").text(APP_VERSION);
            if (navigator.standalone) {
                $(document.body).addClass("standalone");
            }

            Model.init();
            google.load("visualization", "1.0", { "packages": ["corechart"] });
            $("#loading-recotw").show();

            Controller.setOptions(Options.fromQueryString(location.search, Order.Descending, OrderBy.RecordedDate), false, false, true);

            $(window).unload(Model.save);
            $(window).bottom({ proximity: 0.05 });
            $(window).on("bottom",() => {
                if (View.getCurrentTab() === Tab.Home) {
                    Controller.onPageBottom();
                }
            });
            $(".navbar-nav a[role='tab']").on("shown.bs.tab", $event => {
                var getTab = (tab: HTMLAnchorElement) => View.getTabFromID(tab.href.substring(tab.href.lastIndexOf("#") + 1));
                Controller.onTabSwitched(getTab(<HTMLAnchorElement>$event.relatedTarget), getTab(<HTMLAnchorElement>$event.target));
            });
            $("#clear-search-filter").click(() => {
                Controller.setOptions(new Options(), false, true, true);
            });
            $("[id^='order-by-']").change(() => {
                Controller.options.order = Controller.getOrder();
                Controller.options.orderBy = Controller.getOrderBy();
                Controller.setOptions(Controller.options, true, false, false);
            });
            $("#order-shuffle").click(() => {
                Controller.options.order = Controller.getOrder();
                Controller.setOptions(Controller.options, true, false, false);
            });
            $("#search-form").submit($event => {
                $event.preventDefault();
                Controller.setOptions(Options.fromKeywords($("#search-box").val(), Controller.getOrder(), Controller.getOrderBy()), false, true, false);
            });
            $("#search-form-toggle-button").click(function () {
                var $this = $(this);
                var $elm = $("#search-form");
                if ($this.hasClass("active")) {
                    $this.removeClass("active");
                    $elm.css({ display: "" });
                } else {
                    $this.addClass("active");
                    $elm.css({ cssText: "display: block !important" });
                }
            });
            $(window).on("popstate",() => {
                Controller.setOptions(Options.fromQueryString(location.search, Controller.getOrder(), Controller.getOrderBy()), false, false, true);
            });
            $("#reload-entries-link").click(() => {
                $("#polling-result, #post-result").fadeOut();
                Controller.showNewStatuses();
            });
            $("#new-record-form").submit($event => {
                $event.preventDefault();
                View.postEntries();
            });
            $("#new-record-modal").on("shown.bs.modal",() => {
                $("#new-record-form .url-box").focus();
            });
            $("#new-record-modal").on("hidden.bs.modal",() => {
                $("#new-record-form .modal-body").empty().html(Resources.URL_INPUT_AREA);
            });
            $("#post-result-close").click(() => {
                $("#post-result").fadeOut();
            });
            $("#polling-result-close").click(() => {
                $("#polling-result").fadeOut();
            });
            $("#statistics-filter-textbox").on("keyup change", function () {
                Controller.setChartFilterByUsername($(this).val());
            });
            $("#search-box").popover({
                placement: "bottom",
                html: true,
                content: Resources.SEARCH_HELP_HTML
            }).blur(function () {
                $(this).popover("hide");
            }).keydown(function ($event) {
                if ($event.keyCode === 13 || $event.keyCode === 27) {
                    $(this).popover("hide");
                }
            });
        }

        public static getOrder(): Order {
            return $(".order-radio-box:checked").data("order");
        }

        public static getOrderBy(): OrderBy {
            return $(".order-radio-box:checked").data("order-by");
        }

        public static reload(): void {
            if (Model.getEntries() === null) {
                return;
            }
            switch (View.getCurrentTab()) {
                case Tab.Home:
                    View.clearHome();
                    View.renderHome();
                    $("#statistics-filter-textbox").val("");
                    Controller.homeRendered = true;
                    Controller.statisticsRendered = false;
                    break;
                case Tab.Statistics:
                    View.renderStatistics();
                    Controller.homeRendered = false;
                    Controller.statisticsRendered = true;
                    break;
            }
        }

        public static onEntriesLoaded(): void {
            $("#loading-recotw").fadeOut();
            $("#loading-panel-container").fadeOut();
            if (Model.getEntries() === null) {
                return;
            }
            Model.startPolling();
            Controller.setOptions(Controller.options, false, false, true);
        }

        public static onEntriesLoadFailed(): void {
            $("#loading-panel").fadeOut().promise().done(() => $("#loading-error-panel").fadeIn());
        }

        public static onNewEntries(): void {
            $("#polling-result").fadeIn();
        }

        public static isMobile(): boolean {
            return /iPhone|iPod|Android.*Mobile|Windows.*Phone/.test(navigator.userAgent);
        }

        public static onTabSwitched(previous: Tab, current: Tab): void {
            switch (current) {
                case Tab.Home:
                    if (!Controller.homeRendered) {
                        View.renderHome();
                        Controller.homeRendered = true;
                    }
                    break;
                case Tab.Statistics:
                    if (!Controller.isMobile()) {
                        $("#statistics-filter-textbox").focus();
                        window.setTimeout(() => $("#statistics-table").animate({ scrollTop: 0 }, 400), 100);
                    }
                    if (!Controller.statisticsRendered) {
                        View.renderStatistics();
                        Controller.statisticsRendered = true;
                    }
                    break;
            }
        }

        public static onPageBottom(): void {
            if (Controller.loading) {
                return;
            }
            Controller.loading = true;
            View.renderHome();
        }

        public static onImageError(element: HTMLImageElement) {
            element.src = Model.createProfileImageURL(null);
        }

        public static onChartSliceClick(slice: any): void {
            var id = <string>slice.targetID;
            if (!id.contains("#")) {
                return;
            }
            Controller.setSearchFilterByUsername(Model.getStatistics().users[+id.substring(id.indexOf("#") + 1)].target_sn);
        }

        private static onNewRecordFormTextBoxValueChanged(): void {
            var $elements = $(".url-input-area");
            var inputs: string[] = $(".url-box").map(function () { return $(this).val(); }).get();

            $elements.each(function (index) {
                $(this).removeClass("has-success has-error");
                try {
                    if (Model.validateURLorID(inputs[index]) !== null) {
                        $(this).addClass("has-success");
                    }
                } catch (e) {
                    $(this).addClass("has-error");
                }
            });

            /**
             * [FUTURE] The following code is to increase text boxes for multiple entries registration.
             */
            //if (inputs[inputs.length - 1] !== "") {
            //    $("#new-record-form .modal-body").append(Resources.URL_INPUT_AREA);
            //} else if (inputs.length >= 2 && inputs[inputs.length - 2] === "") {
            //    $("#new-record-form .url-input-area").eq(inputs.length - 1).remove();
            //    $(".url-box").last().focus();
            //}
        }

        public static setSearchFilterByUsername(username: string) {
            View.setCurrentTab(Tab.Home);
            Controller.options.usernames = [username];
            Controller.setOptions(Controller.options, false, true, true);
        }

        private static setChartFilterByUsername(username: string) {
            View.renderStatistics(username);
        }

        public static showNewStatuses(): void {
            View.setCurrentTab(Tab.Home);
            Controller.setOptions(new Options([], "", null, false, Controller.options.order, Controller.options.orderBy), false, true, true);
            Controller.reload();
        }
    }

    Controller.main();
}
