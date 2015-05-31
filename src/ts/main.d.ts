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

interface Favico {
    new (): Favico;
    new (options: FavicoOptions): Favico;
    badge(number: number): void;
    badge(value: string): void;
    image(imageElement: HTMLImageElement): void;
    video(videoElement: HTMLVideoElement): void;
    video(action: string): void;
    webcam(action: string): void;
    reset(): void;
}

interface FavicoOptions {
    bgColor?: string;
    textColor?: string;
    fontFamily?: string;
    fontStyle?: string | number;
    type?: string;
    position?: string;
    animation?: string;
    elementId?: string | boolean;
    element?: Element | boolean;
    dataUrl?: (url: string) => any;
}

declare var Favico: Favico;
