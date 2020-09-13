import $ from "jquery";
import { PAGE_TITLE_NORMAL } from "./resources";
import type { Options } from "./options";

/**
 * The view.
 */
export class View {
    private static _title = PAGE_TITLE_NORMAL;

    public static set title(title: string) {
        View._title = title = title || View._title;
        document.title = title;
    }

    public static setSearchKeywords(options: Options): void {
        $("#search-box").val(options.toKeywords());
    }
}
