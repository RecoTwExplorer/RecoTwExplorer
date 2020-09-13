import type { IEnumerable } from "linq";
import {
    TWEETS_COUNT,
    USERNAME,
} from "./resources";

/**
 * Information which aggregates users.
 */
export class RecoTwStatistics {
    private readonly _length: number;

    private readonly _users: RecoTwUser[];

    private readonly _table: google.visualization.DataTable;

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
    public constructor(enumerable: IEnumerable<RecoTwEntry>) {
        this._length = enumerable.count();
        this._users = enumerable.groupBy(x => x.target_id)
            .select(x => ({ entry: x.firstOrDefault(), count: x.count() }))
            .select(x => ({ target_sn: x.entry?.target_sn ?? "", count: x.count, percentage: x.count / this._length }))
            .orderByDescending(x => x.count)
            .thenBy(x => x.target_sn.toLowerCase())
            .toArray();

        this._table = new google.visualization.DataTable({
            cols: [
                { type: "string", label: USERNAME },
                { type: "number", label: TWEETS_COUNT },
            ],
            rows: this.users.map(x => ({ c: [ { v: x.target_sn }, { v: x.count } ] })),
        });
    }
}
