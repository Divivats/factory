import { useEffect, useRef, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { BarrelExecutionData } from '../../types/logTypes';

interface Props {
    barrels: BarrelExecutionData[];
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
}

export default function BarrelExecutionChart({ barrels, selectedBarrel, onBarrelClick }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();

    const updateChart = useCallback(() => {
        if (!chartRef.current || barrels.length === 0) return;

        const barrelCount = barrels.length;

        const calculateTickGap = (visibleStart: number, visibleEnd: number) => {
            const visibleBarrels = visibleEnd - visibleStart;
            const chartWidth = chartRef.current?.offsetWidth || 1000;
            const pixelsPerTick = 70;
            const targetTickCount = Math.floor(chartWidth / pixelsPerTick);
            return Math.max(1, Math.ceil(visibleBarrels / targetTickCount));
        };

        const xData = barrels.map(b => b.barrelId);
        const yData = barrels.map(b => b.totalExecutionTime);
        const colors = barrels.map(b => b.barrelId === selectedBarrel ? '#38bdf8' : '#475569');

        const trace = {
            x: xData,
            y: yData,
            type: 'bar' as const,
            marker: {
                color: colors,
                line: {
                    color: barrels.map(b => b.barrelId === selectedBarrel ? '#0ea5e9' : '#64748b'),
                    width: 2
                }
            },
            text: yData.map(y => `${y.toFixed(0)}ms`),
            textposition: 'outside' as const,
            textfont: {
                size: 11,
                color: '#f8fafc',
                family: 'JetBrains Mono, monospace',
                weight: 600
            },
            hovertemplate: '<b>Barrel %{x}</b><br>Time: <b>%{y:.0f}ms</b><extra></extra>',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#38bdf8',
                font: {
                    color: '#f8fafc',
                    size: 13,
                    family: 'Inter, sans-serif'
                }
            }
        };

        const initialTickGap = calculateTickGap(0, barrelCount);
        const showRangeSlider = barrelCount > 50;

        const layout: Partial<Plotly.Layout> = {
            xaxis: {
                title: {
                    text: 'Barrel ID',
                    font: { color: '#f8fafc', size: 13, family: 'Inter, sans-serif' },
                    standoff: 15
                },
                tickfont: { color: '#94a3b8', size: 11, family: 'JetBrains Mono, monospace' },
                dtick: initialTickGap,
                rangeslider: showRangeSlider ? { visible: true, bgcolor: '#1e293b' } : { visible: false },
                automargin: true,
                gridcolor: '#334155',
                zeroline: false
            },
            yaxis: {
                title: {
                    text: 'Execution Time (ms)',
                    font: { color: '#f8fafc', size: 13, family: 'Inter, sans-serif' },
                    standoff: 15
                },
                tickfont: { color: '#94a3b8', size: 11, family: 'JetBrains Mono, monospace' },
                gridcolor: '#334155',
                automargin: true,
                zeroline: false
            },
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: { l: 60, r: 20, t: 20, b: showRangeSlider ? 100 : 50 },
            autosize: true,
            showlegend: false,
            hovermode: 'closest' as const
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'lasso2d', 'select2d']
        };

        Plotly.newPlot(chartRef.current, [trace], layout, config);

        const chartElement = chartRef.current as any;

        chartElement.on('plotly_click', (data: any) => {
            if (data?.points?.length) {
                onBarrelClick(barrels[data.points[0].pointIndex].barrelId);
            }
        });

        chartElement.on('plotly_relayout', (eventData: any) => {
            if (eventData['xaxis.range[0]'] !== undefined) {
                const start = Math.max(0, Math.floor(eventData['xaxis.range[0]']));
                const end = Math.min(barrelCount, Math.ceil(eventData['xaxis.range[1]']));
                Plotly.relayout(chartElement, { 'xaxis.dtick': calculateTickGap(start, end) });
            }
        });
    }, [barrels, selectedBarrel, onBarrelClick]);

    useEffect(() => {
        updateChart();

        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
                if (chartRef.current) {
                    Plotly.Plots.resize(chartRef.current);
                }
            }, 150);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            if (chartRef.current) {
                Plotly.purge(chartRef.current);
            }
        };
    }, [updateChart]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
}