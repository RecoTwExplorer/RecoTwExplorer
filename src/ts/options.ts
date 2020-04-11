import { Order, OrderBy } from "./order";

/**
 * Configurations to filter and sort entries.
 */
export class Options {
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
    public constructor(
        public usernames: string[] = [],
        public body: string = "",
        public id: string | null = null,
        public regex: boolean = false,
        public order: Order = Order.Descending,
        public orderBy: OrderBy = OrderBy.RecordedDate,
    ) {}

    private isFilteredByUsernames(): boolean {
        return this.usernames.length > 0;
    }

    private isFilteredByID(): boolean {
        return this.id !== null;
    }

    private isFilteredByBody(): boolean {
        return this.body.length > 0;
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
            queries[queries.length] = `username=${encodeURIComponent(this.usernames.join(","))}`;
        }
        if (this.isFilteredByID()) {
            queries[queries.length] = `id=${encodeURIComponent(String(this.id))}`;
        }
        if (this.isFilteredByBody()) {
            if (this.regex) {
                queries[queries.length] = `body=${encodeURIComponent(`/${this.body}/`)}`;
            } else {
                queries[queries.length] = `body=${encodeURIComponent(this.body)}`;
            }
        }
        if (queries.length > 0) {
            return `?${queries.join("&")}`;
        }
        return "";
    }

    /**
     * Converts the options to a keywords string.
     */
    public toKeywords(): string {
        const keywords: string[] = [];
        if (this.isFilteredByUsernames()) {
            keywords[keywords.length] = `from:${this.usernames.join(",")}`;
        }
        if (this.isFilteredByID()) {
            keywords[keywords.length] = `id:${String(this.id)}`;
        }
        if (this.isFilteredByBody()) {
            if (this.regex) {
                keywords[keywords.length] = `/${this.body}/`;
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
        const queries = queryString.substring(1).split("&")
            .map(x => x.split("="))
            .filter(x => x.length === 2)
            .map(x => ({ property: x[0], value: decodeURIComponent(x[1]) }));

        queries.filter(x => x.property === "body").forEach(x => {
            let match: RegExpMatchArray | null;
            if ((match = /^\/.+\/$/u.exec(x.value)) !== null) {
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
        let match: RegExpMatchArray | null;

        for (const value of keywords.split(" ")) {
            if ((match = /^from:(?<name>[a-zA-Z0-9_]+(?:,[a-zA-Z0-9_]+)*)$/u.exec(value)) !== null) {
                options.usernames = match[1].split(",");
                continue;
            }
            if ((match = /^id:(\d+)$/u.exec(value)) !== null) {
                options.id = match[1];
                continue;
            }
            options.body += value;
        }
        if ((match = /^\/(.*)\/$/u.exec(options.body)) !== null) {
            options.body = match[1];
            options.regex = true;
        }
        return options;
    }
}
