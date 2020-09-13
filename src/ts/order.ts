/**
 * Specifies how entries are sorted.
 */
export const enum Order {

    /**
     * The default. No sort order is specified.
     */
    none = 0,

    /**
     * Entries are sorted in ascending order.
     */
    ascending = 1,

    /**
     * Entries are sorted in descending order.
     */
    descending = 2,

    /**
     * Entries are shuffled.
     */
    shuffle = 3,
}

/**
 * Specifies by how entries are sorted.
 */
export const enum OrderBy {

    /**
     * The default. No sort target is specified.
     */
    none = 0,

    /**
     * Entries are sorted by their record_date values.
     */
    recordedDate = 1,

    /**
     * Entries are sorted by their tweet_id values.
     */
    createdDate = 2,
}
