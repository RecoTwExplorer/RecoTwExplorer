/*
 * libstring - Copyright 2014, Chitoku
 * http://chitoku.jp/
 *
 * Licensed under MIT License
 * http://www.opensource.org/licenses/mit-license
 */
String.prototype.contains = function (s) {
    return this.indexOf(s) !== -1;
};
String.prototype.repeat = function (n) {
    return n > 0 ? Array(n + 1).join(this) : "";
};
String.prototype.startsWith = function (s) {
    return this.indexOf(s) === 0;
};
String.prototype.endsWith = function (s) {
    return this.lastIndexOf(s) === this.length - s.length;
};
String.format = function (format) {
    function thousandSeparate(str) {
        var num = str.split(".");
        return num[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + (num[1] !== undefined ? "." + num[1] : "");
    }
    function round(str, digit, defaultDigit) {
        digit = isNaN(digit) ? defaultDigit : digit;
        var p = Math.pow(10, digit);
        str = String(Math.round(+str * p) / p);
        if (digit === 0) {
            return str;
        }
        return str + (str.contains(".") ? "0".repeat(digit - (str.length - str.indexOf(".") - 1)) : "." + "0".repeat(digit));
    }
    function emptyForZero(s) {
        return +s === 0 ? "" : s;
    }
    function formatDate(value, option) {
        var AD = "西暦";
        var MONTHS_LONG = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        var MONTHS_SHORT = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        var DAYS_LONG = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
        var DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
        var AM_PM = ["午前", "午後"];
        switch (option) {
            case "d":
                return String.format("{0:yyyy/MM/dd}", value);
            case "D":
                return String.format("{0:yyyy年M月d日}", value);
            case "t":
                return String.format("{0:H:mm}", value);
            case "T":
                return String.format("{0:H:mm:ss}", value);
            case "f":
                return String.format("{0:yyyy年M月d日 H:mm}", value);
            case "F":
                return String.format("{0:yyyy年M月d日 H:mm:ss}", value);
            case "g":
                return String.format("{0:yyyy/MM/dd H:mm}", value);
            case "G":
            case void 0:
                return String.format("{0:yyyy/MM/dd H:mm:ss}", value);
            case "y":
            case "Y":
                return String.format("{0:yyyy年M月}", value);
            case "m":
            case "M":
                return String.format("{0:M月d日}", value);
            case "r":
            case "R":
                return value.toUTCString();
            case "o":
            case "O":
                return String.format("{0:yyyy-MM-ddTHH:mm:ss.fffffff}", value);
            case "s":
                return String.format("{0:yyyy-MM-ddTHH:mm:ss}", value);
            case "u":
                return String.format("{0:yyyy-MM-dd HH:mm:ssZ}", value);
            case "U":
                return String.format("{0:D4}年{1}月{2}日 {3}:{4:D2}:{5:D2}", value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate(), value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds());
        }
        return option.replace(/d{4,}/g, function () { return DAYS_LONG[value.getDay()]; }).replace(/ddd/g, function () { return DAYS_SHORT[value.getDay()]; }).replace(/d+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getDate()); }).replace(/f+/g, function (x) { return value.getMilliseconds() + "0".repeat(x.length).slice(0, x.length - 1); }).replace(/F+/g, function (x) { return emptyForZero((value.getMilliseconds() + "0".repeat(x.length)).slice(0, x.length)); }).replace(/g+/g, function () { return AD; }).replace(/h+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getHours() > 12 ? value.getHours() - 12 : value.getHours()); }).replace(/H+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getHours()); }).replace(/K/g, function () { return "Z"; }).replace(/m+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getMinutes()); }).replace(/MMMM/g, function () { return MONTHS_LONG[value.getMonth()]; }).replace(/MMM/g, function () { return MONTHS_SHORT[value.getMonth()]; }).replace(/M+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getMonth() + 1); }).replace(/s+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getSeconds()); }).replace(/t{2,}/g, function () { return value.getHours() <= 12 ? AM_PM[0] : AM_PM[1]; }).replace(/t/g, function () { return (value.getHours() <= 12 ? AM_PM[0] : AM_PM[1]).charAt(0); }).replace(/y+/g, function (x) { return String.format("{0:D" + x.length + "}", value.getFullYear()); }).replace(/zzz/g, function () { return "+00:00"; }).replace(/zz/g, function () { return "+00"; }).replace(/z/g, function () { return "+0"; });
    }
    function formatNumber(value, option) {
        if (option === void 0) {
            return value;
        }
        var match;
        if ((match = option.match(/^[Cc](\d+)?$/))) {
            return "¥" + thousandSeparate(round(value, +match[1], 0));
        }
        if ((match = option.match(/^[Dd](\d+)?$/))) {
            value = String(Math.round(+value));
            var length = (match[1] === void 0 ? 0 : +match[1]) - value.length;
            if (+value < 0) {
                return "-" + "0".repeat(length + 1) + value.slice(1);
            }
            else {
                return "0".repeat(length) + value;
            }
        }
        if ((match = option.match(/^([Ee])(\d+)?$/))) {
            var length = match[2] === void 0 ? 6 : +match[2];
            return (+value).toExponential(length).replace(/[Ee]/, match[1]);
        }
        if ((match = option.match(/^[Ff](\d+)?$/))) {
            return round(value, +match[1], 2);
        }
        if ((match = option.match(/^[Nn](\d+)?$/))) {
            return thousandSeparate(round(value, +match[1], 2));
        }
        if ((match = option.match(/^[Pp](\d+)?$/))) {
            return thousandSeparate(round(String(+value * 100), +match[1], 2)) + " %";
        }
        if ((match = option.match(/(^[Xx])(\d+)?$/))) {
            value = match[1] === "X" ? (+value).toString(16).toUpperCase() : (+value).toString(16).toLowerCase();
            return "0".repeat((+match[2] || value.length) - value.length) + value;
        }
        return value;
    }
    var args = arguments;
    return format.replace(/{(\d+)(?::([^}]+))?\}/g, function (str, m1, m2, offset, target) {
        var value = args[+m1 + 1];
        if (value instanceof Date) {
            return formatDate(value, m2);
        }
        if (!isNaN(+value)) {
            return formatNumber(String(value), m2);
        }
        return value;
    });
};
//# sourceMappingURL=libstring.js.map