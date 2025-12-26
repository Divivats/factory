// Bar Chart Component for Barrel Execution Times
// Location: src/components/LogAnalyzer/BarrelExecutionChart.tsx

import { useRef, useEffect } from 'react';
import type { BarrelExecutionData } from '../../types/logTypes';

interface Props {
    barrels: BarrelExecutionData[];
    selectedBarrel: string | null;
    onBarrelClick: (barrelId: string) => void;
}

export default function BarrelExecutionChart({ barrels, selectedBarrel, onBarrelClick }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || barrels.length === 0) return;

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
        const padding = { top: 40, right: 40, bottom: 80, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Find max value
        const maxValue = Math.max(...barrels.map(b => b.totalExecutionTime));
        const yScale = chartHeight / maxValue;

        // Bar dimensions
        const barWidth = chartWidth / barrels.length * 0.7;
        const barSpacing = chartWidth / barrels.length;

        // Draw Y-axis
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.stroke();

        // Draw X-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();

        // Draw Y-axis labels and grid lines
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const value = (maxValue / ySteps) * i;
            const y = height - padding.bottom - (chartHeight / ySteps) * i;

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`${value.toFixed(0)}ms`, padding.left - 10, y);
        }

        // Draw bars
        barrels.forEach((barrel, index) => {
            const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
            const barHeight = barrel.totalExecutionTime * yScale;
            const y = height - padding.bottom - barHeight;

            // Draw bar
            const isSelected = barrel.barrelId === selectedBarrel;
            ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw border
            ctx.strokeStyle = isSelected ? '#38bdf8' : '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw value on top
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${barrel.totalExecutionTime.toFixed(0)}ms`, x + barWidth / 2, y - 5);

            // Draw X-axis label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(barrel.barrelId, 0, 0);
            ctx.restore();
        });

        // Draw axis labels
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Y-axis label
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Total Execution Time (ms)', 0, 0);
        ctx.restore();

        // X-axis label
        ctx.fillText('Barrel Number', width / 2, height - 20);

    }, [barrels, selectedBarrel]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || barrels.length === 0) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        const padding = { top: 40, right: 40, bottom: 80, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const barSpacing = chartWidth / barrels.length;
        const barWidth = chartWidth / barrels.length * 0.7;

        // Check if click is within chart area
        if (x < padding.left || x > width - padding.right || y < padding.top || y > height - padding.bottom) {
            return;
        }

        // Find clicked bar
        const barIndex = Math.floor((x - padding.left) / barSpacing);
        if (barIndex >= 0 && barIndex < barrels.length) {
            onBarrelClick(barrels[barIndex].barrelId);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    display: 'block'
                }}
            />
        </div>
    );
}