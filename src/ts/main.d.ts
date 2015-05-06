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

interface Navigator {
    standalone: boolean;
}
