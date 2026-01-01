import { useEffect, useRef, useCallback, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { OperationData } from '../../types/logTypes';

interface Props {
    operations: OperationData[];
    barrelId: string;
}

export default function OperationGanttChart({ operations, barrelId }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();
    const animationFrameRef = useRef<number>();

    const chartData = useMemo(() => {
        const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);

        const getAnomalyStatus = (op: OperationData) => {
            const isDelayed = op.actualDuration > op.idealDuration;
            const isAnomalous = isDelayed && op.actualDuration > op.idealDuration * 1.3;
            if (isAnomalous) return '⚠️ Anomaly: I/O Wait Detected';
            if (isDelayed) return '⚠ Delayed';
            return '✓ On Time';
        };

        return { sortedOps, getAnomalyStatus };
    }, [operations]);

    const updateChart = useCallback(() => {
        if (!chartRef.current || operations.length === 0) return;

        const { sortedOps, getAnomalyStatus } = chartData;

        // 1. Ideal Trace (Yellow) - Occupies Slot 1
        const idealTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.idealDuration),
            base: sortedOps.map(op => op.startTime),
            name: 'Ideal Time',
            orientation: 'h' as const,
            offsetgroup: '1', // <--- Creates the first "candle" slot
            marker: {
                color: '#fbbf24',
                line: { color: '#f59e0b', width: 1 }
            },
            text: sortedOps.map(op => `${op.idealDuration.toFixed(0)}ms`),
            textposition: 'inside' as const,
            textfont: {
                size: 11,
                color: '#78350f',
                family: 'JetBrains Mono, monospace',
                weight: 600
            },
            hovertemplate: '<b>%{y}</b><br>Ideal Time: <b>%{x:.0f}ms</b><extra></extra>'
        };

        // 2. Actual (On Time) - Occupies Slot 2 (Blue)
        const onTimeTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            // Only provide data if on time, otherwise null
            x: sortedOps.map(op => op.actualDuration <= op.idealDuration ? op.actualDuration : null),
            base: sortedOps.map(op => op.startTime),
            name: 'Actual (On Time)',
            orientation: 'h' as const,
            offsetgroup: '2', // <--- Shares the second "candle" slot
            marker: {
                color: '#38bdf8',
                line: { color: '#38bdf8', width: 2 }
            },
            text: sortedOps.map(op => op.actualDuration <= op.idealDuration ? `${op.actualDuration.toFixed(0)}ms` : ''),
            textposition: 'inside' as const,
            textfont: { size: 11, color: '#0f172a', family: 'JetBrains Mono, monospace', weight: 700 },
            customdata: sortedOps.map(op => [op.startTime, op.endTime, getAnomalyStatus(op)]),
            hovertemplate: '<b>%{y}</b><br>Actual: <b>%{x:.0f}ms</b><br>Status: %{customdata[2]}<extra></extra>'
        };

        // 3. Actual (Delayed) - Occupies Slot 2 (Red)
        const delayedTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            // Only provide data if delayed, otherwise null
            x: sortedOps.map(op => op.actualDuration > op.idealDuration ? op.actualDuration : null),
            base: sortedOps.map(op => op.startTime),
            name: 'Actual (Delayed)',
            orientation: 'h' as const,
            offsetgroup: '2', // <--- ALSO shares the second "candle" slot
            marker: {
                color: '#ef4444',
                line: { color: '#dc2626', width: 2 }
            },
            text: sortedOps.map(op => op.actualDuration > op.idealDuration ? `${op.actualDuration.toFixed(0)}ms` : ''),
            textposition: 'inside' as const,
            textfont: { size: 11, color: '#ffffff', family: 'JetBrains Mono, monospace', weight: 700 },
            customdata: sortedOps.map(op => [op.startTime, op.endTime, getAnomalyStatus(op)]),
            hovertemplate: '<b>%{y}</b><br>Actual: <b>%{x:.0f}ms</b><br>Status: %{customdata[2]}<extra></extra>'
        };

        const layout: Partial<Plotly.Layout> = {
            title: {
                text: `Barrel ${barrelId} - Operation Timeline (Actual vs Ideal)`,
                font: { size: 20, color: '#f8fafc', family: 'Inter, sans-serif', weight: 700 },
                x: 0.5,
                xanchor: 'center'
            },
            xaxis: {
                title: { text: 'Execution Time (ms)', font: { size: 16, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 }, standoff: 20 },
                tickfont: { size: 12, color: '#94a3b8', family: 'JetBrains Mono, monospace' },
                gridcolor: '#334155',
                zeroline: false,
                automargin: true,
                range: [0, Math.max(...sortedOps.map(op => op.endTime)) * 1.05]
            },
            yaxis: {
                title: { text: 'Operation Name', font: { size: 16, color: '#f8fafc', family: 'Inter, sans-serif', weight: 600 }, standoff: 20 },
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
            margin: { l: 10, r: 20, t: 60, b: 50 },
            hovermode: 'closest' as const,
            showlegend: true,
            legend: {
                orientation: 'h' as const,
                x: 0.5,
                xanchor: 'center',
                y: -0.2,
                font: { color: '#f8fafc', size: 12, family: 'Inter, sans-serif' },
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                bordercolor: '#334155',
                borderwidth: 1
            },
            autosize: true
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'select2d', 'lasso2d']
        };

        Plotly.newPlot(chartRef.current, [idealTrace, onTimeTrace, delayedTrace], layout, config);
    }, [operations, barrelId, chartData]);

    useEffect(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(updateChart);

        const handleResize = () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                if (chartRef.current) Plotly.Plots.resize(chartRef.current);
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (chartRef.current) Plotly.purge(chartRef.current);
        };
    }, [updateChart]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
        </div>
    );
}