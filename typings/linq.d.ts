/* eslint-disable @typescript-eslint/method-signature-style */

declare namespace Enumerable {
    export interface IEnumerable<T> {
        orderBy<TKey>(keySelector: (element: T) => TKey, comparer: (first: TKey, second: TKey) => number): IOrderedEnumerable<T>;
        orderByDescending<TKey>(keySelector: (element: T) => TKey, comparer: (first: TKey, second: TKey) => number): IOrderedEnumerable<T>;
    }
}
