declare interface ShadowRoot extends Node, NodeSelector { }

declare interface HTMLElement {
    createShadowRoot(): ShadowRoot;
    shadowRoot: ShadowRoot;
}
