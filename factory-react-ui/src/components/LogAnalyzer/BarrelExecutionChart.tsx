import { useEffect, useRef, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { BarrelExecutionData } from '../../types/logTypes';

interface Props {
    barrels: BarrelExecutionData[];
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
    onReady?: () => void;
}

export default function BarrelExecutionChart({ barrels, selectedBarrel, onBarrelClick, onReady }: Props) {
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

    const updateChart = useCallback(() => {
        if (!chartRef.current || barrels.length === 0) return;

        const barrelCount = barrels.length;
        // ... (Logic for tick calculation remains same)
        const calculateTickGap = (visibleStart: number, visibleEnd: number) => {
            const visibleBarrels = visibleEnd - visibleStart;
            const chartWidth = chartRef.current?.clientWidth || 1000;
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
                    color: barrels.map(b => b.barrelId === selectedBarrel ? '#38bdf8' : '#64748b'),
                    width: 2
                }
            },
            text: yData.map(y => `${y.toFixed(0)}ms`),
            textposition: 'outside' as const,
            textfont: { size: 11, color: '#f8fafc', family: 'JetBrains Mono, monospace', weight: 600 },
            hovertemplate: '<b>Barrel %{x}</b><br>Time: <b>%{y:.0f}ms</b><extra></extra>',
            hoverlabel: { bgcolor: '#1e293b', bordercolor: '#38bdf8', font: { color: '#f8fafc', size: 13 } }
        };

        const initialTickGap = calculateTickGap(0, barrelCount);
        const showRangeSlider = barrelCount > 50;

        const layout: Partial<Plotly.Layout> = {
            xaxis: {
                title: { text: 'Barrel ID', font: { color: '#f8fafc', size: 13, family: 'Inter, sans-serif' }, standoff: 15 },
                tickfont: { color: '#94a3b8', size: 11, family: 'JetBrains Mono, monospace' },
                dtick: initialTickGap,
                rangeslider: showRangeSlider ? { visible: true, bgcolor: '#1e293b' } : { visible: false },
                automargin: true,
                gridcolor: '#334155',
                zeroline: false
            },
            yaxis: {
                title: { text: 'Execution Time (ms)', font: { color: '#f8fafc', size: 13, family: 'Inter, sans-serif' }, standoff: 15 },
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

        // WRAPPER: Delay newPlot slightly to ensure container ref has dimensions
        requestAnimationFrame(() => {
            if (!chartRef.current) return;

            Plotly.newPlot(chartRef.current, [trace], layout, config).then(() => {
                // FIX: Force one resize calculation immediately after plot 
                // to fix the "stuck at small size" bug.
                Plotly.Plots.resize(chartRef.current!).then(() => {
                    if (onReady) onReady();
                });

                const chartElement = chartRef.current as any;
                if (chartElement) {
                    chartElement.removeAllListeners('plotly_click');
                    chartElement.removeAllListeners('plotly_relayout');

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
                }
            });
        });
    }, [barrels, selectedBarrel, onBarrelClick, onReady]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!selectedBarrel || barrels.length === 0) return;
            const currentIndex = barrels.findIndex(b => b.barrelId === selectedBarrel);
            if (currentIndex === -1) return;

            let newIndex = currentIndex;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : barrels.length - 1;
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                newIndex = currentIndex < barrels.length - 1 ? currentIndex + 1 : 0;
            }

            if (newIndex !== currentIndex) onBarrelClick(barrels[newIndex].barrelId);
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedBarrel, barrels, onBarrelClick]);

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

    return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
}