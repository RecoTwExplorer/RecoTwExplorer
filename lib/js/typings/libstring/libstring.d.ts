/*
 * libstring - Copyright 2014, Chitoku
 * http://chitoku.jp/
 *
 * Licensed under MIT License
 * http://www.opensource.org/licenses/mit-license
 */

interface String {
    contains(s: string): boolean;
    repeat(n: number): string;
    startsWith(s: string): boolean;
    endsWith(s: string): boolean;
}

interface StringConstructor {
    format(format: string, ...args: any[]): string;
}
