import React, { useState, useMemo, useEffect } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogFileNode } from '../../types/logTypes';

interface Props {
    logFiles: LogFileNode[];
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
    onBack: () => void;
    loading: boolean;
    pcInfo: { line: number; pcNumber: number; logPath: string };
}

export default function LogFileSelector({
    logFiles,
    selectedFile,
    onSelectFile,
    onBack,
    loading,
    pcInfo
}: Props) {
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const dateHierarchy = useMemo(() => {
        const hierarchy: Record<string, Record<string, Record<string, LogFileNode[]>>> = {};

        const processNode = (node: LogFileNode) => {
            if (!node.isDirectory && node.modifiedDate) {
                const date = new Date(node.modifiedDate);
                const year = date.getFullYear().toString();
                const month = date.toLocaleDateString('en-US', { month: 'long' });
                const day = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                if (!hierarchy[year]) hierarchy[year] = {};
                if (!hierarchy[year][month]) hierarchy[year][month] = {};
                if (!hierarchy[year][month][day]) hierarchy[year][month][day] = [];
                hierarchy[year][month][day].push(node);
            }
            if (node.children) node.children.forEach(processNode);
        };

        logFiles.forEach(processNode);
        return hierarchy;
    }, [logFiles]);

    // Auto-select most recent date logic
    useEffect(() => {
        const availableYears = Object.keys(dateHierarchy).sort((a, b) => parseInt(b) - parseInt(a));
        if (availableYears.length === 0) return;

        const now = new Date();
        const tYear = now.getFullYear().toString();
        const tMonth = now.toLocaleDateString('en-US', { month: 'long' });
        const tDay = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        // Try Today
        if (dateHierarchy[tYear]?.[tMonth]?.[tDay]) {
            setSelectedYear(tYear);
            setSelectedMonth(tMonth);
            setSelectedDay(tDay);
            return;
        }

        // Fallback: Most Recent
        const maxYear = availableYears[0];

        const availableMonths = Object.keys(dateHierarchy[maxYear] || {}).sort((a, b) => {
            return new Date(`${b} 1, ${maxYear}`).getTime() - new Date(`${a} 1, ${maxYear}`).getTime();
        });
        const maxMonth = availableMonths[0];

        const availableDays = Object.keys(dateHierarchy[maxYear]?.[maxMonth] || {}).sort((a, b) => {
            const filesA = dateHierarchy[maxYear][maxMonth][a];
            const filesB = dateHierarchy[maxYear][maxMonth][b];
            const timeA = filesA?.[0]?.modifiedDate ? new Date(filesA[0].modifiedDate).getTime() : 0;
            const timeB = filesB?.[0]?.modifiedDate ? new Date(filesB[0].modifiedDate).getTime() : 0;
            return timeB - timeA;
        });
        const maxDay = availableDays[0];

        setSelectedYear(maxYear);
        setSelectedMonth(maxMonth);
        setSelectedDay(maxDay);
    }, [dateHierarchy]);

    const years = Object.keys(dateHierarchy).sort((a, b) => parseInt(b) - parseInt(a));

    const months = selectedYear && dateHierarchy[selectedYear]
        ? Object.keys(dateHierarchy[selectedYear]).sort((a, b) => new Date(`${b} 1, 2000`).getTime() - new Date(`${a} 1, 2000`).getTime())
        : [];

    const days = selectedYear && selectedMonth && dateHierarchy[selectedYear]?.[selectedMonth]
        ? Object.keys(dateHierarchy[selectedYear][selectedMonth]).sort((a, b) => {
            const filesA = dateHierarchy[selectedYear][selectedMonth!][a];
            const filesB = dateHierarchy[selectedYear][selectedMonth!][b];
            const timeA = filesA?.[0]?.modifiedDate ? new Date(filesA[0].modifiedDate).getTime() : 0;
            const timeB = filesB?.[0]?.modifiedDate ? new Date(filesB[0].modifiedDate).getTime() : 0;
            return timeB - timeA;
        })
        : [];

    const files = selectedYear && selectedMonth && selectedDay && dateHierarchy[selectedYear]?.[selectedMonth]?.[selectedDay]
        ? dateHierarchy[selectedYear][selectedMonth][selectedDay]
        : [];

    const handleYearChange = (newYear: string) => {
        setSelectedYear(newYear);
        setSelectedMonth(null);
        setSelectedDay(null);
    };

    return (
        <div className="card" style={{
            padding: 0,
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '2px solid var(--border)',
                background: 'var(--bg-panel)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                flexShrink: 0
            }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', margin: 0, marginBottom: '0.5rem' }}>
                        Log Files - Line {pcInfo.line} PC-{pcInfo.pcNumber}
                    </h2>
                    <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {pcInfo.logPath}
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={onBack}>
                    ← Back to PCs
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    Loading log files...
                </div>
            ) : (
                <div style={{
                    padding: '1.5rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* Date Pickers */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                        <Dropdown
                            label="Year"
                            options={years}
                            value={selectedYear}
                            onChange={handleYearChange}
                            placeholder="Select Year"
                        />
                        <Dropdown
                            label="Month"
                            options={months}
                            value={selectedMonth}
                            onChange={(v) => { setSelectedMonth(v); setSelectedDay(null); }}
                            placeholder="Select Month"
                            disabled={!selectedYear}
                        />
                        <Dropdown
                            label="Day"
                            options={days}
                            value={selectedDay}
                            onChange={setSelectedDay}
                            placeholder="Select Day"
                            disabled={!selectedMonth}
                        />
                    </div>

                    {files.length > 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0
                        }}>
                            {/* Title Row */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                flexShrink: 0
                            }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                                    Available Files ({files.length})
                                </h3>
                                {selectedFile && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                                        ✓ File Selected
                                    </div>
                                )}
                            </div>

                            {/* Bento Box Grid - Adjusted minmax to 130px for ~8 columns */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', // <--- CHANGED HERE
                                gap: '0.75rem',
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0.5rem',
                                minHeight: 0
                            }}>
                                {files.map(file => (
                                    <motion.button
                                        key={file.path}
                                        onClick={() => onSelectFile(file.path)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            position: 'relative',
                                            background: selectedFile === file.path
                                                ? 'var(--primary-dim)'
                                                : 'var(--bg-panel)',
                                            border: selectedFile === file.path
                                                ? '2px solid var(--primary)'
                                                : '1px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            backdropFilter: 'blur(12px)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            minHeight: '100px'
                                        }}
                                        className={selectedFile === file.path ? '' : 'hover-card'}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), transparent)',
                                            opacity: 0,
                                            transition: 'opacity 0.3s',
                                            borderRadius: 'var(--radius-md)',
                                            pointerEvents: 'none'
                                        }} className="hover-effect" />

                                        <FileText
                                            size={24}
                                            color={selectedFile === file.path ? 'var(--primary)' : 'var(--text-muted)'}
                                        />

                                        <div style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color: 'var(--text-main)',
                                            textAlign: 'center',
                                            wordBreak: 'break-word',
                                            lineHeight: 1.3
                                        }}>
                                            {file.name}
                                        </div>

                                        {file.size && (
                                            <span className="text-mono" style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-dim)',
                                                fontWeight: 500
                                            }}>
                                                {(file.size / 1024).toFixed(2)} KB
                                            </span>
                                        )}

                                        {selectedFile === file.path && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '0.5rem',
                                                right: '0.5rem',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: 'var(--success)',
                                                boxShadow: '0 0 8px var(--success)'
                                            }} />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        selectedYear && selectedMonth && selectedDay && (
                            <div style={{
                                textAlign: 'center',
                                color: 'var(--text-dim)',
                                padding: '3rem',
                                background: 'var(--bg-panel)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px dashed var(--border)'
                            }}>
                                <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    No log files found for this date.
                                </p>
                            </div>
                        )
                    )}
                </div>
            )}

            <style>{`
                .hover-card:hover .hover-effect {
                    opacity: 1 !important;
                }
                .hover-card:hover {
                    border-color: var(--primary) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
}

// Dropdown component stays the same
function Dropdown({ label, options, value, onChange, placeholder, disabled = false }: {
    label: string;
    options: string[];
    value: string | null;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative', minWidth: '180px', flex: 1 }}>
            <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {label}
            </label>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="btn btn-secondary"
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                }} />
            </button>

            {isOpen && !disabled && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: '250px',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        zIndex: 1000,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                    }}>
                        {options.map(option => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className="btn btn-ghost"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    borderRadius: 0,
                                    background: value === option ? 'var(--primary-dim)' : 'transparent',
                                    fontWeight: value === option ? 600 : 400
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}