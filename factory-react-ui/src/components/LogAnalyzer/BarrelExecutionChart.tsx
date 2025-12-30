// Enhanced Barrel Execution Chart with Dynamic Tick Gap Formula
// Location: src/components/LogAnalyzer/BarrelExecutionChart.tsx

import { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { BarrelExecutionData } from '../../types/logTypes';

interface Props {
    barrels: BarrelExecutionData[];
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
}

export default function BarrelExecutionChart({ barrels, selectedBarrel, onBarrelClick }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!chartRef.current || barrels.length === 0) return;

        const barrelCount = barrels.length;

        // DYNAMIC TICK GAP FORMULA
        // Formula: tickGap = max(1, floor(visibleBarrels / targetTickCount))
        // targetTickCount adjusts based on screen width and zoom level

        const calculateTickGap = (visibleStart: number, visibleEnd: number) => {
            const visibleBarrels = visibleEnd - visibleStart;
            const chartWidth = chartRef.current?.offsetWidth || 1000;

            // Target: ~60-80px per tick for optimal readability
            const pixelsPerTick = 70;
            const targetTickCount = Math.floor(chartWidth / pixelsPerTick);

            // Calculate gap to achieve target tick count
            const tickGap = Math.max(1, Math.ceil(visibleBarrels / targetTickCount));

            return tickGap;
        };

        // Prepare data for Plotly
        const xData = barrels.map(b => b.barrelId);
        const yData = barrels.map(b => b.totalExecutionTime);

        // Color bars: selected barrel in primary color, others in default
        const colors = barrels.map(b =>
            b.barrelId === selectedBarrel ? '#38bdf8' : '#1e293b'
        );

        const trace = {
            x: xData,
            y: yData,
            type: 'bar' as const,
            marker: {
                color: colors,
                line: {
                    color: barrels.map(b => b.barrelId === selectedBarrel ? '#38bdf8' : '#475569'),
                    width: 2
                }
            },
            text: yData.map(y => `${y.toFixed(0)}ms`),
            textposition: 'outside' as const,
            textfont: {
                size: 11,
                color: '#f8fafc',
                family: 'Inter, sans-serif'
            },
            hovertemplate: '<b>%{x}</b><br>' +
                'Total Execution Time: <b>%{y:.0f}ms</b><br>' +
                '<extra></extra>',
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

        // Initial tick gap calculation
        const initialTickGap = calculateTickGap(0, barrelCount);
        const showRangeSlider = barrelCount > 50;

        const layout = {
            title: {
                text: `Barrel Execution Times (${barrelCount} barrels)`,
                font: {
                    size: 20,
                    color: '#f8fafc',
                    family: 'Inter, sans-serif',
                    weight: 700
                },
                x: 0.5,
                xanchor: 'center' as const,
                y: 0.98,
                yanchor: 'top' as const
            },
            xaxis: {
                title: {
                    text: 'Barrel ID',
                    font: {
                        size: 16,
                        color: '#f8fafc',
                        family: 'Inter, sans-serif',
                        weight: 600
                    },
                    standoff: 20
                },
                tickfont: {
                    size: 11,
                    color: '#94a3b8',
                    family: 'JetBrains Mono, monospace'
                },
                // HORIZONTAL TICKS (no rotation)
                tickangle: 0,
                gridcolor: '#334155',
                showgrid: false,
                zeroline: false,
                // Dynamic tick spacing
                tickmode: 'linear' as const,
                tick0: 0,
                dtick: initialTickGap,
                // Range slider for large datasets
                rangeslider: showRangeSlider ? {
                    visible: true,
                    bgcolor: '#1e293b',
                    bordercolor: '#475569',
                    thickness: 0.08,
                    yaxis: {
                        rangemode: 'match' as const
                    }
                } : { visible: false },
                automargin: true
            },
            yaxis: {
                title: {
                    text: 'Total Execution Time (ms)',
                    font: {
                        size: 16,
                        color: '#f8fafc',
                        family: 'Inter, sans-serif',
                        weight: 600
                    },
                    standoff: 15
                },
                tickfont: {
                    size: 12,
                    color: '#94a3b8',
                    family: 'JetBrains Mono, monospace'
                },
                gridcolor: '#334155',
                showgrid: true,
                zeroline: false,
                automargin: true
            },
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: {
                l: 90,
                r: 40,
                t: 70,
                b: showRangeSlider ? 150 : 100,
                pad: 10
            },
            hovermode: 'closest' as const,
            hoverdistance: 50,
            showlegend: false,
            autosize: true
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToAdd: ['select2d', 'lasso2d'] as any[],
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'] as any[],
            scrollZoom: true,
            toImageButtonOptions: {
                format: 'png',
                filename: 'barrel_execution_times',
                height: 1080,
                width: 1920,
                scale: 2
            }
        };

        // Create plot
        Plotly.newPlot(chartRef.current, [trace], layout, config);

        // Add click handler
        chartRef.current.on('plotly_click', (data: any) => {
            const pointIndex = data.points[0].pointIndex;
            const clickedBarrel = barrels[pointIndex];
            onBarrelClick(clickedBarrel.barrelId);
        });

        // Dynamic tick adjustment on zoom/pan
        chartRef.current.on('plotly_relayout', (eventData: any) => {
            if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined) {
                const visibleStart = Math.max(0, Math.floor(eventData['xaxis.range[0]']));
                const visibleEnd = Math.min(barrelCount, Math.ceil(eventData['xaxis.range[1]']));

                // Calculate new tick gap based on visible range
                const newTickGap = calculateTickGap(visibleStart, visibleEnd);

                // Update x-axis with new tick spacing
                Plotly.relayout(chartRef.current!, {
                    'xaxis.dtick': newTickGap
                });
            }
        });

        // Handle window resize
        const handleResize = () => {
            if (chartRef.current) {
                Plotly.Plots.resize(chartRef.current);
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                Plotly.purge(chartRef.current);
            }
        };
    }, [barrels, selectedBarrel, onBarrelClick]);

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px'
            }}
        />
    );
}