/*
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
var RecoTwExplorer;
(function (RecoTwExplorer) {
    var APP_NAME = "RecoTw Explorer";
    var APP_VERSION = "2.10";
    /*
     * Bootstrap jQuery Shake Effect snippet - pAMmDzOfnL
     * http://www.bootply.com/60873
     */
    $.fn.shake = function (shakes, distance, duration) {
        "use strict";
        return this.each(function () {
            var $this = $(this);
            for (var i = 0; i < shakes; i++) {
                $this.animate({ left: -distance }, duration / shakes / 4).animate({ left: distance }, duration / shakes / 2).animate({ left: 0 }, duration / shakes / 4);
            }
        });
    };
    if (!Array.isArray) {
        Array.isArray = function (x) { return Object.prototype.toString.call(x) === "[object Array]"; };
    }
    /**
     * The resources for UI.
     */
    var Resources = (function () {
        function Resources() {
        }
        Resources.INCORRECT_REGEX = "指定された正規表現は正しくありません。";
        Resources.INCORRECT_URL_OR_ID = "指定された URL または ID は正しくありません。";
        Resources.FAILED_TO_GENERATE_STATUS_URL = "ツイートの URL を生成できません。";
        Resources.FAILED_TO_GENERATE_USER_URL = "ユーザーへの URL を生成できません。";
        Resources.FAILED_TO_GENERATE_PROFILE_IMAGE_URL = "プロフィール画像の URL を生成できません。";
        Resources.FAILED_TO_LOAD_EMBEDDED_TWEET = "Twitter 埋め込みツイートの読み込みに失敗しました。";
        Resources.SEARCH_HELP_HTML = "<dl><dt>ツイート検索</dt><dd><code>/</code> と <code>/</code> で囲むと正規表現検索</dd><dt>ユーザー名検索</dt><dd><code>from:</code> でユーザーを検索<br>カンマ区切りで複数入力</dd><dt>ID 検索</dt><dd><code>id:</code> で ID 検索</dd></dl>";
        Resources.STATISTICS_TABLE_HTML = "<span class=\"statistics-table-header\" style=\"border-color: #{0:X6};\"><a href=\"javascript:void(0);\" onclick=\"RecoTwExplorer.Controller.setSearchFilterByUsername('{1}')\">{1}</a> ({2})&nbsp;&nbsp;&ndash;&nbsp;&nbsp;{3:P1}</span><br>";
        Resources.TWEET_REMOVED_HTML = "<blockquote>ツイートは削除されたか、または非公開に設定されています。<a href=\"{0}\" target=\"_blank\">表示</a><hr><div><img src=\"{1}\" onerror=\"RecoTwExplorer.Controller.onImageError(this)\"><span><a href=\"{2}\" target=\"_blank\">@{3}</a></span><p>{4}</p></div></blockquote>";
        Resources.LINK_TO_URL_HTML = "<a href=\"{0}\" target=\"_blank\">{0}</a>";
        Resources.URL_INPUT_AREA = $("#new-record-form .modal-body").html();
        Resources.USERNAME = "ユーザ名";
        Resources.TWEETS_COUNT = "ツイート数";
        Resources.NO_RESULT = "<p class=\"text-center\" style=\"margin-top: 200px;\">該当ユーザーなし</p>";
        Resources.SEARCH_RESULT = "検索結果: {0}";
        Resources.STATISTICS_COUNT = "({0:N0} 件)";
        Resources.PAGE_TITLE_SEARCH_RESULT = "検索結果: {0} - " + APP_NAME;
        Resources.PAGE_TITLE_NORMAL = APP_NAME;
        Resources.POST_ERRORS = {
            "400": "パラメーターが正しくありません。",
            "403": "ツイートの取得に失敗しました。",
            "404": "指定されたツイートは存在しません。",
            "500": "すでに登録されているツイートです。",
            "503": "サーバーで問題が発生しています。",
            UNKNOWN_ERROR: "原因不明のエラーです。"
        };
        return Resources;
    })();
    /**
     * Configurations to filter and sort entries.
     */
    var Options = (function () {
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
        function Options(usernames, body, id, regex, order, orderBy) {
            if (usernames === void 0) { usernames = []; }
            if (body === void 0) { body = ""; }
            if (id === void 0) { id = null; }
            if (regex === void 0) { regex = false; }
            if (order === void 0) { order = 2 /* Descending */; }
            if (orderBy === void 0) { orderBy = 1 /* RecordedDate */; }
            this.usernames = usernames;
            this.body = body;
            this.id = id;
            this.regex = regex;
            this.order = order;
            this.orderBy = orderBy;
        }
        Options.prototype.isFilteredByUsernames = function () {
            return this.usernames !== void 0 && this.usernames.length > 0;
        };
        Options.prototype.isFilteredByID = function () {
            return this.id !== void 0 && this.id !== null;
        };
        Options.prototype.isFilteredByBody = function () {
            return this.body !== void 0 && this.body.length > 0;
        };
        /**
         * Gets a value that determines if the options have filter or not.
         */
        Options.prototype.isFiltered = function () {
            return this.isFilteredByUsernames() || this.isFilteredByID() || this.isFilteredByBody();
        };
        /**
         * Converts the options to a search query string, which is used for location.search.
         */
        Options.prototype.toQueryString = function () {
            var queries = [];
            if (this.isFilteredByUsernames()) {
                queries[queries.length] = "username=" + encodeURIComponent(this.usernames.join(","));
            }
            if (this.isFilteredByID()) {
                queries[queries.length] = "id=" + encodeURIComponent(this.id);
            }
            if (this.isFilteredByBody()) {
                if (this.regex) {
                    queries[queries.length] = "body=" + encodeURIComponent("/" + this.body + "/");
                }
                else {
                    queries[queries.length] = "body=" + encodeURIComponent(this.body);
                }
            }
            if (queries.length > 0) {
                return "?" + queries.join("&");
            }
            else {
                return "";
            }
        };
        /**
         * Converts the options to a keywords string.
         */
        Options.prototype.toKeywords = function () {
            var keywords = [];
            if (this.isFilteredByUsernames()) {
                keywords[keywords.length] = "from:" + this.usernames.join(",");
            }
            if (this.isFilteredByID()) {
                keywords[keywords.length] = "id:" + this.id;
            }
            if (this.isFilteredByBody()) {
                if (this.regex) {
                    keywords[keywords.length] = "/" + this.body + "/";
                }
                else {
                    keywords[keywords.length] = this.body;
                }
            }
            return keywords.join(" ");
        };
        /**
         * Creates a new instance of a Options class with a query string.
         *
         * @param queryString A query string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        Options.fromQueryString = function (queryString, order, orderBy) {
            var options = new Options([], "", null, false, order, orderBy);
            if (queryString.length === 0 || queryString === "?") {
                return options;
            }
            var queries = Enumerable.from(queryString.substring(1).split("&")).select(function (x) { return x.split("="); }).where(function (x) { return x.length === 2; }).select(function (x) { return ({ property: x[0], value: decodeURIComponent(x[1]) }); });
            queries.where(function (x) { return x.property === "body"; }).forEach(function (x) {
                var match;
                if ((match = x.value.match(/^\/(.*)\/$/)) !== null) {
                    options.body = match[1];
                    options.regex = true;
                }
                else {
                    options.body = x.value;
                    options.regex = false;
                }
            });
            queries.where(function (x) { return x.property === "username"; }).forEach(function (x) { return options.usernames = x.value.split(","); });
            queries.where(function (x) { return x.property === "id"; }).forEach(function (x) { return options.id = x.value; });
            return options;
        };
        /**
         * Creates a new instance of a Options class with a keywords string.
         *
         * @param keywords A keywords string.
         * @param order A value that specifies how to sort entries.
         * @param orderBy A key value by which to sort entries.
         */
        Options.fromKeywords = function (keywords, order, orderBy) {
            var options = new Options([], "", null, false, order, orderBy);
            var value = keywords.split(" ");
            var match;
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
        };
        return Options;
    })();
    /**
     * Information which aggregates users.
     */
    var RecoTwStatistics = (function () {
        /**
         * Initializes a new instance of RecoTwStatistics class with parameters.
         *
         * @param users All users in the database.
         * @param entryLength A number of the entries.
         * @param dataTable A data table for Google Chart.
         */
        function RecoTwStatistics(users, entryLength, dataTable) {
            this.users = users;
            this.entryLength = entryLength;
            this.dataTable = dataTable;
        }
        return RecoTwStatistics;
    })();
    /**
     * The collection of RecoTw Entries.
     */
    var RecoTwEntryCollection = (function () {
        /**
         * Initializes a new instance of RecoTwEntryCollection class with parameters.
         *
         * @param elements All the entries.
         * @param userIDs A unique hash set of screen_names and user IDs.
         * @param enumerable An object to enumerate the entries.
         */
        function RecoTwEntryCollection(elements, userIDs, enumerable) {
            var _this = this;
            if (userIDs === void 0) { userIDs = null; }
            if (enumerable === void 0) { enumerable = Enumerable.from(elements); }
            this.elements = elements;
            this.userIDs = userIDs;
            this.enumerable = enumerable;
            if (userIDs === null) {
                this.userIDs = this.enumerable.toDictionary(function (x) { return x.target_id; }, function (x) { return x.target_sn; });
                this.enumerable.forEach(function (x) { return x.target_sn = _this.userIDs.get(x.target_id); });
            }
        }
        /**
         * Adds items to the entries.
         *
         * @param items The items to add.
         */
        RecoTwEntryCollection.prototype.addRange = function (items) {
            var _this = this;
            items.forEach(function (x) { return _this.elements[_this.elements.length] = x; });
        };
        /**
         * Returns a copy of this instance.
         */
        RecoTwEntryCollection.prototype.clone = function () {
            return new RecoTwEntryCollection(this.elements, this.userIDs, this.enumerable);
        };
        /**
         * Returns a new instance which has the same elements.
         */
        RecoTwEntryCollection.prototype.reset = function () {
            return new RecoTwEntryCollection(this.elements, this.userIDs);
        };
        /**
         * Gets a number of all the entries.
         */
        RecoTwEntryCollection.prototype.getAllLength = function () {
            return this.elements.length;
        };
        /**
         * Gets an object to enumerate the entries.
         */
        RecoTwEntryCollection.prototype.getEnumerable = function () {
            return this.enumerable;
        };
        /**
         * Creates a statistics information by current entries.
         */
        RecoTwEntryCollection.prototype.createStatistics = function () {
            var data = this.enumerable.groupBy(function (x) { return x.target_id; }).select(function (x) { return ({ target_sn: x.firstOrDefault().target_sn, count: x.count() }); }).orderByDescending(function (x) { return x.count; }).thenBy(function (x) { return x.target_sn.toLowerCase(); }).toArray();
            return new RecoTwStatistics(data, this.enumerable.count(), new google.visualization.DataTable({
                cols: [
                    { type: "string", label: Resources.USERNAME },
                    { type: "number", label: Resources.TWEETS_COUNT }
                ],
                rows: Enumerable.from(data).select(function (x) { return ({ c: [{ v: x.target_sn }, { v: x.count }] }); }).toArray()
            }));
        };
        /**
         * Returns a new instance which has the entries sorted when they are enumerated.
         *
         * @param options Configurations to sort entries.
         */
        RecoTwEntryCollection.prototype.sort = function (options) {
            var result = this.clone();
            if (!options) {
                return result;
            }
            var order = options.order || 2 /* Descending */;
            var orderBy = options.orderBy || 1 /* RecordedDate */;
            var sortCallback = function (x, y) { return x - y; };
            if (order === 1 /* Ascending */) {
                if (orderBy === 1 /* RecordedDate */) {
                    result.enumerable = result.enumerable.orderBy(function (x) { return x.record_date; });
                }
                else if (orderBy === 2 /* CreatedDate */) {
                    result.enumerable = result.enumerable.orderBy(function (x) { return x.tweet_id; }, sortCallback);
                }
            }
            else if (order === 2 /* Descending */) {
                if (orderBy === 1 /* RecordedDate */) {
                    result.enumerable = result.enumerable.orderByDescending(function (x) { return x.record_date; });
                }
                else if (orderBy === 2 /* CreatedDate */) {
                    result.enumerable = result.enumerable.orderByDescending(function (x) { return x.tweet_id; }, sortCallback);
                }
            }
            return result;
        };
        /**
         * Returns a new instance which has the entries filtered when they are enumerated.
         *
         * @param options Configurations to filter entries.
         */
        RecoTwEntryCollection.prototype.filter = function (options) {
            var result = this.clone();
            if (options === void 0 || options === null) {
                return result;
            }
            var re;
            if (options.body !== void 0 && options.body.length > 0) {
                if (options.regex) {
                    try {
                        re = new RegExp(options.body, "i");
                    }
                    catch (e) {
                        throw new Error(Resources.INCORRECT_REGEX);
                    }
                    result.enumerable = result.enumerable.where(function (x) { return re.test(x.content); });
                }
                else {
                    options.body = options.body.toLowerCase();
                    result.enumerable = result.enumerable.where(function (x) { return x.content.toLowerCase().contains(options.body); });
                }
            }
            if (options.usernames !== void 0 && options.usernames.length > 0) {
                var usernames = Enumerable.from(options.usernames);
                result.enumerable = result.enumerable.where(function (x) { return usernames.any(function (y) { return x.target_sn.toLowerCase() === y.toLowerCase(); }); });
            }
            if (options.id !== null) {
                result.enumerable = result.enumerable.where(function (x) { return x.tweet_id === options.id; });
            }
            return result;
        };
        return RecoTwEntryCollection;
    })();
    /**
     * The model.
     */
    var Model = (function () {
        function Model() {
        }
        /**
         * Initializes the model, starts to download the entries.
         */
        Model.init = function () {
            $.ajax({
                url: Model.RECOTW_GET_ALL_URL,
                dataType: "jsonp"
            }).done(function (data, status, xhr) {
                Model.entries = new RecoTwEntryCollection(data);
                Controller.onEntriesLoaded();
            });
        };
        /**
         * Gets an entry by Tweet ID.
         *
         * @param id The ID of the Tweet.
         */
        Model.getEntry = function (id) {
            if (Model.entries === null) {
                return null;
            }
            else {
                return Model.entries.getEnumerable().firstOrDefault(function (x) { return x.tweet_id === id; });
            }
        };
        /**
         * Gets an object to enumerate filtered and sorted entries.
         */
        Model.getEntries = function () {
            if (Model.entries === null) {
                return null;
            }
            else {
                return Model.entries.getEnumerable();
            }
        };
        /**
         * Gets a statistics information by current options. The data is cached if possible.
         *
         * @param username A username to filter.
         */
        Model.getStatistics = function () {
            if (Model.entries === null) {
                return null;
            }
            else {
                return Model.statistics !== null ? Model.statistics : (Model.statistics = Model.entries.createStatistics());
            }
        };
        /**
         * Sets options to determine how to enumerate entries.
         *
         * @param options Configurations to enumerate entries.
         */
        Model.setOptions = function (options) {
            if (Model.entries === null) {
                return null;
            }
            Model.entries = Model.entries.reset().sort(options).filter(options);
            Model.statistics = null;
        };
        /**
         * Validates an input as Tweet URL/ID or throws an error.
         *
         * @param input A string to validate.
         */
        Model.validateURLorID = function (input) {
            var match;
            if (input === void 0 || input === null || input.length === 0) {
                return null;
            }
            else if ((match = input.match(/^(?:(?:https?:\/\/(?:www\.|mobile\.)?)?twitter\.com\/(?:#!\/)?[a-zA-Z0-9_]+\/status(?:es)?\/(\d+)|(\d+))$/)) !== null) {
                return match[1] || match[2];
            }
            else {
                throw new Error(Resources.INCORRECT_URL_OR_ID);
            }
        };
        /**
         * Registers a Tweet to RecoTw as an entry.
         *
         * @param input A URL or ID of a Tweet to register.
         * @param success A callback function which would be invoked when the registration successes.
         * @param error A callback function which would be invoked when the registration fails.
         */
        Model.postEntriesFromInputs = function (inputs, success, error) {
            var ids = [];
            Enumerable.from(inputs).forEach(function (x) { return ids[ids.length] = Model.validateURLorID(x); });
            $.ajax({
                url: this.RECOTW_POST_URL,
                type: "POST",
                data: {
                    id: ids[0],
                },
                dataType: "json"
            }).done(function (data, status, xhr) {
                success(data);
            }).fail(function (xhr, status, e) {
                var response = xhr.responseJSON;
                if (!response || !response.errors) {
                    error(Resources.POST_ERRORS.UNKNOWN_ERROR);
                }
                else {
                    error(Resources.POST_ERRORS[response.errors[0].code] || response.errors[0].message);
                }
            });
        };
        /**
         * Creates a Twitter status URL.
         *
         * @param item An object that contains the ID of the Tweet or itself.
         */
        Model.createStatusURL = function (item) {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_STATUS_URL, item);
            }
            else {
                var entry = item;
                if (entry.target_sn !== void 0 && entry.tweet_id !== void 0) {
                    return String.format(Model.TWITTER_STATUS_URL.replace(/show/, entry.target_sn), entry.tweet_id);
                }
                else {
                    throw new Error(Resources.FAILED_TO_GENERATE_STATUS_URL);
                }
            }
        };
        /**
         * Creates a Twitter user URL.
         *
         * @param item An object that contains the screen_name of the user, or itself.
         */
        Model.createUserURL = function (item) {
            if (typeof item === "string") {
                return String.format(Model.TWITTER_USER_URL, item);
            }
            else {
                var entry = item;
                if (entry.target_sn !== void 0) {
                    return String.format(Model.TWITTER_USER_URL, entry.target_sn);
                }
                else {
                    throw new Error(Resources.FAILED_TO_GENERATE_USER_URL);
                }
            }
        };
        /**
         * Creates a profile image URL.
         *
         * @param item An object that contains the screen_name of the user or itself.
         */
        Model.createProfileImageURL = function (item) {
            if (item === null) {
                return Model.ALTERNATIVE_ICON_URL;
            }
            else if (typeof item === "string") {
                return String.format(Model.TWITTER_PROFILE_IMAGE_URL, item);
            }
            else {
                var entry = item;
                if (entry.target_sn !== void 0) {
                    return String.format(Model.TWITTER_PROFILE_IMAGE_URL, entry.target_sn);
                }
                else {
                    throw new Error(Resources.FAILED_TO_GENERATE_PROFILE_IMAGE_URL);
                }
            }
        };
        /**
         * Sets a search query string from options.
         *
         * @param options Options to create a search query.
         */
        Model.setSearchQueryString = function (options) {
            if (history && history.pushState) {
                history.pushState(null, null, location.pathname + options.toQueryString());
            }
            else {
                location.hash = options.toQueryString().slice(1);
            }
        };
        /**
         * Starts polling to observe whether new entries would be registered or not.
         */
        Model.startPolling = function () {
            if (Model.pollingID !== null) {
                return;
            }
            Model.pollingID = window.setInterval(function () {
                $.ajax({
                    url: Model.RECOTW_COUNT_URL,
                    type: "GET",
                    dataType: "jsonp"
                }).done(function (data, status, xhr) {
                    if (data.count > Model.entries.getAllLength()) {
                        Model.downloadLatestEntries().then(function () { return Controller.onNewEntries(); });
                    }
                });
            }, Model.POLLING_INTERVAL);
        };
        /**
         * Stops RecoTw polling.
         */
        Model.stopPolling = function () {
            window.clearInterval(Model.pollingID);
            Model.pollingID = null;
        };
        Model.downloadLatestEntries = function () {
            return $.ajax({
                url: Model.RECOTW_GET_ALL_URL,
                dataType: "jsonp"
            }).done(function (data, status, xhr) {
                var dfd = $.Deferred();
                dfd.resolve(Model.entries.addRange(Enumerable.from(data).skip(Model.entries.getAllLength())));
                return dfd;
            });
        };
        Model.ALTERNATIVE_ICON_URL = "./images/none.png";
        Model.TWITTER_STATUS_URL = "https://twitter.com/show/status/{0}";
        Model.TWITTER_USER_URL = "https://twitter.com/{0}";
        Model.TWITTER_PROFILE_IMAGE_URL = "http://www.paper-glasses.com/api/twipi/{0}/";
        Model.RECOTW_GET_ALL_URL = "http://recotw.tk/api/tweet/get_tweet_all";
        Model.RECOTW_POST_URL = "http://recotw.tk/api/tweet/record_tweet";
        Model.RECOTW_COUNT_URL = "http://recotw.tk/api/tweet/count_tweet";
        Model.POLLING_INTERVAL = 20000;
        Model.entries = null;
        Model.statistics = null;
        Model.pollingID = null;
        return Model;
    })();
    /**
     * The view.
     */
    var View = (function () {
        function View() {
        }
        View.getTabFromID = function (id) {
            switch (id) {
                case "home-tab":
                    return 1 /* Home */;
                case "statistics-tab":
                    return 2 /* Statistics */;
                default:
                    return 0 /* None */;
            }
        };
        View.getCurrentTab = function () {
            return View.getTabFromID($(".tab-pane.active").attr("id"));
        };
        View.setCurrentTab = function (tab) {
            switch (tab) {
                case 1 /* Home */:
                    return $("a[href='#home-tab']").tab("show");
                case 2 /* Statistics */:
                    return $("a[href='#statistics-tab]").tab("show");
                default:
                    return null;
            }
        };
        View.renderHome = function () {
            $("#no-result-container").hide();
            Controller.setLoadingState(false);
            var entries = Model.getEntries();
            if (entries.isEmpty()) {
                $("#no-result-container").fadeIn();
                return;
            }
            entries.skip(View.current).take(View.TWEETS_COUNT).forEach(function (entry) {
                twttr.widgets.createTweet(entry.tweet_id, $("#main-area")[0], { lang: "ja" }).then($.proxy(function (widgetID, entry, element) {
                    if (!element) {
                        View.showStatusLoadFailedMessage(widgetID, entry);
                    }
                }, null, ++View.widgetID, entry));
            });
            View.current += View.TWEETS_COUNT;
        };
        View.renderStatistics = function (username) {
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
                }
                else {
                    $("#statistics-filter").text("");
                }
                if (statistics.entryLength === 0) {
                    $("#statistics-chart").hide();
                    $("#no-result-container").fadeIn();
                    return;
                }
                else {
                    $("#statistics-chart").show();
                }
                View.chart.draw(statistics.dataTable, View.GRAPH_OPTIONS);
            }
            View.renderStatisticsTable(username, statistics);
        };
        View.renderStatisticsTable = function (username, statistics) {
            // Counts colored slices in the chart.
            var colored = Enumerable.from(statistics.users).count(function (x, y) { return x.count / statistics.entryLength > View.GRAPH_OPTIONS.sliceVisibilityThreshold; });
            var $table = $("#statistics-table").empty();
            var html = "";
            username = username !== void 0 ? username.toLowerCase() : void 0;
            var isTarget = function (x) { return username === void 0 || x.toLowerCase().startsWith(username); };
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
            }
            else {
                $table.append(html);
            }
        };
        View.clearHome = function () {
            View.current = 0;
            $("#main-area").empty();
        };
        View.setSearchKeywords = function (options) {
            $("#search-box").val(options.toKeywords());
        };
        View.postEntries = function () {
            var inputs = $("#new-record-modal input[type='text']").map(function () {
                return $(this).val();
            }).get();
            try {
                Model.postEntriesFromInputs(Enumerable.from(inputs).where(function (x) { return x.length > 0; }).toArray(), View.showPostSuccessMessage, View.showPostFailedMessage);
                $("#new-record-modal").modal("hide");
            }
            catch (e) {
                $("#inputPostStatus").val("").focus();
                $("#new-record-modal .modal-dialog").shake(2, 18, 300);
            }
        };
        View.showPostSuccessMessage = function (response) {
            var $elm = $("#post-result");
            $elm.hide();
            $elm[0].className = "alert alert-success";
            $("#post-failed").hide();
            $("#post-success").show();
            $elm.fadeIn();
        };
        View.showPostFailedMessage = function (error) {
            var $elm = $("#post-result");
            $elm.hide();
            $elm[0].className = "alert alert-danger";
            $("#post-success").hide();
            $("#post-failed").show();
            $("#post-failed-reason").text(error);
            $elm.fadeIn();
        };
        View.replaceLinkToURL = function (target) {
            return target.replace(/[\r\n]/g, "<br>").replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, function (s) { return String.format(Resources.LINK_TO_URL_HTML, s); });
        };
        View.showStatusLoadFailedMessage = function (widgetID, entry) {
            $("#twitter-widget-" + widgetID).after(String.format(Resources.TWEET_REMOVED_HTML, Model.createStatusURL(entry), Model.createProfileImageURL(entry), Model.createUserURL(entry), entry.target_sn, View.replaceLinkToURL(entry.content))).remove();
        };
        View.TWEETS_COUNT = 25;
        View.GRAPH_COLORS = [
            0xcccccc,
            0x3366cc,
            0xdc3912,
            0xff9900,
            0x109618,
            0x990099,
            0x0099c6,
            0xdd4477,
            0x66aa00,
            0xb82e2e,
            0x316395,
            0x994499,
            0x22aa99,
            0xaaaa11,
            0x6633cc,
            0xe67300,
            0x8b0707,
            0x651067,
            0x329262,
            0x5574a6,
            0x3b3eac,
            0xb77322,
            0x16d620,
            0xb91383,
            0xf4359e,
            0x9c5935,
            0xa9c413,
            0x2a778d,
            0x668d1c,
            0xbea413,
            0x0c5922,
            0x743411,
        ];
        View.GRAPH_OPTIONS = {
            backgroundColor: "#FEFEFE",
            chartArea: {
                width: "90%",
                height: "100%"
            },
            is3D: true,
            legend: "none",
            sliceVisibilityThreshold: 0.0099,
            width: 400,
            height: 400,
        };
        View.chart = null;
        View.current = 0;
        View.widgetID = -1;
        return View;
    })();
    /**
     * The controller.
     */
    var Controller = (function () {
        function Controller() {
        }
        Controller.getOptions = function () {
            return Controller.options;
        };
        Controller.setOptions = function (options, sortOnly, setQuery, setKeywords) {
            try {
                Model.setOptions(Controller.options = options);
            }
            catch (e) {
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
                document.title = String.format(Resources.PAGE_TITLE_SEARCH_RESULT, options.toKeywords());
            }
            else {
                $("#clear-search-filter").hide();
                document.title = Resources.PAGE_TITLE_NORMAL;
            }
            $("#statistics-filter-textbox").val("");
            if (Model.getEntries() === null) {
                return;
            }
            var current = View.getCurrentTab();
            if (current === 2 /* Statistics */) {
                View.clearHome();
                if (sortOnly) {
                    Controller.homeRendered = false;
                }
                else {
                    Controller.reload();
                }
            }
            else {
                Controller.reload();
            }
        };
        Controller.setLoadingState = function (state) {
            Controller.loading = state;
        };
        Controller.main = function () {
            $("#app-version").text(APP_VERSION);
            Model.init();
            google.load("visualization", "1.0", { "packages": ["corechart"] });
            $("#loading-recotw").show();
            Controller.setOptions(Options.fromQueryString(location.search, 2 /* Descending */, 1 /* RecordedDate */), false, false, true);
            $(window).bottom({ proximity: 0.05 });
            $(window).on("bottom", function () {
                if (View.getCurrentTab() === 1 /* Home */) {
                    Controller.onPageBottom();
                }
            });
            $(".navbar-nav a[role='tab']").on("shown.bs.tab", function ($event) {
                var getTab = function (tab) { return View.getTabFromID(tab.href.substring(tab.href.lastIndexOf("#") + 1)); };
                Controller.onTabSwitched(getTab($event.relatedTarget), getTab($event.target));
            });
            $("#clear-search-filter").click(function () {
                Controller.setOptions(new Options(), false, true, true);
            });
            $(".order-radio-box").change(function () {
                Controller.options.order = Controller.getOrder();
                Controller.options.orderBy = Controller.getOrderBy();
                Controller.setOptions(Controller.options, true, false, false);
            });
            $("#search-form").submit(function ($event) {
                $event.preventDefault();
                Controller.setOptions(Options.fromKeywords($("#search-box").val(), Controller.getOrder(), Controller.getOrderBy()), false, true, false);
            });
            $(window).on("popstate", function () {
                Controller.setOptions(Options.fromQueryString(location.search, Controller.getOrder(), Controller.getOrderBy()), false, false, true);
            });
            $("#reload-entries-link").click(function () {
                $("#polling-result").fadeOut();
                Controller.showNewStatuses();
            });
            $("#new-record-form").submit(function ($event) {
                $event.preventDefault();
                View.postEntries();
            });
            $("#new-record-modal").on("shown.bs.modal", function () {
                $("#new-record-form .url-box").focus();
            });
            $("#new-record-modal").on("hidden.bs.modal", function () {
                $("#new-record-form .modal-body").empty().html(Resources.URL_INPUT_AREA);
            });
            $("#post-result-close").click(function () {
                $("#post-result").fadeOut();
            });
            $("#polling-result-close").click(function () {
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
        };
        Controller.getOrder = function () {
            return $(".order-radio-box:checked").index(".order-radio-box") % 2 + 1;
        };
        Controller.getOrderBy = function () {
            return (($(".order-radio-box:checked").index(".order-radio-box") / 2) ^ 0) + 1;
        };
        Controller.reload = function () {
            if (Model.getEntries() === null) {
                return;
            }
            switch (View.getCurrentTab()) {
                case 1 /* Home */:
                    View.clearHome();
                    View.renderHome();
                    $("#statistics-filter-textbox").val("");
                    Controller.homeRendered = true;
                    Controller.statisticsRendered = false;
                    break;
                case 2 /* Statistics */:
                    View.renderStatistics();
                    Controller.homeRendered = false;
                    Controller.statisticsRendered = true;
                    break;
            }
        };
        Controller.onEntriesLoaded = function () {
            $("#loading-recotw").fadeOut();
            $("#loading-panel-container").fadeOut();
            if (Model.getEntries() === null) {
                return;
            }
            Model.startPolling();
            Controller.setOptions(Controller.options, false, false, true);
        };
        Controller.onNewEntries = function () {
            $("#polling-result").fadeIn();
        };
        Controller.onTabSwitched = function (previous, current) {
            switch (current) {
                case 1 /* Home */:
                    if (!Controller.homeRendered) {
                        View.renderHome();
                        Controller.homeRendered = true;
                    }
                    break;
                case 2 /* Statistics */:
                    $("#statistics-filter-textbox").focus();
                    window.setTimeout(function () { return $("#statistics-table").animate({ scrollTop: 0 }, 400); }, 100);
                    if (!Controller.statisticsRendered) {
                        View.renderStatistics();
                        Controller.statisticsRendered = true;
                    }
                    break;
            }
        };
        Controller.onPageBottom = function () {
            if (Controller.loading) {
                return;
            }
            Controller.loading = true;
            View.renderHome();
        };
        Controller.onImageError = function (element) {
            element.src = Model.createProfileImageURL(null);
        };
        Controller.onChartSliceClick = function (slice) {
            var id = slice.targetID;
            if (!id.contains("#")) {
                return;
            }
            Controller.setSearchFilterByUsername(Model.getStatistics().users[+id.substring(id.indexOf("#") + 1)].target_sn);
        };
        Controller.onNewRecordFormTextBoxValueChanged = function () {
            var $elements = $(".url-input-area");
            var inputs = $(".url-box").map(function () {
                return $(this).val();
            }).get();
            $elements.each(function (index) {
                $(this).removeClass("has-success has-error");
                try {
                    if (Model.validateURLorID(inputs[index]) !== null) {
                        $(this).addClass("has-success");
                    }
                }
                catch (e) {
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
        };
        Controller.setSearchFilterByUsername = function (username) {
            View.setCurrentTab(1 /* Home */);
            Controller.options.usernames = [username];
            Controller.setOptions(Controller.options, false, true, true);
        };
        Controller.setChartFilterByUsername = function (username) {
            View.renderStatistics(username);
        };
        Controller.showNewStatuses = function () {
            View.setCurrentTab(1 /* Home */);
            Controller.setOptions(new Options([], "", null, false, Controller.options.order, Controller.options.orderBy), false, true, true);
            Controller.reload();
        };
        Controller.options = new Options();
        Controller.loading = false;
        Controller.homeRendered = false;
        Controller.statisticsRendered = false;
        return Controller;
    })();
    RecoTwExplorer.Controller = Controller;
    Controller.main();
})(RecoTwExplorer || (RecoTwExplorer = {}));
//# sourceMappingURL=recotw.js.map