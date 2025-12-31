// Enhanced Operation Gantt Chart - Full Screen Optimized
// Location: src/components/LogAnalyzer/OperationGanttChart.tsx

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { OperationData } from '../../types/logTypes';

interface Props {
    operations: OperationData[];
    barrelId: string;
}

export default function OperationGanttChart({ operations, barrelId }: Props) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current || operations.length === 0) return;

        // Sort operations by sequence
        const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);

        // Actual Time Bars (Blue)
        const actualTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.actualDuration),
            base: sortedOps.map(op => op.startTime), // <--- ADDED: Defines the start time
            name: 'Actual Time',
            orientation: 'h' as const,
            marker: {
                color: '#38bdf8',
                line: {
                    color: '#0284c7',
                    width: 1
                }
            },
            text: sortedOps.map(op => `${op.actualDuration}ms`),
            textposition: 'inside' as const,
            textfont: {
                size: 12,
                color: '#0f172a',
                family: 'JetBrains Mono, monospace',
                weight: 600
            },
            hovertemplate: '<b>%{y}</b><br>' +
                'Actual Time: <b>%{x}ms</b><br>' +
                'Start: %{customdata[0]}ms<br>' +
                'End: %{customdata[1]}ms<br>' +
                '<extra></extra>',
            customdata: sortedOps.map(op => [op.startTime, op.endTime]),
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#38bdf8',
                font: {
                    color: '#f8fafc',
                    size: 14,
                    family: 'Inter, sans-serif'
                }
            }
        };

        // Ideal Time Bars (Yellow)
        const idealTrace = {
            type: 'bar' as const,
            y: sortedOps.map(op => op.operationName),
            x: sortedOps.map(op => op.idealDuration),
            base: sortedOps.map(op => op.startTime), // <--- ADDED: Aligns ideal bar with actual start for comparison
            name: 'Ideal Time',
            orientation: 'h' as const,
            marker: {
                color: '#fbbf24',
                line: {
                    color: '#f59e0b',
                    width: 1
                }
            },
            text: sortedOps.map(op => `${op.idealDuration}ms`),
            textposition: 'inside' as const,
            textfont: {
                size: 12,
                color: '#78350f',
                family: 'JetBrains Mono, monospace',
                weight: 600
            },
            hovertemplate: '<b>%{y}</b><br>' +
                'Ideal Time: <b>%{x}ms</b><br>' +
                'Expected Duration<br>' +
                '<extra></extra>',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#fbbf24',
                font: {
                    color: '#f8fafc',
                    size: 14,
                    family: 'Inter, sans-serif'
                }
            }
        };

        const layout = {
            title: {
                text: `Barrel ${barrelId} - Operation Timeline (Actual vs Ideal)`,
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
                    text: 'Execution Time (ms)',
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
            yaxis: {
                title: {
                    text: 'Operation Name',
                    font: {
                        size: 16,
                        color: '#f8fafc',
                        family: 'Inter, sans-serif',
                        weight: 600
                    },
                    standoff: 15
                },
                tickfont: {
                    size: 11,
                    color: '#f8fafc',
                    family: 'Inter, sans-serif'
                },
                gridcolor: '#334155',
                showgrid: false,
                zeroline: false,
                automargin: true
            },
            barmode: 'group' as const,
            bargap: 0.25,
            bargroupgap: 0.1,
            plot_bgcolor: '#0b1121',
            paper_bgcolor: '#0b1121',
            margin: {
                l: 280,
                r: 50,
                t: 70,
                b: 80,
                pad: 10
            },
            hovermode: 'closest' as const,
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right' as const,
                y: 1,
                yanchor: 'top' as const,
                bgcolor: '#1e293b',
                bordercolor: '#475569',
                borderwidth: 1,
                font: {
                    size: 13,
                    color: '#f8fafc',
                    family: 'Inter, sans-serif'
                }
            },
            annotations: [
                {
                    text: '🔵 Actual | 🟡 Ideal',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: -0.12,
                    xanchor: 'center' as const,
                    yanchor: 'top' as const,
                    showarrow: false,
                    font: {
                        size: 13,
                        color: '#94a3b8',
                        family: 'Inter, sans-serif'
                    }
                }
            ],
            autosize: true
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'select2d', 'lasso2d'] as any[],
            scrollZoom: true,
            toImageButtonOptions: {
                format: 'png',
                filename: `gantt_barrel_${barrelId}`,
                height: 1080,
                width: 1920,
                scale: 2
            }
        };

        // Create plot
        Plotly.newPlot(chartRef.current, [actualTrace, idealTrace], layout, config);

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
    }, [operations, barrelId]);

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