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

    class Bookmarklet {
        private WINDOW_DEFAULT_HEIGHT = 375;
        private WIDGET_DEFAULT_HEIGHT = 160;
        private RECOTW_POST_URL = "http://api.recotw.black/1/tweet/record_tweet";
        private WIDGET_OPTIONS: TwitterTweetWidgetOptions = {
            lang: "ja",
            linkColor: "#774c80",
            conversation: "none",
            cards: "hidden"
        };
        private POST_ERRORS: {
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

        private _id: string;

        public constructor(id: string) {
            this._id = id;
        }

        public static init(parameters: string): Bookmarklet {
            const queries = parameters.substring(1).split("&").map(x => x.split("="))
                                                              .filter(x => x.length === 2)
                                                              .map(x => ({ property: x[0], value: decodeURIComponent(x[1]) }));

            const ids = queries.filter(x => x.property === "id");
            if (ids.length === 0) {
                return null;
            }

            const instance = new Bookmarklet(ids[0].value).renderTweet();
            $("#register-button").click(() => instance.register.call(instance));
            $("#cancel-button").click(() => window.close());
            return instance;
        }

        private fitToContent(elm: HTMLElement): void {
            if (window.innerHeight <= this.WINDOW_DEFAULT_HEIGHT + 20) {
                window.resizeTo(window.outerWidth, window.outerHeight + $(elm).height() - this.WIDGET_DEFAULT_HEIGHT);
            }
        }

        private renderTweet(): Bookmarklet {
            if (this._id.length === 0) {
                $("#id-error").fadeIn();
                return this;
            }
            if (!twttr.widgets) {
                twttr.ready(this.renderTweet.bind(this));
                return this;
            }
            twttr.widgets.createTweet(this._id, $("#tweet-widget")[0], this.WIDGET_OPTIONS).then((elm: HTMLIFrameElement) => {
                if (elm) {
                    const $contents = $(elm).contents();
                    $contents.find(".Tweet-brand .u-hiddenInNarrowEnv").hide();
                    $contents.find(".Tweet-brand .u-hiddenInWideEnv").css("display", "inline-block");
                    $contents.find(".Tweet-author").css("max-width", "none");
                    $("#toolbar").show();
                    this.fitToContent(elm);
                } else {
                    $("#not-available").fadeIn();
                }
            });
            return this;
        }

        private register(): JQueryPromise<RecoTwRecordResponse> {
            const $main = $("#page-main").fadeOut();
            $main.promise().done(() => $main.text("しばらくお待ちください...").addClass("border-box").fadeIn());
            return $.ajax({
                url: this.RECOTW_POST_URL,
                type: "POST",
                data: { id: this._id },
                dataType: "json"
            }).done(() => {
                const $timer = $("#close-timer");
                let remaining = 5;
                const interval = window.setInterval(() => {
                    $timer.text(--remaining);
                    if (remaining === 0) {
                        window.clearInterval(interval);
                        window.setTimeout(() => {
                            $("#page-done").text("登録完了: ウィンドウを閉じてください。");
                        }, 50);
                        window.close();
                    }
                }, 1000);
                $main.fadeOut().promise().done(() => $("#page-done").fadeIn());
            }).fail((xhr: JQueryXHR, status: string, e: Error) => {
                let message: string;
                const response = <RecoTwErrorResponse>xhr.responseJSON;
                if (!response || !response.errors) {
                    message = this.POST_ERRORS.UNKNOWN_ERROR;
                } else {
                    message = this.POST_ERRORS[response.errors[0].code] || response.errors[0].message;
                }
                $("#fail-reason").text(message);
                $main.fadeOut().promise().done(() => $("#page-fail").fadeIn());
            });
        }
    }

    Bookmarklet.init(location.search);
}
