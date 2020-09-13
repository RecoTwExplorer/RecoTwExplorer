import type { IDictionary, IEnumerable } from "linq";
import { from } from "linq";
import { RecoTwStatistics } from "./statistics";
import type { Options } from "./options";
import { Order, OrderBy } from "./order";
import { INCORRECT_REGEX } from "./resources";

/**
 * The collection of RecoTw Entries.
 */
export class RecoTwEntryCollection {
    private _elements: RecoTwEntry[];

    private readonly _userIDs: IDictionary<string, string>;

    private _enumerable: IEnumerable<RecoTwEntry>;

    /**
     * Initializes a new instance of RecoTwEntryCollection class with parameters.
     * @param elements All the entries.
     * @param userIDs A unique hash set of screen_names and user IDs.
     * @param enumerable An object to enumerate the entries.
     */
    public constructor(elements: RecoTwEntry[], userIDs?: IDictionary<string, string>, enumerable?: IEnumerable<RecoTwEntry>) {
        this._elements = elements;
        this._enumerable = enumerable ?? from(elements);

        if (userIDs) {
            this._userIDs = userIDs;
            return;
        }

        // Override all of target_sn values with the latest ones.
        this._userIDs = this.enumerable.orderByDescending(x => x.tweet_id, (x, y) => Number(x) - Number(y)).toDictionary(x => x.target_id, x => x.target_sn);
        this.enumerable.forEach(x => {
            x.target_sn = this._userIDs.get(x.target_id);
        });
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
    public get enumerable(): IEnumerable<RecoTwEntry> {
        return this._enumerable;
    }

    /**
     * Adds an item to the entries.
     * @param item The item to add.
     */
    public add(item: RecoTwEntry): void {
        if (this._elements.length === 0 || Number(item.id) > Number(this._elements[this._elements.length - 1].id)) {
            this._elements[this._elements.length] = item;
        }
    }

    /**
     * Adds items to the entries.
     * @param items The items to add.
     */
    public addRange(items: IEnumerable<RecoTwEntry> | RecoTwEntry[]): void {
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
        const order = options.order || Order.descending;
        const orderBy = options.orderBy || OrderBy.recordedDate;
        const sortCallback = (x: string, y: string): number => Number(x) - Number(y);
        switch (true) {
            case order === Order.ascending && orderBy === OrderBy.recordedDate:
                result._enumerable = result.enumerable.orderBy(x => x.record_date);
                break;
            case order === Order.ascending && orderBy === OrderBy.createdDate:
                result._enumerable = result.enumerable.orderBy(x => x.tweet_id, sortCallback);
                break;
            case order === Order.descending && orderBy === OrderBy.recordedDate:
                result._enumerable = result.enumerable.orderByDescending(x => x.record_date);
                break;
            case order === Order.descending && orderBy === OrderBy.createdDate:
                result._enumerable = result.enumerable.orderByDescending(x => x.tweet_id, sortCallback);
                break;
            case order === Order.shuffle:
                result._enumerable = result.enumerable.shuffle();
                break;
            default:
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
        if (options.body.length > 0) {
            if (options.regex) {
                try {
                    const re = new RegExp(options.body, "iu");
                    result._enumerable = result.enumerable.where(x => re.test(x.content));
                } catch (e: unknown) {
                    throw new Error(INCORRECT_REGEX);
                }
            } else {
                result._enumerable = result.enumerable.where(x => x.content.toLowerCase().includes(options.body.toLowerCase()));
            }
        }
        if (options.usernames.length > 0) {
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
