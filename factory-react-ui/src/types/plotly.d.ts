declare module 'plotly.js-dist-min' {
    const Plotly: any;
    export = Plotly;
    export default Plotly;

    export function newPlot(
        root: HTMLElement,
        data: any[],
        layout?: any,
        config?: any
    ): Promise<any>;

    export function purge(root: HTMLElement): void;
}