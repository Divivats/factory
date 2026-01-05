import { useEffect, useRef, useCallback, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { BarrelExecutionData } from '../../types/logTypes';

interface Props {
    barrels: BarrelExecutionData[];
    onReady?: () => void;
}

export default function LongGanttChart({ barrels, onReady }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver | null>(null);
    const resizeInProgress = useRef(false);
    const isFirstRender = useRef(true);

    const safeResize = useCallback(() => {
        if (!chartRef.current || resizeInProgress.current) return;
        resizeInProgress.current = true;
        Plotly.Plots.resize(chartRef.current)
            .then(() => { resizeInProgress.current = false; })
            .catch(() => { resizeInProgress.current = false; });
    }, []);

    const BARREL_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

    const chartData = useMemo(() => {
        const allOps = barrels.flatMap(b => b.operations);

        const opStartMap = new Map<string, number>();
        allOps.forEach(op => {
            const current = opStartMap.get(op.operationName) ?? Infinity;
            if (op.globalStartTime < current) {
                opStartMap.set(op.operationName, op.globalStartTime);
            }
        });

        const sortedOpNames = Array.from(new Set(allOps.map(op => op.operationName)))
            .sort((a, b) => (opStartMap.get(b) || 0) - (opStartMap.get(a) || 0));


        const traces: any[] = [];

        // --- TRACE A: IDEAL TIME (Bottom Row) ---
        traces.push({
            type: 'bar',
            name: 'Ideal Time',
            y: allOps.map(op => op.operationName),
            x: allOps.map(op => op.idealDuration),
            base: allOps.map(op => op.globalStartTime),
            orientation: 'h',
            offsetgroup: 'ideal',
            legendgroup: 'ideal',
            marker: {
                color: '#fbbf24',
                line: { width: 0 }
            },
            text: allOps.map(op => `${op.idealDuration}`),
            textposition: 'inside',
            textfont: { size: 10, color: '#000000', family: 'JetBrains Mono, monospace', weight: 600 },

            customdata: allOps.map(op => ({
                idealMs: op.idealDuration
            })),

            hovertemplate:
                '<b>%{y}</b><br>' +
                'Ideal Time: <b>%{customdata.idealMs} ms</b>' +
                '<extra></extra>',

            showlegend: true
        });

        // --- TRACE B, C, D: ACTUAL TIME (Top Row) ---
        BARREL_COLORS.forEach((color, i) => {
            const opsInGroup = allOps.filter(op => parseInt(op.barrelId) % 3 === i);

            if (opsInGroup.length === 0) return;

            traces.push({
                type: 'bar',
                name: 'Actual Time',
                y: opsInGroup.map(op => op.operationName),
                x: opsInGroup.map(op => op.actualDuration),
                base: opsInGroup.map(op => op.globalStartTime),
                orientation: 'h',
                offsetgroup: 'actual',
                legendgroup: 'actual',
                showlegend: i === 0,
                marker: {
                    color: color,
                    line: { width: 0 }
                },
                // Text: Duration in Black
                text: opsInGroup.map(op => `${op.actualDuration}`),
                textposition: 'inside',
                textfont: { size: 10, color: '#000000', family: 'JetBrains Mono, monospace', weight: 700 },

                hovertemplate:
                    '<b>%{y}</b><br>' +
                    'Barrel ID: <b>%{customdata[0]}</b><br>' +
                    'Start: %{base:.0f} ms<br>' +
                    'End: %{customdata[1]} ms<br>' +
                    '%{customdata[2]}<extra></extra>',

                customdata: opsInGroup.map(op => [
                    op.barrelId,
                    (op.globalStartTime + op.actualDuration).toFixed(0),
                    op.actualDuration > op.idealDuration ? '⚠ <b>Delayed</b>' : '',
                ])
            });
        });

        return { traces, categoryOrder: sortedOpNames };
    }, [barrels]);

    const updateChart = useCallback(() => {
        if (!chartRef.current || barrels.length === 0) return;

        const { traces, categoryOrder } = chartData;

        const layout: Partial<Plotly.Layout> = {
            xaxis: {
                title: {
                    text: 'Timeline (ms)',
                    font: { size: 13, color: '#94a3b8', family: 'Inter, sans-serif' },
                    standoff: 20
                },
                tickfont: { size: 11, color: '#94a3b8', family: 'JetBrains Mono, monospace' },
                rangemode: 'tozero',
                tickmode: 'auto',
                tick0: 0,
                // EXACT same behaviour as bar-graph gantt
                tickformatstops: [
                    {
                        dtickrange: [null, 1000],
                        value: 'd'
                    },
                    {
                        dtickrange: [1000, null],
                        value: '~s'
                    }
                ],
                ticks: 'outside',
                nticks: 12,
                gridcolor: '#1e293b',
                zeroline: false,
                rangeslider: {
                    visible: true,
                    thickness: 0.05,
                    bgcolor: 'rgba(100,100,100,1)',  // Transparent background
                    bordercolor: 'rgba(0,0,0,1)', 
                    borderwidth: 0
                }
            },
            yaxis: {
                title: {
                    text: 'Operations',
                    font: { size: 13, color: '#94a3b8', family: 'Inter, sans-serif' },
                    standoff: 20
                },
                tickfont: { size: 11, color: '#cbd5e1', family: 'Inter, sans-serif' },
                automargin: true,
                showgrid: false,
                zeroline: false,
                categoryorder: 'array',
                categoryarray: categoryOrder
            },
            barmode: 'group',
            bargap: 0.2,
            bargroupgap: 0,
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: { l: 20, r: 20, t: 30, b: 20 },
            hovermode: 'closest',
            autosize: true,
            showlegend: true,
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'left',
                x: 0,
                font: { color: '#cbd5e1', size: 12, family: 'Inter, sans-serif' }
            }
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };

        requestAnimationFrame(() => {
            if (!chartRef.current) return;
            Plotly.newPlot(chartRef.current, traces, layout, config).then(() => {
                // Remove the mini-plot preview inside the rangeslider.
                // Plotly doesn't expose an option to show the rangeslider control without the mini-plot.
                // We hide the preview traces inside the rangeslider via a small DOM tweak after render.
                try {
                    const el = chartRef.current!;
                    // .rangeslider is the container for the rangeslider; traces inside it typically carry the class 'trace'.
                    const rs = el.querySelector('.rangeslider');
                    if (rs) {
                        rs.querySelectorAll('.trace').forEach(node => {
                            (node as HTMLElement).style.display = 'none';
                        });
                        // Sometimes the mini axes/labels also appear — hide them as well (safe no-op if missing)
                        rs.querySelectorAll('.xaxislayer, .yaxislayer, .carts').forEach(node => {
                            (node as HTMLElement).style.display = 'none';
                        });
                    }
                } catch (e) {
                    // DOM tweak failed; it's non-fatal — slider will show preview in that case
                    // (no user-visible action required)
                    // eslint-disable-next-line no-console
                    console.warn('Could not hide rangeslider preview', e);
                }

                Plotly.Plots.resize(chartRef.current!).then(() => {
                    if (onReady) onReady();
                });
            });
        });
    }, [chartData, barrels, onReady]);

    useEffect(() => {
        updateChart();
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === chartRef.current) {
                    if (isFirstRender.current) { isFirstRender.current = false; return; }
                    window.requestAnimationFrame(() => safeResize());
                }
            }
        });
        if (chartRef.current) observerRef.current.observe(chartRef.current);
        return () => {
            if (observerRef.current) observerRef.current.disconnect();
            if (chartRef.current) Plotly.purge(chartRef.current);
        };
    }, [updateChart, safeResize]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />;
}
