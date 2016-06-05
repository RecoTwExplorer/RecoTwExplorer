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
 * - favico.js
 */

module RecoTwExplorer {
    "use strict";
    const APP_NAME = "RecoTw Explorer";
    const APP_VERSION = "2.50";
    const APP_URL = location.protocol + "//" + location.host + location.pathname;

    /*
     * Bootstrap jQuery Shake Effect snippet - pAMmDzOfnL
     * http://www.bootply.com/60873
     */
    $.fn.shake = function (shakes: number, distance: number, duration: number): JQuery {
        return (<JQuery>this).each(function () {
            const $this = $(this);
            for (let i = 0; i < shakes; i++) {
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
     * The resources for UI.
     */
    class Resources {
        public static INCORRECT_REGEX = "指定された正規表現は正しくありません";
        public static INCORRECT_URL_OR_ID = "指定された URL または ID は正しくありません";
        public static ALREADY_REGISTERED = "すでに登録されているツイートです";
        public static REGISTRATION_AVAILABLE = "このツイートは登録可能です";
        public static REGISTRATION_DEFAULT = "ツイートの ID または URL を指定します";
        public static BADGE_NOT_SUPPORTED = "通知バッジがサポートされていません";
        public static FAILED_TO_GENERATE_STATUS_URL = "ツイートの URL を生成できません";
        public static FAILED_TO_GENERATE_USER_URL = "ユーザーへの URL を生成できません";
        public static FAILED_TO_GENERATE_PROFILE_IMAGE_URL = "プロフィール画像の URL を生成できません";
        public static FAILED_TO_LOAD_EMBEDDED_TWEET = "Twitter 埋め込みツイートの読み込みに失敗しました";
        public static REGISTER_NEW_TWEET = "ツイートの ID または URL:";
        public static REGISTRATION_FAILED_HTML = "<strong>登録失敗</strong><br>{0}";
        public static SEARCH_HELP_HTML = "<dl><dt>ツイート検索</dt><dd><code>/</code> と <code>/</code> で囲むと正規表現検索</dd><dt>ユーザー名検索</dt><dd><code>from:</code> でユーザーを検索<br>カンマ区切りで複数入力</dd><dt>ID 検索</dt><dd><code>id:</code> で ID 検索</dd></dl>";
        public static STATISTICS_TABLE_HTML = "<span class=\"statistics-table-header\" style=\"border-color: #{0:X6};\"><a href=\"{4}\">{1}</a> ({2})&nbsp;&nbsp;&ndash;&nbsp;&nbsp;{3:P1}</span><br>";
        public static TWEET_TIME_HTML = "<a href=\"{0}\" target=\"_blank\"><time datetime=\"{2}\" title=\"投稿時刻: {1:U} (UTC)\">{1:yyyy年M月d日 HH:mm}</time></a>";
        public static TWEET_REMOVED_HTML = "<blockquote>ツイートは削除されたか、または非公開に設定されています。<hr><div><img src=\"{0}\"><span><a href=\"{1}\" target=\"_blank\">@{2}</a></span><p>{3}</p><p class=\"tweet-date\">{4}</p></div></blockquote>";
        public static LINK_TO_URL_HTML = "<a href=\"{0}\" target=\"_blank\">{0}</a>";
        public static URL_INPUT_AREA = $("#new-record-form .modal-body").html();
        public static URL_INPUT_REGEX = new RegExp($(".url-box").attr("pattern"));
        public static USERNAME = "ユーザ名";
        public static TWEETS_COUNT = "ツイート数";
        public static NO_RESULT = "<p class=\"text-center\" style=\"margin-top: 200px;\">該当ユーザーなし</p>";
        public static SEARCH_RESULT = "検索結果: {0}";
        public static STATISTICS_COUNT = "({0:N0} 件)";
        public static STATISTICS_COUNT_FILTERED = "({0:N0} / {1:N0} 件)";
        public static PAGE_TITLE_SEARCH_RESULT = "検索結果: {0} - " + APP_NAME;
        public static PAGE_TITLE_NORMAL = APP_NAME;
        public static POST_ERRORS: {
            [code: string]: string;
            UNKNOWN_ERROR: string;
        } = {
            "400": "パラメーターが正しくありません",
            "403": "ツイートの取得に失敗しました",
            "404": "指定されたツイートは存在しません",
            "500": Resources.ALREADY_REGISTERED,
            "503": "サーバーで問題が発生しています",
            UNKNOWN_ERROR: "原因不明のエラーです"
        };
    }

    /**
     * Configurations to filter and sort entries.
     */
    class Options {
        /**
         * Initializes a new instance of a Options class with parameters.
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
            const queries: string[] = [];
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
            const keywords: string[] = [];
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
         * @param queryString A query string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        public static fromQueryString(queryString: string, order: Order, orderBy: OrderBy): Options {
            const options = new Options([], "", null, false, order, orderBy);
            if (queryString.length === 0 || queryString === "?") {
                return options;
            }
            const queries = queryString.substring(1).split("&").map(x => x.split("="))
                                                               .filter(x => x.length === 2)
                                                               .map(x => ({ property: x[0], value: decodeURIComponent(x[1]) }));

            queries.filter(x => x.property === "body").forEach(x => {
                let match: RegExpMatchArray;
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
         * @param keywords A keywords string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        public static fromKeywords(keywords: string, order: Order, orderBy: OrderBy): Options {
            const options = new Options([], "", null, false, order, orderBy);
            const value = keywords.split(" ");
            let match: RegExpMatchArray;

            for (let i = 0; i < value.length; i++) {
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
        private _length: number;
        private _users: RecoTwUser[];
        private _table: google.visualization.DataTable;

        public get length(): number {
            return this._length;
        }

        public get users(): RecoTwUser[] {
            return this._users;
        }

        public get table(): google.visualization.DataTable {
            return this._table;
        }

        /**
         * Initializes a new instance of RecoTwStatistics class with parameters.
         * @param enumrable An object to enumerate the entries.
         */
        public constructor(enumerable: linqjs.IEnumerable<RecoTwEntry>) {
            this._length = enumerable.count();
            this._users = enumerable.groupBy(x => x.target_id)
                                    .select(x => ({ entry: x.firstOrDefault(), count: x.count() }))
                                    .select(x => ({ target_sn: x.entry.target_sn, count: x.count, percentage: x.count / this._length }))
                                    .orderByDescending(x => x.count)
                                    .thenBy(x => x.target_sn.toLowerCase())
                                    .toArray();

            this._table = new google.visualization.DataTable({
                cols: [
                    { type: "string", label: Resources.USERNAME },
                    { type: "number", label: Resources.TWEETS_COUNT }
                ],
                rows: this.users.map(x => ({ c: [{ v: x.target_sn }, { v: x.count }] }))
            });
        }
    }

    /**
     * The collection of RecoTw Entries.
     */
    class RecoTwEntryCollection {
        private _elements: RecoTwEntry[];
        private _userIDs: linqjs.IDictionary<string, string>;
        private _enumerable: linqjs.IEnumerable<RecoTwEntry>;

        /**
         * Initializes a new instance of RecoTwEntryCollection class with parameters.
         * @param elements All the entries.
         * @param userIDs A unique hash set of screen_names and user IDs.
         * @param enumerable An object to enumerate the entries.
         */
        public constructor(elements: RecoTwEntry[], userIDs?: linqjs.IDictionary<string, string>, enumerable?: linqjs.IEnumerable<RecoTwEntry>) {
            this._elements = elements || [];
            this._userIDs = userIDs || null;
            this._enumerable = enumerable || Enumerable.from(elements);

            if (userIDs === null) {
                // Override all of target_sn values with the latest ones.
                this._userIDs = this.enumerable.orderByDescending(x => x.tweet_id, (x: any, y: any) => x - y).toDictionary(x => x.target_id, x => x.target_sn);
                this.enumerable.forEach(x => x.target_sn = this._userIDs.get(x.target_id));
            }
        }

        /**
         * Gets a number of all the entries.
         */
        public get length(): number {
            return this._elements.length;
        }

        /**
         * Gets an object to enumerate the entries.
         */
        public get enumerable(): linqjs.IEnumerable<RecoTwEntry> {
            return this._enumerable;
        }

        /**
         * Adds an item to the entries.
         * @param item The item to add.
         */
        public add(item: RecoTwEntry): void {
            if (!item) {
                throw new Error();
            }
            if (this._elements.length === 0 || +item.id > +this._elements[this._elements.length - 1].id) {
                this._elements[this._elements.length] = item;
            }
        }

        /**
         * Adds items to the entries.
         * @param items The items to add.
         */
        public addRange(items: linqjs.IEnumerable<RecoTwEntry> | RecoTwEntry[]): void {
            items.forEach(this.add.bind(this));
        }

        /**
         * Returns a copy of this instance.
         */
        public clone(): RecoTwEntryCollection {
            return new RecoTwEntryCollection(this._elements, this._userIDs, this.enumerable);
        }

        /**
         * Returns a new instance which has the same elements.
         */
        public reset(): RecoTwEntryCollection {
            return new RecoTwEntryCollection(this._elements, this._userIDs);
        }

        /**
         * Creates a statistics information by current entries.
         */
        public createStatistics(): RecoTwStatistics {
            return new RecoTwStatistics(this.enumerable);
        }

        /**
         * Returns a new instance which has the entries sorted when they are enumerated.
         * @param options Configurations to sort entries.
         */
        public sort(options: Options): RecoTwEntryCollection {
            const result = this.clone();
            if (!options) {
                return result;
            }
            const order = options.order || Order.Descending;
            const orderBy = options.orderBy || OrderBy.RecordedDate;
            const sortCallback = (x: any, y: any) => x - y;
            switch (true) {
                case order === Order.Ascending && orderBy === OrderBy.RecordedDate:
                    result._enumerable = result.enumerable.orderBy(x => x.record_date);
                    break;
                case order === Order.Ascending && orderBy === OrderBy.CreatedDate:
                    result._enumerable = result.enumerable.orderBy(x => x.tweet_id, sortCallback);
                    break;
                case order === Order.Descending && orderBy === OrderBy.RecordedDate:
                    result._enumerable = result.enumerable.orderByDescending(x => x.record_date);
                    break;
                case order === Order.Descending && orderBy === OrderBy.CreatedDate:
                    result._enumerable = result.enumerable.orderByDescending(x => x.tweet_id, sortCallback);
                    break;
                case order === Order.Shuffle:
                    result._enumerable = result.enumerable.shuffle();
                    break;
            }
            return result;
        }

        /**
         * Returns a new instance which has the entries filtered when they are enumerated.
         * @param options Configurations to filter entries.
         */
        public filter(options: Options): RecoTwEntryCollection {
            const result = this.clone();
            if (options === void 0 || options === null) {
                return result;
            }
            if (options.body !== void 0 && options.body.length > 0) {
                if (options.regex) {
                    try {
                        const re = new RegExp(options.body, "i");
                        result._enumerable = result.enumerable.where(x => re.test(x.content));
                    } catch (e) {
                        throw new Error(Resources.INCORRECT_REGEX);
                    }
                } else {
                    result._enumerable = result.enumerable.where(x => x.content.toLowerCase().contains(options.body.toLowerCase()));
                }
            }
            if (options.usernames !== void 0 && options.usernames.length > 0) {
                result._enumerable = result.enumerable.where(x => options.usernames.some(y => x.target_sn.toLowerCase() === y.toLowerCase()));
            }
            if (options.id !== null) {
                result._enumerable = result.enumerable.where(x => x.tweet_id === options.id);
            }
            return result;
        }

        /**
         * Returns a new instance which memorizes the enumerator.
         */
        public memoize(): RecoTwEntryCollection {
            const result = this.clone();
            result._enumerable = result.enumerable.memoize();
            return result;
        }
    }

    /**
     * Provides interface for notification.
     */
    class NotificationManager {
        private _length = 0;
        private _favico: Favico = null;

        public constructor() {
            this._favico = new Favico({ animation: "slide" });
        }

        /**
         * Gets a number of notifications.
         */
        public get length(): number {
            return this._length;
        }

        /**
         * Creates a notification.
         * @param A number of notifications to create.
         */
        public create(count: number): void {
            this._length += count;
            try {
                this._favico.badge(this._length);
            } catch (e) {
                console.log(e.message);
            }
        }

        /**
         * Clears all of the notifications.
         */
        public clear(): void {
            this._length = 0;
            try {
                this._favico.reset();
            } catch (e) {
                console.log(e.message);
            }
        }
    }

    /**
     * The model.
     */
    class Model {
        private static ALTERNATIVE_ICON_URL = "./images/none.png";
        private static TWITTER_STATUS_URL = "https://twitter.com/show/status/{0}";
        private static TWITTER_USER_URL = "https://twitter.com/{0}";
        private static TWITTER_PROFILE_IMAGE_URL = "/api/icon/{0}/";
        private static RECOTW_GET_ALL_URL = "/api/recotw/1/tweet/get_tweet_all";
        private static RECOTW_POST_URL = "/api/recotw/1/tweet/record_tweet";
        private static RECOTW_COUNT_URL = "/api/recotw/1/tweet/count_tweet";
        private static POLLING_INTERVAL = 20000;
        private static TWITTER_SNOWFLAKE_EPOCH = 1288834974657;

        private static _entries: RecoTwEntryCollection = null;
        private static _statistics: RecoTwStatistics = null;
        private static _notification: NotificationManager = null;
        private static _pollingID: number = null;

        /**
         * Initializes the model, loads the entries from localStorage, and starts to download new entries.
         */
        public static init(): void {
            Model.load();
        }

        /**
         * Loads entries from localStorage and fetch new ones.
         */
        private static load(): void {
            let entries: RecoTwEntry[] = [];
            const item = localStorage ? localStorage.getItem("entries") : null;
            const raw = localStorage ? localStorage.getItem("raw") : false;
            if (item && raw) {
                entries = JSON.parse(item);
            }
            Model.fetchLatestEntries(entries).then(Controller.onEntriesLoaded, Controller.onEntriesLoadFailed);
        }

        /**
         * Saves all the entries to localStorage.
         */
        public static save(): void {
            if (localStorage && Model.entries) {
                localStorage.setItem("raw", JSON.stringify(true));
                localStorage.setItem("entries", JSON.stringify(Model.entries.reset().enumerable.toArray()));
            }
        }

        /**
         * Gets an object to enumerate filtered and sorted entries.
         */
        public static get entries(): RecoTwEntryCollection {
            if (Model._entries === null) {
                return null;
            } else {
                return Model._entries;
            }
        }

        /**
         * Gets the latest entry on memory or returns null.
         */
        public static get latestEntry(): RecoTwEntry {
            if (Model.entries === null) {
                return null;
            } else {
                return Model.entries.reset().enumerable.lastOrDefault();
            }
        }

        /**
         * Gets a statistics information by current options. The data is cached if possible.
         */
        public static get statistics(): RecoTwStatistics {
            if (Model.entries === null) {
                return null;
            } else {
                return Model._statistics !== null ? Model._statistics : (Model._statistics = Model.entries.createStatistics());
            }
        }

        /**
         * Gets a notification manager.
         */
        public static get notification(): NotificationManager {
            return Model._notification !== null ? Model._notification : (Model._notification = new NotificationManager());
        }

        /**
         * Sets options to determine how to enumerate entries.
         * @param options Configurations to enumerate entries.
         */
        public static set options(options: Options) {
            if (Model.entries === null) {
                return;
            }
            Model._entries = Model.entries.reset().sort(options).filter(options).memoize();
            Model._statistics = null;
        }

        /**
         * Gets a value that determines if the app is running on a mobile device.
         */
        public static isMobile(): boolean {
            return /iPhone|iP[ao]d|Android|Windows.*Phone/.test(navigator.userAgent);
        }

        /**
         * Creates IDs from Tweet URL/IDs or throws an error.
         * @param inputs An array of URLs/IDs.
         */
        public static createIDfromURL(inputs: string[]): string[];
        /**
         * Creates an ID from a Tweet URL/ID or throws an error.
         * @param input A string of a URL/ID.
         */
        public static createIDfromURL(input: string): string;
        /**
         * Creates ID(s) from Tweet URL/ID(s) or throws an error.
         * @param input A string or array to input.
         */
        public static createIDfromURL(input: string | string[]): any {
            let match: RegExpMatchArray;
            if (input === void 0 || input === null || input.length === 0) {
                return null;
            } else if (typeof input === "string") {
                if ((match = input.match(Resources.URL_INPUT_REGEX)) !== null) {
                    return match[1] || match[2];
                }
            } else if (Array.isArray(input)) {
                const ids = input.map(Model.createIDfromURL);
                if (!ids.every(x => x === null)) {
                    return ids;
                }
            }
            throw new Error(Resources.INCORRECT_URL_OR_ID);
        }

        /*
         * Escapes a string as HTML.
         * @param str The string to escape.
         */
        public static escapeHtml(str: string): string {
            return str.replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
        }

        /*
         * Unescapes an HTML string.
         * @param str The string to unescape.
         */
        public static unescapeHtml(str: string): string {
            return str.replace(/&lt;/g, "<")
                      .replace(/&gt;/g, ">")
                      .replace(/&amp;/g, "&");
        }

        /**
         * Retrieves new entries from the remote.
         * @param entries The entries to initialize with.
         */
        public static fetchLatestEntries(entries?: RecoTwEntry[]): JQueryPromise<RecoTwEntry[]> {
            let sinceID: number;
            if (Model.entries !== null) {
                sinceID = +Model.latestEntry.id + 1;
            } else if (entries && entries.length > 0) {
                sinceID = +entries[entries.length - 1].id + 1;
            }

            const deferred = $.Deferred<RecoTwEntry[]>();
            $.ajax({
                url: Model.RECOTW_GET_ALL_URL,
                dataType: "json",
                data: { since_id: sinceID }
            }).done((data: RecoTwEntry[], status: string, xhr: JQueryXHR) => {
                if (Model.entries === null) {
                    Model._entries = new RecoTwEntryCollection(entries);
                }
                data.forEach(x => x.content = Model.unescapeHtml(x.content));
                if (data.length > 0) {
                    Model.entries.addRange(data);
                }
                deferred.resolve(data);
            }).fail((xhr: JQueryXHR, status: string, e: Error) => {
                deferred.reject(xhr);
            });
            return deferred.promise();
        }

        /**
         * Registers a Tweet with RecoTw as a new entry.
         * @param input A URL or ID of a Tweet to register.
         */
        public static registerEntries(inputs: string[]): JQueryPromise<RecoTwRecordResponse> {
            const deferred = $.Deferred<RecoTwRecordResponse>();
            const ids = Model.createIDfromURL(inputs);
            $.ajax({
                url: this.RECOTW_POST_URL,
                type: "POST",
                data: {
                    id: ids[0]
                    /**
                     * [FUTURE] The following code is to send comma-separated ids for multiple entries registration.
                     */
                    // ids: ids.join(",")
                },
                dataType: "json"
            }).done((data: RecoTwRecordResponse, status: string, xhr: JQueryXHR) => {
                if (+data.id === +Model.latestEntry.id + 1) {
                    delete data.result;
                    Model.entries.add(data);
                    Controller.onNewEntries(1);
                }
                deferred.resolve(data);
            }).fail((xhr: JQueryXHR, status: string, e: Error) => {
                const response = <RecoTwErrorResponse>xhr.responseJSON;
                if (!response || !response.errors) {
                    deferred.reject(Resources.POST_ERRORS.UNKNOWN_ERROR);
                } else {
                    deferred.reject(Resources.POST_ERRORS[response.errors[0].code] || response.errors[0].message);
                }
            });
            return deferred.promise();
        }

        /**
         * Creates a Twitter status URL by ID.
         * @param id The ID of a Tweet.
         */
        public static createStatusURL(id: string): string;
        /**
         * Creates a Twitter status URL from an entry.
         * @param entry An entry from which the URL to be created.
         */
        public static createStatusURL(entry: RecoTwEntry): string;
        /**
         * Creates a Twitter status URL.
         * @param item An object that contains the ID of the Tweet or itself.
         */
        public static createStatusURL(item: string | RecoTwEntry): string {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_STATUS_URL, item);
            } else {
                if (item.target_sn !== void 0 && item.tweet_id !== void 0) {
                    return String.format(Model.TWITTER_STATUS_URL.replace("show", item.target_sn), item.tweet_id);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_STATUS_URL);
                }
            }
        }

        /**
         * Creates a Twitter user URL by screen_name.
         * @param screenName The screen_name of a user.
         */
        public static createUserURL(screenName: string): string;
        /**
         * Creates a Twitter user URL from an entry.
         * @param entry An entry from which the URL to be created.
         */
        public static createUserURL(entry: RecoTwEntry): string;
        /**
         * Creates a Twitter user URL.
         * @param item An object that contains the screen_name of the user, or itself.
         */
        public static createUserURL(item: string | RecoTwEntry): string {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_USER_URL, item);
            } else {
                if (item.target_sn !== void 0) {
                    return Model.createUserURL(item.target_sn);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_USER_URL);
                }
            }
        }

        /**
         * Creates a profile image URL by ID.
         * @param id The ID of a user.
         */
        public static createProfileImageURL(id: string): string;
        /**
         * Creates a profile image URL from an entry.
         * @param entry An entry from which the URL to be created.
         */
        public static createProfileImageURL(entry: RecoTwEntry): string;
        /**
         * Creates a profile image URL.
         * @param item An object that contains the screen_name of the user or itself.
         */
        public static createProfileImageURL(item: string | RecoTwEntry): string {
            if (item === null) {
                return Model.ALTERNATIVE_ICON_URL;
            } else if (typeof item === "string") {
                return String.format(Model.TWITTER_PROFILE_IMAGE_URL, item);
            } else {
                if (item.target_sn !== void 0) {
                    return Model.createProfileImageURL(item.target_sn);
                } else {
                    throw new Error(Resources.FAILED_TO_GENERATE_PROFILE_IMAGE_URL);
                }
            }
        }

        /**
         * Creates a Date objcet by ID.
         * @param id The ID of a Tweet.
         */
        public static createDateByTweetID(id: string): Date;
        /**
         * Creates a Date object from an entry.
         * @param entry An entry from which the ID to be created.
         */
        public static createDateByTweetID(entry: RecoTwEntry): Date;
        /**
         * Creates a Date object.
         * @param item An object that contains the ID or itself.
         */
        public static createDateByTweetID(item: string | RecoTwEntry): Date {
            if (typeof item === "string") {
                // Using String conversion because JavaScript converts a Number to a 32-bit integer to perform shift operation; this is mostly same as following code:
                // new Date(((+item) >> 22) + Model.TWITTER_SNOWFLAKE_EPOCH);
                const binary = (+item).toString(2);
                return new Date(parseInt(binary.substr(0, binary.length - 22), 2) + Model.TWITTER_SNOWFLAKE_EPOCH);
            } else {
                if (item.tweet_id !== void 0) {
                    return Model.createDateByTweetID(item.tweet_id);
                } else {
                    return null;
                }
            }
        }

        /**
         * Sets a search query string from options.
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
            if (Model._pollingID !== null) {
                return;
            }
            Model._pollingID = window.setInterval(() => {
                Model.fetchLatestEntries().done((data: RecoTwEntry[]) => {
                    if (data.length > 0) {
                        Controller.onNewEntries(data.length);
                    }
                }).fail((xhr: JQueryXHR) => {
                    console.log(xhr);
                });
            }, Model.POLLING_INTERVAL);
        }

        /**
         * Stops RecoTw polling.
         */
        public static stopPolling(): void {
            window.clearInterval(Model._pollingID);
            Model._pollingID = null;
        }
    }

    /**
     * A tab.
     */
    class Tab {
        private _id: string;
        private _$element: JQuery;

        public rendered: boolean;
        public static home: HomeTab;
        public static statistics: StatisticsTab;

        public constructor(id: string) {
            this._id = id;
            this._$element = $("a[href='#" + id + "']").on("shown.bs.tab", () => {
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
    class HomeTab extends Tab {
        private static TWEETS_COUNT = 25;

        private _current = 0;

        public constructor() {
            super("home-tab");
        }

        public render(next?: boolean, count?: number) {
            if (!next && !count && this.rendered) {
                return;
            }

            $("#no-result-container").hide();
            Controller.loading = false;

            const $main = $("#main-area");
            let $container: JQuery;
            let entries = Model.entries.enumerable;
            if (entries.isEmpty()) {
                $("#no-result-container").fadeIn();
                return;
            }

            if (count) {
                entries = entries.take(count);
                $container = $("<div></div>").prependTo($main);
            } else {
                entries = entries.skip(this._current).take(HomeTab.TWEETS_COUNT);
                $container = $main;
            }

            twttr.ready(() => entries.forEach(x => this.renderTweet(x, $container)));
            this._current += count || HomeTab.TWEETS_COUNT;
            super.render();
        }

        private renderTweet(entry: RecoTwEntry, $container: JQuery): void {
            const $element = $("<div></div>", { id: "recotw-tweet-" + entry.tweet_id }).appendTo($container);
            twttr.widgets.createTweet(entry.tweet_id, $element[0], {
                lang: "ja",
                linkColor: "#774c80"
            }).then((widget: HTMLIFrameElement) => {
                if (!widget) {
                    this.showStatusLoadFailedMessage(entry, $element);
                } else {
                    const $contents = $(widget.shadowRoot || widget).css("height", "auto").contents();
                    $contents.find(".Tweet-brand .u-hiddenInNarrowEnv").hide();
                    $contents.find(".Tweet-brand .u-hiddenInWideEnv").css("display", "inline-block");
                    $contents.find(".Tweet-author").css("max-width", "none");
                    $contents.find(".EmbeddedTweet").css("max-width", "100%");
                }
            });
        }

        private replaceLinkToURL(target: string): string {
            return target.replace(/[\r\n]/g, "<br>").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, s => String.format(Resources.LINK_TO_URL_HTML, s));
        }

        private showStatusLoadFailedMessage(entry: RecoTwEntry, $target: JQuery): void {
            const tweetDate = Model.createDateByTweetID(entry);
            const time = String.format(Resources.TWEET_TIME_HTML, Model.createStatusURL(entry), tweetDate, tweetDate.toISOString());
            const $elm = $(String.format(Resources.TWEET_REMOVED_HTML, Model.createProfileImageURL(entry), Model.createUserURL(entry), entry.target_sn, this.replaceLinkToURL(Model.escapeHtml(entry.content)), time));

            $target.empty().append($elm);
            $elm.find("img").on("error", ($event: JQueryEventObject) => (<HTMLImageElement>$event.target).src = Model.createProfileImageURL(null));
        }

        public clear() {
            this._current = 0;
            $("#main-area").empty();
            super.clear();
        }
    }

    /**
     * The statistics tab.
     */
    class StatisticsTab extends Tab {
        private static GRAPH_COLORS = [
            0xcccccc, 0x3366cc, 0xdc3912, 0xff9900, 0x109618, 0x990099, 0x0099c6, 0xdd4477,
            0x66aa00, 0xb82e2e, 0x316395, 0x994499, 0x22aa99, 0xaaaa11, 0x6633cc, 0xe67300,
            0x8b0707, 0x651067, 0x329262, 0x5574a6, 0x3b3eac, 0xb77322, 0x16d620, 0xb91383,
            0xf4359e, 0x9c5935, 0xa9c413, 0x2a778d, 0x668d1c, 0xbea413, 0x0c5922, 0x743411,
        ];
        private static GRAPH_OPTIONS: google.visualization.PieChartOptions = {
            backgroundColor: "#FEFEFE",
            chartArea: {
                width: "90%",
                height: "100%"
            },
            is3D: true,
            legend: "none",
            sliceVisibilityThreshold: 0.0095
        };

        private _chart: google.visualization.PieChart = null;

        public constructor() {
            super("statistics-tab");
        }

        public get chart(): google.visualization.PieChart {
            if (this._chart === null) {
                this._chart = new google.visualization.PieChart($("#statistics-chart")[0]);
                google.visualization.events.addListener(this._chart, "click", Controller.onChartSliceClick);
            }
            return this._chart;
        }

        public render(username?: string) {
            if (!Model.isMobile() && username === void 0) {
                $("#statistics-filter-textbox").focus();
                $("#statistics-table").delay(100).animate({ scrollTop: 0 }, 400);
            }
            if (Model.entries === null || (username === void 0 && Tab.statistics.rendered)) {
                return;
            }

            $("#no-result-container").hide();
            const options = Controller.getOptions();
            if (username === void 0) {
                this.renderChart(options);
            }

            const table = Model.statistics.users.map((user, index) => ({
                html: this.generateTableRow(user, options, index),
                screenName: user.target_sn.toLowerCase()
            }))
                .filter(x => username === void 0 || x.screenName.startsWith(username));

            $("#statistics-table").html(table.length > 0 ? table.map(x => x.html).join("") : Resources.NO_RESULT);
            super.render();
        }

        private renderChart(options: Options): void {
            if (options.isFiltered()) {
                $("#statistics-filter").text(String.format(Resources.SEARCH_RESULT, options.toKeywords()));
                $("#statistics-count").text(String.format(Resources.STATISTICS_COUNT_FILTERED, Model.statistics.length, Model.entries.length));
            } else {
                $("#statistics-filter").text("");
                $("#statistics-count").text(String.format(Resources.STATISTICS_COUNT, Model.statistics.length));
            }

            if (Model.statistics.length === 0) {
                $("#statistics-chart").hide();
                $("#no-result-container").fadeIn();
                return;
            } else {
                $("#statistics-chart").show();
            }

            this.chart.draw(Model.statistics.table, StatisticsTab.GRAPH_OPTIONS);
        }

        private generateTableRow(user: RecoTwUser, current: Options, index: number): string {
            const options = new Options([user.target_sn], current.body, current.id, current.regex, current.order, current.orderBy);
            return String.format(Resources.STATISTICS_TABLE_HTML, user.percentage > StatisticsTab.GRAPH_OPTIONS.sliceVisibilityThreshold ? StatisticsTab.GRAPH_COLORS[index + 1] : StatisticsTab.GRAPH_COLORS[0], user.target_sn, user.count, user.percentage, APP_URL + options.toQueryString());
        }

        public clear(): void {
            $("#statistics-table").empty();
            super.clear();
        }

        public applySearchFilter(username: string) {
            const options = Controller.getOptions();
            options.usernames = [username];
            Controller.setOptions(options, true, true, true);

            super.clear();
            Tab.home.show();
        }

        public applyChartFilter(username: string) {
            this.render(username.toLowerCase());
        }
    }

    /**
     * The view.
     */
    class View {
        private static _title = Resources.PAGE_TITLE_NORMAL;

        public static set title(title: string) {
            View._title = title = title || View._title;
            if (location.hostname === "" || location.hostname === "localhost") {
                title = "[DEBUG] " + title;
            }
            if (Model.notification.length > 0) {
                title = "* " + title;
            }
            document.title = title;
        }

        public static setSearchKeywords(options: Options): void {
            $("#search-box").val(options.toKeywords());
        }

        public static postEntriesFromModal(): void {
            const inputs: string[] = $("#new-record-modal input[type='text']").map(function () {
                return $(this).val();
            }).get();
            try {
                Model.registerEntries(inputs.filter(x => x.length > 0)).then(Controller.onRegistrationSucceeded, Controller.onRegistrationFailed);
                $("#new-record-modal").modal("hide");
            } catch (e) {
                $("#inputPostStatus").val("").focus();
                $("#new-record-modal .modal-dialog").shake(2, 18, 300);
            }
        }

        public static postEntriesFromDialog(value: string): void {
            try {
                Model.registerEntries([ value ]).then(Controller.onRegistrationSucceeded, Controller.onRegistrationFailed);
            } catch (e) {
                window.alert((<Error>e).message);
            }
        }
    }

    /**
     * The controller.
     */
    class Controller {
        private static _options = new Options();
        public static loading = false;

        public static getOptions(): Options {
            return Controller._options;
        }

        public static setOptions(options: Options, sortOnly: boolean, setQuery: boolean, setKeywords: boolean): void {
            try {
                Model.options = Controller._options = options;
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
                View.title = String.format(Resources.PAGE_TITLE_SEARCH_RESULT, options.toKeywords());
            } else {
                $("#clear-search-filter").hide();
                View.title = Resources.PAGE_TITLE_NORMAL;
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
            View.title = Resources.PAGE_TITLE_NORMAL;
            $("#app-version").text(APP_VERSION);

            Model.init();
            Tab.home = new HomeTab();
            Tab.statistics = new StatisticsTab();
            Controller.setOptions(Options.fromQueryString(location.search, Order.Descending, OrderBy.RecordedDate), false, false, true);

            google.load("visualization", "1.0", { "packages": ["corechart"] });
            $("#loading-recotw").show();

            const $window = $(window);
            $window.unload(Model.save);
            $window.bottom({ proximity: 0.05 });
            $window.on("orientationchange", () => {
                $(document.body).toggleClass("standalone", window.innerHeight >= window.screen.height && navigator.standalone);
            }).trigger("orientationchange");
            $window.on("bottom", () => {
                if (Tab.home.active) {
                    Controller.onPageBottom();
                }
            });
            $window.on("popstate", () => {
                Controller.setOptions(Options.fromQueryString(location.search, Controller.order, Controller.orderBy), false, false, true);
            });
            Tab.home.element.click(() => {
                if (!Tab.home.active) {
                    return;
                }
                const count = Model.notification.length;
                if (count) {
                    Model.notification.clear();
                    Controller.onNotificationStatusChanged();
                    Controller.showNewStatuses(count);
                } else {
                    $("html, body").animate({ scrollTop: 0 }, 400);
                }
            });
            $(".navbar-brand, #clear-search-filter").click(() => {
                Controller.setOptions(Options.fromKeywords("", Controller.order, Controller.orderBy), false, true, true);
            });
            $("[id^='order-by-']").change(() => {
                Controller.getOptions().order = Controller.order;
                Controller.getOptions().orderBy = Controller.orderBy;
                Controller.setOptions(Controller.getOptions(), true, false, false);
            });
            $("#order-shuffle").click(() => {
                Controller.getOptions().order = Controller.order;
                Controller.setOptions(Controller.getOptions(), true, false, false);
            });
            $("#search-form").submit($event => {
                $event.preventDefault();
                Controller.setOptions(Options.fromKeywords($("#search-box").val(), Controller.order, Controller.orderBy), false, true, false);
            });
            $("#search-form-toggle-button").click(function () {
                const $this = $(this);
                const $elm = $("#search-form");
                const $main = $("#page-main");
                if ($this.hasClass("active")) {
                    $this.removeClass("active");
                    $main.removeClass("main-search-active");
                    $elm.css({ display: "" });
                } else {
                    $this.addClass("active");
                    $main.addClass("main-search-active");
                    $elm.css({ cssText: "display: block !important" });
                }
            });
            $("#new-record-toggle-button").click(() => {
                if (!navigator.standalone) {
                    $("#new-record-modal").modal("show");
                } else {
                    const result = window.prompt(Resources.REGISTER_NEW_TWEET);
                    if (result !== null) {
                        View.postEntriesFromDialog(result);
                    }
                }
            });
            $("#new-record-form").submit($event => {
                $event.preventDefault();
                View.postEntriesFromModal();
            });
            $("#new-record-modal").on("shown.bs.modal", () => {
                $("#new-record-form .url-box").focus();
            });
            $("#new-record-modal").on("hidden.bs.modal", () => {
                $("#new-record-form .modal-body").empty().html(Resources.URL_INPUT_AREA);
            });
            $("#new-record-modal").on("keyup change input", ".url-box", Controller.onNewRecordFormTextBoxValueChanged);
            $("#statistics-filter-textbox").on("keyup change input", ($event: JQueryEventObject) => {
                Tab.statistics.applyChartFilter((<HTMLInputElement>$event.target).value);
            });
            $("#statistics-table").on("mousedown click", ".statistics-table-header a", ($event: JQueryMouseEventObject) => {
                if ($event.type === "click") {
                    $event.preventDefault();
                    return;
                }
                if ($event.button === 0) {
                    Tab.statistics.applySearchFilter($event.target.textContent);
                }
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
            $("#new-record-toggle-button").popover({
                placement: "bottom",
                html: true,
                trigger: "manual"
            }).on("shown.bs.popover", function () {
                window.setTimeout(() => $(this).popover("hide"), 5000);
            });
        }

        public static get order(): Order {
            return $(".order-radio-box:checked").data("order");
        }

        public static get orderBy(): OrderBy {
            return $(".order-radio-box:checked").data("order-by");
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
            Model.startPolling();
            Controller.setOptions(Controller.getOptions(), false, false, true);
        }

        public static onEntriesLoadFailed(): void {
            $("#loading-panel").fadeOut().promise().done(() => $("#loading-error-panel").fadeIn());
        }

        public static onRegistrationSucceeded(response: RecoTwRecordResponse): void {
            return;
        }

        public static onRegistrationFailed(error: string): void {
            $("#new-record-toggle-button").attr("data-content", String.format(Resources.REGISTRATION_FAILED_HTML, error)).popover("show");
        }

        public static onNewEntries(count: number): void {
            Model.notification.create(count);
            Controller.onNotificationStatusChanged();
        }

        private static onNotificationStatusChanged(): void {
            View.title = null;
            const count = Model.notification.length;
            if (count === 0) {
                $("#unread-tweets").fadeOut();
            } else {
                const badge = count < 100 ? count : "99+";
                $("#unread-tweets").text(badge).css({ display: "inline-block" });
            }
        }

        private static onPageBottom(): void {
            if (Controller.loading) {
                return;
            }
            Controller.loading = true;
            Tab.home.render(true);
        }

        public static onChartSliceClick(slice: any): void {
            const target = <string>slice.targetID;
            const index = target.indexOf("#");
            if (index < 0) {
                return;
            }
            const id = +target.substring(index + 1);
            if (id < 0) {
                return;
            }
            Tab.statistics.applySearchFilter(Model.statistics.users[id].target_sn);
        }

        private static onNewRecordFormTextBoxValueChanged($event: JQueryEventObject): void {
            const $this = $(this).parents(".url-input-area").removeClass("has-success has-warning has-error");
            const elm = <HTMLInputElement>$event.target;
            try {
                const id = Model.createIDfromURL(elm.value);
                if (Model.entries.reset().enumerable.any(x => x.tweet_id === id)) {
                    $this.addClass("has-warning").find(".help-block").text(Resources.ALREADY_REGISTERED);
                } else if (id !== null) {
                    $this.addClass("has-success").find(".help-block").text(Resources.REGISTRATION_AVAILABLE);
                } else {
                    $this.find(".help-block").text(Resources.REGISTRATION_DEFAULT);
                }
            } catch (e) {
                $this.addClass("has-error").find(".help-block").text(Resources.INCORRECT_URL_OR_ID);
            }

            /**
             * [FUTURE] The following code is to increase text boxes for multiple entries registration.
             */
            // const inputs: string[] = $(".url-box").map((index: number, element: HTMLInputElement) => element.value).get();
            // if (inputs[inputs.length - 1] !== "") {
            //     $("#new-record-form .modal-body").append(Resources.URL_INPUT_AREA);
            // } else if (inputs.length >= 2 && inputs[inputs.length - 2] === "") {
            //     $("#new-record-form .url-input-area").eq(inputs.length - 1).remove();
            //     $(".url-box").last().focus();
            // }
        }

        public static showNewStatuses(count: number): void {
            Tab.home.show();
            const options = Controller.getOptions();
            if (options.isFiltered() || options.order !== Order.Descending || options.orderBy !== OrderBy.RecordedDate) {
                Controller.setOptions(new Options([], "", null, false, options.order, options.orderBy), false, true, true);
            } else {
                // Assign options in order to reset the enumerator
                Model.options = options;
                Tab.home.render(false, count);
            }
        }
    }

    Controller.main();
}
