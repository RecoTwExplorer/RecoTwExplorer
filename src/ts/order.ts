/**
 * Specifies how entries are sorted.
 */
export const enum Order {

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
    Shuffle,
}

/**
 * Specifies by how entries are sorted.
 */
export const enum OrderBy {

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
    CreatedDate,
}
