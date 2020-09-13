import $ from "jquery";
import sffjs from "sffjs";
import { RecoTwEntryCollection } from "./entry";
import type { RecoTwStatistics } from "./statistics";
import type { Options } from "./options";
import { Controller } from "./controller";

const ALTERNATIVE_ICON_URL = "./images/none.png";
const TWITTER_STATUS_URL = "https://twitter.com/show/status/{0}";
const TWITTER_USER_URL = "https://twitter.com/{0}";
const TWITTER_PROFILE_IMAGE_URL = "/api/icon/{0}/";
const RECOTW_GET_ALL_URL = "/api/recotw/1/tweet/get_tweet_all";
const TWITTER_SNOWFLAKE_EPOCH = 1288834974657;

/**
 * The model.
 */
export class Model {
    private static _entries: RecoTwEntryCollection | null = null;

    private static _statistics: RecoTwStatistics | null = null;

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
        const item = localStorage.getItem("entries");
        const raw = localStorage.getItem("raw");
        if (item && raw) {
            entries = JSON.parse(item) as RecoTwEntry[];
        }
        Model.fetchLatestEntries(entries).then(
            () => Controller.onEntriesLoaded(),
            () => Controller.onEntriesLoadFailed(),
        );
    }

    /**
     * Saves all the entries to localStorage.
     */
    public static save(): void {
        if (!Model.entries) {
            return;
        }
        localStorage.setItem("raw", JSON.stringify(true));
        localStorage.setItem("entries", JSON.stringify(Model.entries.reset().enumerable.toArray()));
    }

    /**
     * Gets an object to enumerate filtered and sorted entries.
     */
    public static get entries(): RecoTwEntryCollection | null {
        if (!Model._entries) {
            return null;
        }
        return Model._entries;
    }

    /**
     * Gets the latest entry on memory or returns null.
     */
    public static get latestEntry(): RecoTwEntry | null {
        if (!Model.entries) {
            return null;
        }
        return Model.entries.reset().enumerable.lastOrDefault() ?? null;
    }

    /**
     * Gets a statistics information by current options. The data is cached if possible.
     */
    public static get statistics(): RecoTwStatistics | null {
        if (!Model.entries) {
            return null;
        }
        return Model._statistics !== null
            ? Model._statistics
            : Model._statistics = Model.entries.createStatistics();
    }

    /**
     * Sets options to determine how to enumerate entries.
     * @param options Configurations to enumerate entries.
     */
    public static set options(options: Options) {
        if (!Model.entries) {
            return;
        }
        Model._entries = Model.entries.reset().sort(options)
            .filter(options)
            .memoize();
        Model._statistics = null;
    }

    /**
     * Gets a value that determines if the app is running on a mobile device.
     */
    public static isMobile(): boolean {
        return (/iPhone|iP[ao]d|Android|Windows.*Phone/u).test(navigator.userAgent);
    }

    /*
     * Escapes a string as HTML.
     * @param str The string to escape.
     */
    public static escapeHtml(str: string): string {
        return str.replace(/&/gu, "&amp;")
            .replace(/</gu, "&lt;")
            .replace(/>/gu, "&gt;");
    }

    /*
     * Unescapes an HTML string.
     * @param str The string to unescape.
     */
    public static unescapeHtml(str: string): string {
        return str.replace(/&lt;/gu, "<")
            .replace(/&gt;/gu, ">")
            .replace(/&amp;/gu, "&");
    }

    /**
     * Retrieves new entries from the remote.
     * @param entries The entries to initialize with.
     */
    public static async fetchLatestEntries(entries: RecoTwEntry[]): Promise<RecoTwEntry[]> {
        let sinceID: number | undefined;
        const latestEntry = Model.latestEntry;
        if (latestEntry) {
            sinceID = Number(latestEntry.id) + 1;
        } else if (entries.length > 0) {
            sinceID = Number(entries[entries.length - 1].id) + 1;
        }

        const deferred = $.Deferred<RecoTwEntry[]>();
        $.ajax({
            url: RECOTW_GET_ALL_URL,
            dataType: "json",
            data: { since_id: sinceID },
        }).then((data: RecoTwEntry[], status: string, xhr: JQueryXHR) => {
            if (Model.entries === null) {
                Model._entries = new RecoTwEntryCollection(entries);
            }
            data.forEach(x => x.content = Model.unescapeHtml(x.content));
            if (Model.entries && data.length > 0) {
                Model.entries.addRange(data);
            }
            deferred.resolve(data);
        }, (xhr: JQueryXHR, status: JQuery.Ajax.ErrorTextStatus) => {
            deferred.reject(xhr);
        });
        return deferred.promise();
    }

    /**
     * Creates a Twitter status URL.
     * @param item An object that contains the ID of the Tweet or itself.
     */
    public static createStatusURL(item: string | RecoTwEntry): string {
        if (typeof item === "string") {
            return sffjs(TWITTER_STATUS_URL, item);
        }
        return sffjs(TWITTER_STATUS_URL.replace("show", item.target_sn), item.tweet_id);
    }

    /**
     * Creates a Twitter user URL.
     * @param item An object that contains the screen_name of the user, or itself.
     */
    public static createUserURL(item: string | RecoTwEntry): string {
        if (typeof item === "string") {
            return sffjs(TWITTER_USER_URL, item);
        }
        return Model.createUserURL(item.target_sn);
    }

    /**
     * Creates a profile image URL.
     * @param item An object that contains the screen_name of the user or itself.
     */
    public static createProfileImageURL(item: string | RecoTwEntry | null): string {
        if (item === null) {
            return ALTERNATIVE_ICON_URL;
        }
        if (typeof item === "string") {
            return sffjs(TWITTER_PROFILE_IMAGE_URL, item);
        }
        return Model.createProfileImageURL(item.target_sn);
    }

    /**
     * Creates a Date object.
     * @param item An object that contains the ID or itself.
     */
    public static createDateByTweetID(item: string | RecoTwEntry): Date | null {
        if (typeof item === "string") {
            // Using String conversion because JavaScript converts a Number to a 32-bit integer to perform shift operation; this is mostly same as following code:
            // New Date(((+item) >> 22) + TWITTER_SNOWFLAKE_EPOCH);
            const binary = Number(item).toString(2);
            return new Date(parseInt(binary.substr(0, binary.length - 22), 2) + TWITTER_SNOWFLAKE_EPOCH);
        }
        if (!item.tweet_id) {
            return null;
        }
        return Model.createDateByTweetID(item.tweet_id);
    }

    /**
     * Sets a search query string from options.
     * @param options Options to create a search query.
     */
    public static setSearchQueryString(options: Options): void {
        history.pushState(null, "", location.pathname + options.toQueryString());
    }
}
