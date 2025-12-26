// Gantt Chart Component for Operation Sequences
// Location: src/components/LogAnalyzer/OperationGanttChart.tsx

import { useRef, useEffect } from 'react';
import type { OperationData } from '../../types/logTypes';

interface Props {
    operations: OperationData[];
    barrelId: string;
}

export default function OperationGanttChart({ operations, barrelId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || operations.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate dimensions
        const padding = { top: 60, right: 40, bottom: 60, left: 200 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Sort operations by sequence
        const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);

        // Find time range
        const minTime = Math.min(...sortedOps.map(op => op.startTime));
        const maxTime = Math.max(...sortedOps.map(op => op.endTime));
        const timeRange = maxTime - minTime;
        const timeScale = chartWidth / timeRange;

        // Row dimensions
        const rowHeight = Math.min(50, chartHeight / sortedOps.length);
        const barHeight = rowHeight * 0.6;

        // Draw title
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Barrel ${barrelId} - Operation Timeline`, width / 2, 30);

        // Draw X-axis
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();

        // Draw Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.stroke();

        // Draw time labels on X-axis
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const timeSteps = 6;
        for (let i = 0; i <= timeSteps; i++) {
            const time = minTime + (timeRange / timeSteps) * i;
            const x = padding.left + (time - minTime) * timeScale;

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`${time.toFixed(0)}ms`, x, height - padding.bottom + 5);
        }

        // Color palette for bars
        const colors = [
            '#38bdf8', '#fb923c', '#a78bfa', '#34d399', '#fbbf24',
            '#f87171', '#60a5fa', '#4ade80', '#f472b6', '#22d3ee'
        ];

        // Draw operations
        sortedOps.forEach((op, index) => {
            const y = padding.top + index * rowHeight + (rowHeight - barHeight) / 2;
            const x = padding.left + (op.startTime - minTime) * timeScale;
            const width = op.duration * timeScale;

            // Draw bar
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, width, barHeight);

            // Draw border
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, barHeight);

            // Draw operation name (left side)
            ctx.fillStyle = '#f8fafc';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(op.operationName, padding.left - 10, y + barHeight / 2);

            // Draw duration inside bar if space allows
            const durationText = `${op.duration.toFixed(0)}ms`;
            ctx.font = 'bold 10px Inter, sans-serif';
            const textWidth = ctx.measureText(durationText).width;
            if (width > textWidth + 10) {
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'center';
                ctx.fillText(durationText, x + width / 2, y + barHeight / 2);
            }
        });

        // Draw axis labels
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // X-axis label
        ctx.fillText('Time (ms)', width / 2, height - 20);

        // Y-axis label
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Operation Name', 0, 0);
        ctx.restore();

    }, [operations, barrelId]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />
        </div>
    );
}