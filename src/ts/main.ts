﻿/// <reference path="./main.d.ts"/>
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
 * - favico.js
 */

module RecoTwExplorer {
    "use strict";
    var APP_NAME = "RecoTw Explorer";
    var APP_VERSION = "2.40";

    /*
     * Bootstrap jQuery Shake Effect snippet - pAMmDzOfnL
     * http://www.bootply.com/60873
     */
    $.fn.shake = function (shakes: number, distance: number, duration: number): JQuery {
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
        public static BADGE_NOT_SUPPORTED = "通知バッジがサポートされていません。";
        public static FAILED_TO_GENERATE_STATUS_URL = "ツイートの URL を生成できません。";
        public static FAILED_TO_GENERATE_USER_URL = "ユーザーへの URL を生成できません。";
        public static FAILED_TO_GENERATE_PROFILE_IMAGE_URL = "プロフィール画像の URL を生成できません。";
        public static FAILED_TO_LOAD_EMBEDDED_TWEET = "Twitter 埋め込みツイートの読み込みに失敗しました。";
        public static REGISTER_NEW_TWEET = "ツイートの ID または URL:";
        public static REGISTRATION_FAILED_HTML = "<strong>登録失敗</strong><br>{0}";
        public static SEARCH_HELP_HTML = "<dl><dt>ツイート検索</dt><dd><code>/</code> と <code>/</code> で囲むと正規表現検索</dd><dt>ユーザー名検索</dt><dd><code>from:</code> でユーザーを検索<br>カンマ区切りで複数入力</dd><dt>ID 検索</dt><dd><code>id:</code> で ID 検索</dd></dl>";
        public static STATISTICS_TABLE_HTML = "<span class=\"statistics-table-header\" style=\"border-color: #{0:X6};\"><a href=\"javascript:void(0);\" onmousedown=\"RecoTwExplorer.Controller.applySearchFilterByUsername('{1}')\">{1}</a> ({2})&nbsp;&nbsp;&ndash;&nbsp;&nbsp;{3:P1}</span><br>";
        public static TWEET_REMOVED_HTML = "<blockquote>ツイートは削除されたか、または非公開に設定されています。<hr><div><img src=\"{0}\" onerror=\"RecoTwExplorer.Controller.onImageError(this)\"><span><a href=\"{1}\" target=\"_blank\">@{2}</a></span><p>{3}</p><p class=\"tweet-date\">{4}</p></div></blockquote>";
        public static LINK_TO_URL_HTML = "<a href=\"{0}\" target=\"_blank\">{0}</a>";
        public static URL_INPUT_AREA = $("#new-record-form .modal-body").html();
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
            this._elements = elements;
            this._userIDs = userIDs || null;
            this._enumerable = enumerable || Enumerable.from(elements);

            if (userIDs === null) {
                this._userIDs = this.enumerable.toDictionary(x => x.target_id, x => x.target_sn);
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
         * Adds items to the entries.
         * @param items The items to add.
         */
        public addRange(items: linqjs.IEnumerable<RecoTwEntry> | RecoTwEntry[]): void {
            items.forEach(x => this._elements[this._elements.length] = x);
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
            var result = this.clone();
            if (!options) {
                return result;
            }
            var order = options.order || Order.Descending;
            var orderBy = options.orderBy || OrderBy.RecordedDate;
            var sortCallback = (x: any, y: any) => x - y;
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
                    result._enumerable = result.enumerable.where(x => re.test(x.content));
                } else {
                    options.body = options.body.toLowerCase();
                    result._enumerable = result.enumerable.where(x => x.content.toLowerCase().contains(options.body));
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
        private static TWITTER_SNOWFLAKE_EPOCH = 1288834974657;

        private static _entries: RecoTwEntryCollection = null;
        private static _statistics: RecoTwStatistics = null;
        private static _pollingID: number = null;
        private static _notificationCount = 0;
        private static _favico: Favico = null;

        /**
         * Initializes the model, loads the entries from localStorage, and starts to download new entries.
         */
        public static init(): void {
            Model.load();
            try {
                Model._favico = new Favico({ animation: "slide" });
            } catch (e) {
                console.log(Resources.BADGE_NOT_SUPPORTED);
            }
        }

        /**
         * Loads entries from localStorage and fetch new ones.
         */
        private static load(): void {
            var entries: RecoTwEntry[] = [];
            var item = localStorage.getItem("entries");
            if (item) {
                entries = JSON.parse(item);
            }
            Model.fetchLatestEntries(entries).then(Controller.onEntriesLoaded, Controller.onEntriesLoadFailed);
        }

        /**
         * Saves all the entries to localStorage.
         */
        public static save(): void {
            localStorage.setItem("entries", JSON.stringify(Model.entries.reset().enumerable.toArray()));
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

        public static get latestEntry(): RecoTwEntry {
            if (Model.entries === null) {
                return null;
            } else {
                return Model.entries.reset().enumerable.lastOrDefault();
            }
        }

        /**
         * Gets a statistics information by current options. The data is cached if possible.
         * @param username A username to filter.
         */
        public static get statistics(): RecoTwStatistics {
            if (Model.entries === null) {
                return null;
            } else {
                return Model._statistics !== null ? Model._statistics : (Model._statistics = Model.entries.createStatistics());
            }
        }

        /**
         * Sets options to determine how to enumerate entries.
         * @param options Configurations to enumerate entries.
         */
        public static set options(options: Options) {
            if (Model.entries === null) {
                return;
            }
            Model._entries = Model.entries.reset().sort(options).filter(options);
            Model._statistics = null;
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
            var match: RegExpMatchArray;
            if (input === void 0 || input === null || input.length === 0) {
                return null;
            } else if (typeof input === "string") {
                if ((match = input.match(/^(?:(?:https?:\/\/(?:www\.|mobile\.)?)?twitter\.com\/(?:#!\/)?[a-zA-Z0-9_]+\/status(?:es)?\/(\d+)|(\d+))$/)) !== null) {
                    return match[1] || match[2];
                }
            } else if (Array.isArray(input)) {
                var ids = input.map(Model.createIDfromURL);
                if (!ids.every(x => x === null)) {
                    return ids;
                }
            }
            throw new Error(Resources.INCORRECT_URL_OR_ID);
        }

        /**
         * Retrieves new entries from the remote.
         * @param entries The entries to initialize with.
         */
        public static fetchLatestEntries(entries?: RecoTwEntry[]): JQueryPromise<RecoTwEntry[]> {
            var sinceID: number;
            if (Model.entries !== null) {
                sinceID = +Model.latestEntry.id + 1;
            } else if (entries && entries.length > 0) {
                sinceID = +entries[entries.length - 1].id + 1;
            }

            var deferred = $.Deferred<RecoTwEntry[]>();
            $.ajax({
                url: Model.RECOTW_GET_ALL_URL,
                dataType: "json",
                data: { since_id: sinceID }
            }).done((data: RecoTwEntry[], status: string, xhr: JQueryXHR) => {
                if (Model.entries === null) {
                    Model._entries = new RecoTwEntryCollection(entries);
                }
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
            var deferred = $.Deferred<RecoTwRecordResponse>();
            var ids = Model.createIDfromURL(inputs);
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
                    Model.entries.addRange([data]);
                    Controller.onNewEntries(1);
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
                var binary = (+item).toString(2);
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
                Model.fetchLatestEntries().done(data => {
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

        /**
         * Gets a number of notifications.
         */
        public static get notificationCount(): number {
            return Model._notificationCount;
        }

        /**
         * Creates a notification.
         * @param A number of notifications to create.
         */
        public static createNotification(count: number): void {
            if (count < 0) {
                return;
            }
            Model._notificationCount += count;
            try {
                Model._favico.badge(Model._notificationCount);
            } catch (e) {
                console.log(Resources.BADGE_NOT_SUPPORTED);
            }
        }

        /**
         * Clears all of the notifications.
         */
        public static clearNotification(): void {
            Model._notificationCount = 0;
            try {
                Model._favico.reset();
            } catch (e) {
                console.log(Resources.BADGE_NOT_SUPPORTED);
            }
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
        private static WIDGET_OPTIONS: TwitterTweetWidgetOptions = {
            lang: "ja",
            linkColor: "#774c80"
        };
        private static _chart: google.visualization.PieChart = null;
        private static _current = 0;
        private static _widgetID = -1;
        private static _title = Resources.PAGE_TITLE_NORMAL;

        public static getTabFromID(id: string): Tab {
            switch (id.substring(id.lastIndexOf("#") + 1)) {
                case "home-tab":
                    return Tab.Home;
                case "statistics-tab":
                    return Tab.Statistics;
                default:
                    return Tab.None;
            }
        }

        public static get currentTab(): Tab {
            return View.getTabFromID("#" + $(".tab-pane.active").attr("id"));
        }

        public static set currentTab(tab: Tab) {
            switch (tab) {
                case Tab.Home:
                    $("a[href='#home-tab']").tab("show");
                    return;
                case Tab.Statistics:
                    $("a[href='#statistics-tab']").tab("show");
                    return;
            }
        }

        public static set title(title: string) {
            View._title = title = title || View._title;
            if (location.hostname === "" || location.hostname === "localhost") {
                title = "[DEBUG] " + title;
            }
            if (Model.notificationCount > 0) {
                title = "* " + title;
            }
            document.title = title;
        }

        public static renderHome(count?: number): void {
            $("#no-result-container").hide();
            Controller.isLoading = false;

            var $main = $("#main-area");
            var element: HTMLElement;
            var entries = Model.entries.enumerable;
            if (entries.isEmpty()) {
                $("#no-result-container").fadeIn();
                return;
            }

            if (count) {
                entries = entries.take(count);
                element = $("<div></div>").prependTo($main)[0];
            } else {
                entries = entries.skip(View._current).take(View.TWEETS_COUNT);
                element = $main[0];
            }

            twttr.ready(() => entries.forEach(x => View.renderTweet(x, element)));
            View._current += count || View.TWEETS_COUNT;
        }

        private static renderTweet(entry: RecoTwEntry, element: HTMLElement): void {
            var widgetID = ++View._widgetID;
            twttr.widgets.createTweet(entry.tweet_id, element, View.WIDGET_OPTIONS).then((widget: HTMLIFrameElement) => {
                if (!widget) {
                    View.showStatusLoadFailedMessage(widgetID, entry);
                } else {
                    var $contents = $(widget).contents();
                    $contents.find(".Tweet-brand .u-hiddenInNarrowEnv").hide();
                    $contents.find(".Tweet-brand .u-hiddenInWideEnv").css("display", "inline-block");
                    $contents.find(".Tweet-author").css("max-width", "none");
                }
            });
        }

        public static renderStatistics(username?: string): void {
            if (Model.entries === null) {
                return;
            }

            $("#no-result-container").hide();

            if (View._chart === null) {
                View._chart = new google.visualization.PieChart($("#statistics-chart")[0]);
                google.visualization.events.addListener(View._chart, "click", Controller.onChartSliceClick);
            }

            if (username === void 0) {
                var options = Controller.getOptions();
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

                View._chart.draw(Model.statistics.table, View.GRAPH_OPTIONS);
            }

            var table = Model.statistics.users.map((user, index) => ({ html: View.generateTableRow(user, index), screenName: user.target_sn.toLowerCase() }))
                                              .filter(x => username === void 0 || x.screenName.startsWith(username));

            $("#statistics-table").html(table.length > 0 ? table.map(x => x.html).join("") : Resources.NO_RESULT);
        }

        private static generateTableRow(user: RecoTwUser, index: number): string {
            return String.format(Resources.STATISTICS_TABLE_HTML, user.percentage > View.GRAPH_OPTIONS.sliceVisibilityThreshold ? View.GRAPH_COLORS[index + 1] : View.GRAPH_COLORS[0], user.target_sn, user.count, user.percentage);
        }

        public static clearHome(): void {
            View._current = 0;
            $("#main-area").empty();
        }

        public static setSearchKeywords(options: Options): void {
            $("#search-box").val(options.toKeywords());
        }

        public static postEntriesFromModal(): void {
            var inputs: string[] = $("#new-record-modal input[type='text']").map(function () { return $(this).val(); }).get();
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

        private static replaceLinkToURL(target: string): string {
            return target.replace(/[\r\n]/g, "<br>").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, s => String.format(Resources.LINK_TO_URL_HTML, s));
        }

        public static showStatusLoadFailedMessage(widgetID: number, entry: RecoTwEntry): void {
            var date = String.format("<a href=\"{0}\" target=\"_blank\">{1:h:mm tt - d M月 yyyy}</a>", Model.createStatusURL(entry), Model.createDateByTweetID(entry)).replace("午前", "AM").replace("午後", "PM");
            var html = String.format(Resources.TWEET_REMOVED_HTML, Model.createProfileImageURL(entry), Model.createUserURL(entry), entry.target_sn, View.replaceLinkToURL(entry.content), date);
            $("#twitter-widget-" + widgetID).after(html).remove();
        }
    }

    /**
     * The controller.
     */
    export class Controller {
        private static _options = new Options();
        private static _loading = false;
        private static _homeRendered = false;
        private static _statisticsRendered = false;

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

            if (View.currentTab === Tab.Statistics) {
                View.clearHome();
                if (sortOnly) {
                    Controller._homeRendered = false;
                } else {
                    Controller.reload();
                }
            } else {
                Controller.reload();
            }
        }

        public static get isLoading(): boolean {
            return Controller._loading;
        }

        public static set isLoading(state: boolean) {
            Controller._loading = state;
        }

        public static main(): void {
            View.title = Resources.PAGE_TITLE_NORMAL;
            $("#app-version").text(APP_VERSION);
            if (navigator.standalone) {
                $(document.body).addClass("standalone");
            }

            Model.init();
            google.load("visualization", "1.0", { "packages": ["corechart"] });
            $("#loading-recotw").show();

            Controller.setOptions(Options.fromQueryString(location.search, Order.Descending, OrderBy.RecordedDate), false, false, true);

            var $window = $(window);
            $window.unload(Model.save);
            $window.bottom({ proximity: 0.05 });
            $window.on("bottom", () => {
                if (View.currentTab === Tab.Home) {
                    Controller.onPageBottom();
                }
            });
            $window.on("popstate", () => {
                Controller.setOptions(Options.fromQueryString(location.search, Controller.order, Controller.orderBy), false, false, true);
            });
            $(".navbar-nav a[role='tab']").on("shown.bs.tab", $event => {
                Controller.onTabSwitched(View.getTabFromID((<HTMLAnchorElement>$event.relatedTarget).href), View.getTabFromID((<HTMLAnchorElement>$event.target).href));
            });
            $("[href='#home-tab']").click(() => {
                var count = Model.notificationCount;
                if (View.currentTab === Tab.Home && count > 0) {
                    Model.clearNotification();
                    Controller.onNotificationStatusChanged();
                    Controller.showNewStatuses(count);
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
                var $this = $(this);
                var $elm = $("#search-form");
                var $main = $("#page-main");
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
                    var result = window.prompt(Resources.REGISTER_NEW_TWEET);
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
            $("#statistics-filter-textbox").on("keyup change", ($event: JQueryEventObject) => {
                Controller.applyChartFilterByUsername((<HTMLInputElement>$event.target).value);
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
            switch (View.currentTab) {
                case Tab.Home:
                    View.clearHome();
                    View.renderHome();
                    $("#statistics-filter-textbox").val("");
                    Controller._homeRendered = true;
                    Controller._statisticsRendered = false;
                    break;
                case Tab.Statistics:
                    View.renderStatistics();
                    Controller._homeRendered = false;
                    Controller._statisticsRendered = true;
                    break;
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
            Model.createNotification(count);
            Controller.onNotificationStatusChanged();
        }

        public static onNotificationStatusChanged(): void {
            View.title = null;
            var count = Model.notificationCount;
            if (count === 0) {
                $("#unread-tweets").fadeOut();
            } else {
                var badge = count < 100 ? count : "99+";
                $("#unread-tweets").text(badge).fadeIn().promise().done(($event: JQueryEventObject) => {
                    (<HTMLElement>$event.target).style.display = "inline-block";
                });
            }
        }

        public static isMobile(): boolean {
            return /iPhone|iP[ao]d|Android|Windows.*Phone/.test(navigator.userAgent);
        }

        public static onTabSwitched(previous: Tab, current: Tab): void {
            switch (current) {
                case Tab.Home:
                    if (!Controller._homeRendered) {
                        View.renderHome();
                        Controller._homeRendered = true;
                    }
                    break;
                case Tab.Statistics:
                    if (!Controller.isMobile()) {
                        $("#statistics-filter-textbox").focus();
                        $("#statistics-table").delay(100).animate({ scrollTop: 0 }, 400);
                    }
                    if (!Controller._statisticsRendered) {
                        View.renderStatistics();
                        Controller._statisticsRendered = true;
                    }
                    break;
            }
        }

        public static onPageBottom(): void {
            if (Controller.isLoading) {
                return;
            }
            Controller.isLoading = true;
            View.renderHome();
        }

        public static onImageError(element: HTMLImageElement) {
            element.src = Model.createProfileImageURL(null);
        }

        public static onChartSliceClick(slice: any): void {
            var target = <string>slice.targetID;
            if (!target.contains("#")) {
                return;
            }
            var id = +target.substring(target.indexOf("#") + 1);
            if (id < 0) {
                return;
            }
            Controller.applySearchFilterByUsername(Model.statistics.users[id].target_sn);
        }

        private static onNewRecordFormTextBoxValueChanged(): void {
            var $elements = $(".url-input-area");
            var inputs: string[] = $(".url-box").map((index: number, element: HTMLInputElement) => element.value).get();

            $elements.each(function (index) {
                $(this).removeClass("has-success has-error");
                try {
                    if (Model.createIDfromURL(inputs[index]) !== null) {
                        $(this).addClass("has-success");
                    }
                } catch (e) {
                    $(this).addClass("has-error");
                }
            });

            /**
             * [FUTURE] The following code is to increase text boxes for multiple entries registration.
             */
            // if (inputs[inputs.length - 1] !== "") {
            //     $("#new-record-form .modal-body").append(Resources.URL_INPUT_AREA);
            // } else if (inputs.length >= 2 && inputs[inputs.length - 2] === "") {
            //     $("#new-record-form .url-input-area").eq(inputs.length - 1).remove();
            //     $(".url-box").last().focus();
            // }
        }

        public static applySearchFilterByUsername(username: string) {
            View.currentTab = Tab.Home;
            var options = Controller.getOptions();
            options.usernames = [username];
            Controller.setOptions(options, false, true, true);
        }

        private static applyChartFilterByUsername(username: string) {
            View.renderStatistics(username.toLowerCase());
        }

        public static showNewStatuses(count: number): void {
            View.currentTab = Tab.Home;
            var options = Controller.getOptions();
            if (options.isFiltered() || options.order !== Order.Descending || options.orderBy !== OrderBy.RecordedDate) {
                Controller.setOptions(new Options([], "", null, false, options.order, options.orderBy), false, true, true);
            } else {
                View.renderHome(count);
            }
        }
    }

    Controller.main();
}
