declare module RecoTwExplorer {
    /**
     * The interface for a response of /api/tweet/count_tweet.
     */
    interface RecoTwCountResponse {
        /**
         * A number of entries.
         */
        count: number;
    }

    /**
     * The interface for an error of RecoTw.
     */
    interface RecoTwError {
        /**
         * A message which describes the error.
         */
        message: string;
        /**
         * An error code.
         */
        code: number;
    }

    /**
     * The interface for a response represents errors.
     */
    interface RecoTwErrorResponse {
        /**
         * The errors.
         */
        errors: RecoTwError[];
    }

    /**
     * The interface for an entry of RecoTw.
     */
    interface RecoTwEntry {
        /**
         * The ID of the entry.
         */
        id: string;
        /**
         * The ID of a Tweet of the entry.
         */
        tweet_id: string;
        /**
         * The raw content of the entry.
         */
        content: string;
        /**
         * The ID of a Twitter user, who posted the Tweet.
         */
        target_id: string;
        /**
         * The screen_name of a Twitter user, who posted the Tweet.
         */
        target_sn: string;
        /**
         * The date at which the entry was registered.
         */
        record_date: string;
    }

    /**
     * The interface for a response of /api/tweet/record_tweet.
     */
    interface RecoTwRecordResponse extends RecoTwEntry {
        /**
         * The result of the request.
         */
        result: boolean;
    }

    /**
     * The interface for a user of RecoTw.
     */
    interface RecoTwUser {
        /**
         * The screen_name of a Twitter user, who posted the Tweets.
         */
        target_sn: string;
        /**
         * A number of Tweets which RecoTw has registered.
         */
        count: number;
    }
}

interface JQuery {
    /**
     * Shakes the matched elements.
     */
    shake(shakes: number, distance: number, duration: number): JQuery;
    /**
     * Adds a "bottom" event that will be triggered when the user has scrolled to the bottom or within proximity to the bottom of an element.
     */
    bottom(options?: JQueryBottomOptions): JQuery;
}

interface JQueryBottomOptions {
    proximity?: number;
}
