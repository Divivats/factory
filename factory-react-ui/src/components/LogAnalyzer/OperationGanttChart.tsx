import { useEffect, useRef, useCallback, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { OperationData } from '../../types/logTypes';

interface Props {
    operations: OperationData[];
    barrelId: string;
    onReady?: () => void;
}

export default function OperationGanttChart({ operations, barrelId, onReady }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver | null>(null);
    const resizeInProgress = useRef(false);
    const isFirstRender = useRef(true);

    const safeResize = useCallback(() => {
        if (!chartRef.current || resizeInProgress.current) return;

        resizeInProgress.current = true;
        Plotly.Plots.resize(chartRef.current)
            .then(() => {
                resizeInProgress.current = false;
            })
            .catch(() => {
                resizeInProgress.current = false;
            });
    }, []);

    const chartData = useMemo(() => {
        const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);
        return { sortedOps };
    }, [operations]);

    const updateChart = useCallback(() => {
        if (!chartRef.current || operations.length === 0) return;

        const { sortedOps } = chartData;
        const maxEndTime = Math.max(...sortedOps.map(op => op.endTime));
        const xRange = [0, maxEndTime * 1.05];

        // ... (Traces setup remains same)
        const idealTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.idealDuration),
            base: sortedOps.map(op => op.startTime),
            name: 'Ideal Time',
            orientation: 'h' as const,
            offsetgroup: '1',
            marker: { color: '#fbbf24', line: { color: '#f59e0b', width: 1 } },
            text: sortedOps.map(op => `${op.idealDuration}ms`),
            textposition: 'inside' as const,
            textfont: { size: 11, color: '#78350f', family: 'JetBrains Mono, monospace', weight: 600 },
            hoverinfo: 'text',
            hovertext: sortedOps.map(op => `<b>${op.operationName}</b><br>Ideal Time: <b>${op.idealDuration} ms</b>`)
        };

        const onTimeTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.actualDuration <= op.idealDuration ? op.actualDuration : null),
            base: sortedOps.map(op => op.startTime),
            name: 'Actual (On Time)',
            orientation: 'h' as const,
            offsetgroup: '2',
            marker: { color: '#38bdf8', line: { color: '#38bdf8', width: 2 } },
            text: sortedOps.map(op => op.actualDuration <= op.idealDuration ? `${op.actualDuration}ms` : ''),
            textposition: 'inside' as const,
            textfont: { size: 11, color: '#0f172a', family: 'JetBrains Mono, monospace', weight: 700 },
            customdata: sortedOps.map(op => [op.startTime, op.endTime, op.actualDuration]),
            hovertemplate: '<b>%{y}</b><br>Start: <b>%{customdata[0]} ms</b><br>End: <b>%{customdata[1]} ms</b><br>Duration: <b>%{customdata[2]} ms</b><extra></extra>'
        };

        const delayedTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.actualDuration > op.idealDuration ? op.actualDuration : null),
            base: sortedOps.map(op => op.startTime),
            name: 'Actual (Delayed)',
            orientation: 'h' as const,
            offsetgroup: '2',
            marker: { color: '#ef4444', line: { color: '#dc2626', width: 2 } },
            text: sortedOps.map(op => op.actualDuration > op.idealDuration ? `${op.actualDuration}ms` : ''),
            textposition: 'inside' as const,
            textfont: { size: 11, color: '#0f172a', family: 'JetBrains Mono, monospace', weight: 700 },
            customdata: sortedOps.map(op => [op.startTime, op.endTime, op.actualDuration]),
            hovertemplate: '<b>%{y}</b><br>Start: <b>%{customdata[0]} ms</b><br>End: <b>%{customdata[1]} ms</b><br>Duration: <b>%{customdata[2]} ms</b><br>⚠ Delayed<extra></extra>'
        };

        const layout: Partial<Plotly.Layout> = {
            xaxis: {
                title: { text: 'Execution Time (ms)', font: { size: 14, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 }, standoff: 15 },
                tickfont: { size: 11, color: '#94a3b8', family: 'JetBrains Mono, monospace' },
                gridcolor: '#334155',
                zeroline: false,
                automargin: true,
                range: xRange
            },
            yaxis: {
                title: { text: 'Operation', font: { size: 14, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 }, standoff: 10 },
                tickfont: { size: 11, color: '#f8fafc', family: 'Inter, sans-serif' },
                automargin: true,
                showgrid: false,
                zeroline: false
            },
            barmode: 'group' as const,
            bargap: 0.25,
            bargroupgap: 0.1,
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: { l: 10, r: 10, t: 10, b: 50 },
            hovermode: 'closest' as const,
            showlegend: true,
            legend: { orientation: 'h' as const, x: 0.02, xanchor: 'left', y: 1.02, yanchor: 'bottom', font: { color: '#f8fafc', size: 11, family: 'Inter, sans-serif' }, bgcolor: 'rgba(15, 23, 42, 0.9)', bordercolor: '#334155', borderwidth: 1 },
            autosize: true
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'select2d', 'lasso2d']
        };

        requestAnimationFrame(() => {
            if (!chartRef.current) return;
            Plotly.newPlot(chartRef.current, [idealTrace, onTimeTrace, delayedTrace], layout, config).then(() => {
                // FIX: Force resize check immediately
                Plotly.Plots.resize(chartRef.current!).then(() => {
                    if (onReady) onReady();
                });
            });
        });
    }, [operations, barrelId, chartData, onReady]);

    useEffect(() => {
        updateChart();

        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === chartRef.current) {
                    if (isFirstRender.current) {
                        isFirstRender.current = false;
                        return;
                    }
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

    return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />;
}