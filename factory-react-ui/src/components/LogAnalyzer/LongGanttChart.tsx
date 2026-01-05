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

    // Color Palette for Rotating Barrels (Background grouping visual only)
    // We will rely on Red/Blue for status, but can use these for slight tinting if needed, 
    // or just rely on the 'offsetgroup' grouping to distinguish barrels.
    // For this specific request: "Ideal time, actual time (ontime), Actual time (Delayed)" logic takes precedence.

    const chartData = useMemo(() => {
        // Flatten all operations
        const allOps = barrels.flatMap(b => b.operations);

        // We still group by Barrel ID to manage the stacking (offsetgroup)
        // But the Coloring follows the strict Red/Blue/Yellow logic
        const traces: any[] = [];
        const uniqueBarrelIds = Array.from(new Set(allOps.map(op => op.barrelId)));

        uniqueBarrelIds.forEach((barrelId) => {
            const opsInBarrel = allOps.filter(op => op.barrelId === barrelId);
            if (opsInBarrel.length === 0) return;

            const yData = opsInBarrel.map(op => op.operationName);
            const baseData = opsInBarrel.map(op => op.globalStartTime);

            // 1. IDEAL TIME TRACE (Background)
            traces.push({
                type: 'bar',
                name: `Barrel ${barrelId} - Ideal`,
                x: opsInBarrel.map(op => op.idealDuration),
                y: yData,
                base: baseData,
                orientation: 'h',
                offsetgroup: barrelId, // Stack all traces for this barrel together
                marker: {
                    color: '#fbbf24',
                    line: { color: '#f59e0b', width: 1 },
                    opacity: 0.6 // Slightly visible behind
                },
                hoverinfo: 'skip',
                showlegend: false
            });

            // 2. ACTUAL TIME - ON TIME (Blue)
            const onTimeOps = opsInBarrel.map(op => op.actualDuration <= op.idealDuration ? op.actualDuration : null);
            traces.push({
                type: 'bar',
                name: `Barrel ${barrelId} - On Time`,
                x: onTimeOps,
                y: yData,
                base: baseData,
                orientation: 'h',
                offsetgroup: barrelId,
                marker: {
                    color: '#38bdf8',
                    line: { color: '#38bdf8', width: 2 }
                },
                text: opsInBarrel.map(op => op.actualDuration <= op.idealDuration ? `${op.actualDuration}ms` : ''),
                textposition: 'inside',
                textfont: { size: 11, color: '#0f172a', family: 'JetBrains Mono, monospace', weight: 700 },

                hovertemplate:
                    '<b>%{y}</b><br>' +
                    'Barrel: <b>%{customdata[0]}</b><br>' +
                    'Start: <b>%{base} ms</b><br>' +
                    'End: <b>%{customdata[1]} ms</b><br>' +
                    'Duration: <b>%{x} ms</b><extra></extra>',
                customdata: opsInBarrel.map(op => [op.barrelId, op.globalEndTime]),
                showlegend: false
            });

            // 3. ACTUAL TIME - DELAYED (Red)
            const delayedOps = opsInBarrel.map(op => op.actualDuration > op.idealDuration ? op.actualDuration : null);
            traces.push({
                type: 'bar',
                name: `Barrel ${barrelId} - Delayed`,
                x: delayedOps,
                y: yData,
                base: baseData,
                orientation: 'h',
                offsetgroup: barrelId,
                marker: {
                    color: '#ef4444',
                    line: { color: '#dc2626', width: 2 }
                },
                text: opsInBarrel.map(op => op.actualDuration > op.idealDuration ? `${op.actualDuration}ms` : ''),
                textposition: 'inside',
                textfont: { size: 11, color: '#0f172a', family: 'JetBrains Mono, monospace', weight: 700 },

                hovertemplate:
                    '<b>%{y}</b><br>' +
                    'Barrel: <b>%{customdata[0]}</b><br>' +
                    'Start: <b>%{base} ms</b><br>' +
                    'End: <b>%{customdata[1]} ms</b><br>' +
                    'Duration: <b>%{x} ms</b><br>' +
                    '⚠ Delayed<extra></extra>',
                customdata: opsInBarrel.map(op => [op.barrelId, op.globalEndTime]),
                showlegend: false
            });
        });

        return traces;
    }, [barrels]);

    const updateChart = useCallback(() => {
        if (!chartRef.current || barrels.length === 0) return;

        const layout: Partial<Plotly.Layout> = {
            xaxis: {
                title: {
                    text: 'Global Time Line (ms)',
                    font: { size: 14, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 },
                    standoff: 20
                },
                tickfont: { size: 11, color: '#94a3b8', family: 'JetBrains Mono, monospace' },
                gridcolor: '#334155',
                zeroline: false,
                rangeslider: {
                    visible: true,
                    thickness: 0.05,
                    bgcolor: '#0f172a',
                    borderwidth: 1,
                    bordercolor: '#334155'
                }
            },
            yaxis: {
                title: {
                    text: 'Operations',
                    font: { size: 14, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 },
                    standoff: 20
                },
                tickfont: { size: 11, color: '#f8fafc', family: 'Inter, sans-serif' },
                automargin: true,
                showgrid: false, // Explicitly removed horizontal lines
                zeroline: false
            },
            barmode: 'group', // Changed to group to handle the multiple traces per barrel correctly
            bargap: 0.25,      // Matches OperationGanttChart
            bargroupgap: 0.1,  // Matches OperationGanttChart
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: { l: 20, r: 20, t: 10, b: 20 },
            hovermode: 'closest',
            autosize: true,
            // Modebar customization specifically for the requested legend items
            legend: {
                orientation: 'h',
                y: -0.2 // Hidden generally as we handle it in UI, or can be enabled if needed
            }
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d']
        };

        requestAnimationFrame(() => {
            if (!chartRef.current) return;
            Plotly.newPlot(chartRef.current, chartData, layout, config).then(() => {
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