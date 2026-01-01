declare module 'plotly.js-dist-min' {
    const Plotly: any;
    export default Plotly;

    export interface PlotlyHTMLElement extends HTMLDivElement {
        on(event: string, handler: (eventData: any) => void): void;
        removeAllListeners?(event?: string): void;
    }

    export function newPlot(
        root: HTMLElement,
        data: any[],
        layout?: any,
        config?: any
    ): Promise<any>;

    export function purge(root: HTMLElement): void;

    export namespace Plots {
        function resize(root: HTMLElement): void;
    }

    export function relayout(
        root: HTMLElement,
        layout: any
    ): Promise<any>;
}