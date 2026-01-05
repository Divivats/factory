import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [showEscTooltip, setShowEscTooltip] = useState(false);

    // Track focused index for keyboard navigation
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Track if any dropdown is open to disable grid navigation
    const [isDropdownActive, setIsDropdownActive] = useState(false);

    const searchBuffer = useRef<string>("");
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // =========================================================================
    // 1. DATA PROCESSING
    // =========================================================================
    const dateHierarchy = useMemo(() => {
        const hierarchy: Record<string, Record<string, Record<string, LogFileNode[]>>> = {};

        const processNode = (node: LogFileNode) => {
            if (!node.isDirectory) {
                const parts = node.path ? node.path.split(/[/\\]/) : [];
                let year = 'Unknown';
                let month = 'General';
                let day = 'Files';

                if (parts.length > 0 && /^\d{4}$/.test(parts[0])) {
                    year = parts[0];
                } else if (node.modifiedDate) {
                    year = new Date(node.modifiedDate).getFullYear().toString();
                }

                if (parts.length > 1) {
                    const rawMonth = parts[1];
                    if (/^\d+$/.test(rawMonth)) {
                        const monthNum = parseInt(rawMonth);
                        if (monthNum >= 1 && monthNum <= 12) {
                            const date = new Date();
                            date.setMonth(monthNum - 1);
                            month = date.toLocaleString('en-US', { month: 'long' });
                        } else {
                            month = rawMonth;
                        }
                    } else {
                        month = rawMonth;
                    }
                }

                if (parts.length > 2) {
                    const potentialDay = parts[2];
                    if (!potentialDay.toLowerCase().endsWith('.log') && !potentialDay.toLowerCase().endsWith('.txt')) {
                        day = potentialDay;
                    }
                }

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

    // =========================================================================
    // 2. HELPERS
    // =========================================================================
    const getSortedYears = () => Object.keys(dateHierarchy).sort((a, b) => parseInt(b) - parseInt(a));
    const getSortedMonths = (year: string) => {
        const yearData = dateHierarchy[year];
        if (!yearData) return [];
        return Object.keys(yearData).sort((a, b) =>
            new Date(`${b} 1, 2000`).getTime() - new Date(`${a} 1, 2000`).getTime()
        );
    };
    const getSortedDays = (year: string, month: string) => {
        const monthData = dateHierarchy[year]?.[month];
        if (!monthData) return [];
        return Object.keys(monthData).sort((a, b) => {
            const filesA = monthData[a];
            const filesB = monthData[b];
            const timeA = filesA?.[0]?.modifiedDate ? new Date(filesA[0].modifiedDate).getTime() : 0;
            const timeB = filesB?.[0]?.modifiedDate ? new Date(filesB[0].modifiedDate).getTime() : 0;
            return timeB - timeA;
        });
    };

    // =========================================================================
    // 3. HANDLERS
    // =========================================================================
    const handleYearChange = (newYear: string) => {
        setSelectedYear(newYear);
        const months = getSortedMonths(newYear);
        if (months.length > 0) {
            const latestMonth = months[0];
            setSelectedMonth(latestMonth);
            const days = getSortedDays(newYear, latestMonth);
            setSelectedDay(days.length > 0 ? days[0] : null);
        } else {
            setSelectedMonth(null);
            setSelectedDay(null);
        }
    };

    const handleMonthChange = (newMonth: string) => {
        setSelectedMonth(newMonth);
        if (selectedYear) {
            const days = getSortedDays(selectedYear, newMonth);
            setSelectedDay(days.length > 0 ? days[0] : null);
        }
    };

    // =========================================================================
    // 4. EFFECTS: Initial Load & Keyboard
    // =========================================================================
    useEffect(() => {
        const years = getSortedYears();
        if (years.length > 0) handleYearChange(years[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateHierarchy]);

    const files = useMemo(() => {
        return selectedYear && selectedMonth && selectedDay && dateHierarchy[selectedYear]?.[selectedMonth]?.[selectedDay]
            ? dateHierarchy[selectedYear][selectedMonth][selectedDay]
            : [];
    }, [selectedYear, selectedMonth, selectedDay, dateHierarchy]);

    // Scroll focused item into view
    useEffect(() => {
        if (focusedIndex !== -1 && gridRef.current) {
            const buttons = gridRef.current.querySelectorAll('button');
            if (buttons[focusedIndex]) {
                buttons[focusedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [focusedIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            // BLOCK navigation if a dropdown is actively open
            if (isDropdownActive) return;

            // BACK Navigation
            if (e.key === 'Escape') {
                // FIX: Check for EITHER standard modal OR graph overlay
                // If either exists, we are "deep" in the UI, so don't go back to PCs
                if (document.querySelector('.modal-overlay') || document.querySelector('.graph-overlay')) return;

                onBack();
                return;
            }

            if (files.length === 0) return;

            // --- NUMERIC INPUT HANDLING ---
            if (/^[0-9]$/.test(e.key)) {
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchBuffer.current += e.key;

                const num = parseInt(searchBuffer.current);

                // Logic: 0 = First Item. > Length = Last Item. Else = Specific Index.
                let targetIndex = 0;

                if (num === 0) {
                    targetIndex = 0;
                } else {
                    targetIndex = num - 1; // Convert 1-based (UI) to 0-based (Array)
                }

                // Clamp to last index
                if (targetIndex >= files.length) {
                    targetIndex = files.length - 1;
                }

                setFocusedIndex(targetIndex);

                // Reset buffer after delay
                searchTimeout.current = setTimeout(() => {
                    searchBuffer.current = "";
                }, 800);
                return;
            }

            // --- GRID NAVIGATION ---
            const cols = 8; // Must match CSS grid

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
                e.preventDefault();

                if (e.key === 'Enter') {
                    if (focusedIndex !== -1 && files[focusedIndex]) {
                        onSelectFile(files[focusedIndex].path);
                    }
                    return;
                }

                setFocusedIndex(prev => {
                    let next = prev === -1 ? 0 : prev;
                    switch (e.key) {
                        case 'ArrowRight': next = Math.min(prev + 1, files.length - 1); break;
                        case 'ArrowLeft': next = Math.max(prev - 1, 0); break;
                        case 'ArrowDown': next = Math.min(prev + cols, files.length - 1); break;
                        case 'ArrowUp': next = Math.max(prev - cols, 0); break;
                    }
                    return next;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, onBack, onSelectFile, focusedIndex, isDropdownActive]);

    // Sync focused index if selectedFile changes externally
    useEffect(() => {
        if (selectedFile) {
            const idx = files.findIndex(f => f.path === selectedFile);
            if (idx !== -1) setFocusedIndex(idx);
        }
    }, [selectedFile, files]);

    // =========================================================================
    // 6. RENDER
    // =========================================================================
    const availableYears = getSortedYears();
    const availableMonths = selectedYear ? getSortedMonths(selectedYear) : [];
    const availableDays = selectedYear && selectedMonth ? getSortedDays(selectedYear, selectedMonth) : [];

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
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa', margin: 0, marginBottom: '0.5rem' }}>
                        Log Files - Line {pcInfo.line} PC-{pcInfo.pcNumber}
                    </h2>
                    <div className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {pcInfo.logPath}
                    </div>
                </div>

                {/* BACK BUTTON */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onBack}
                        onMouseEnter={() => setShowEscTooltip(true)}
                        onMouseLeave={() => setShowEscTooltip(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '0.75rem' }}
                    >
                        <span>← Back to PCs</span>
                        {/* Keyboard Hint Badge */}
                        <div style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '0 4px',
                            background: 'var(--bg-app)',
                            fontFamily: 'system-ui',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 1px 0 rgba(0,0,0,0.2)'
                        }}>
                            ESC
                        </div>
                    </button>

                    <AnimatePresence>
                        {showEscTooltip && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute',
                                    top: '115%',
                                    right: 0,
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    color: '#f8fafc',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    zIndex: 50,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                Press <b style={{ color: '#fff' }}>Esc</b> to go back
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
                            options={availableYears}
                            value={selectedYear}
                            onChange={handleYearChange}
                            placeholder="Select Year"
                            onOpenChange={setIsDropdownActive}
                        />
                        <Dropdown
                            label="Month"
                            options={availableMonths}
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            placeholder="Select Month"
                            disabled={!selectedYear}
                            onOpenChange={setIsDropdownActive}
                        />
                        <Dropdown
                            label="Day"
                            options={availableDays}
                            value={selectedDay}
                            onChange={setSelectedDay}
                            placeholder="Select Day"
                            disabled={!selectedMonth}
                            onOpenChange={setIsDropdownActive}
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
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#60a5fa', margin: 0 }}>
                                    Available Files ({files.length})
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    <span style={{ marginRight: '1rem' }}>Use <b style={{ color: 'var(--text-main)' }}>Arrows</b> to navigate</span>
                                    <span style={{ marginRight: '1rem' }}>Type <b style={{ color: 'var(--text-main)' }}>number</b> to index</span>
                                    <span>Press <b style={{ color: 'var(--text-main)' }}>Enter</b> to open</span>
                                </div>
                            </div>

                            {/* --- FILE GRID --- */}
                            <div
                                ref={gridRef}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(8, 1fr)',
                                    gap: '0.75rem',
                                    height: '350px',
                                    overflowY: 'auto',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}
                            >
                                {files.map((file, idx) => {
                                    const isSelected = selectedFile === file.path;
                                    const isFocused = focusedIndex === idx;

                                    return (
                                        <motion.button
                                            key={file.path}
                                            onClick={() => {
                                                onSelectFile(file.path);
                                                setFocusedIndex(idx);
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                position: 'relative',
                                                background: isSelected
                                                    ? 'var(--primary-dim)'
                                                    : 'var(--bg-panel)',
                                                border: isSelected
                                                    ? '2px solid var(--primary)'
                                                    : isFocused
                                                        ? '2px solid rgba(59, 130, 246, 0.5)'
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
                                                height: '100px',
                                                minHeight: '100px',
                                                overflow: 'hidden',
                                                outline: 'none'
                                            }}
                                            className={isSelected ? '' : 'hover-card'}
                                        >
                                            {/* Numeric Index Badge */}
                                            {idx < 99 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    left: 6,
                                                    fontSize: '0.6rem',
                                                    color: isFocused ? 'var(--primary)' : 'var(--text-dim)',
                                                    fontWeight: 700,
                                                    opacity: isFocused ? 1 : 0.5
                                                }}>
                                                    {idx + 1}
                                                </div>
                                            )}

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
                                                color={isSelected ? 'var(--primary)' : 'var(--text-muted)'}
                                            />

                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: 'var(--text-main)',
                                                textAlign: 'center',
                                                wordBreak: 'break-word',
                                                lineHeight: 1.3,
                                                width: '100%'
                                            }}>
                                                {file.name}
                                            </div>

                                            {/* File Size */}
                                            {file.size && (
                                                <span className="text-mono" style={{
                                                    fontSize: '0.6rem',
                                                    color: 'var(--text-dim)',
                                                    fontWeight: 500
                                                }}>
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </span>
                                            )}

                                            {(isSelected || isFocused) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? 'var(--success)' : 'rgba(56, 189, 248, 0.4)',
                                                    boxShadow: isSelected ? '0 0 8px var(--success)' : 'none'
                                                }} />
                                            )}
                                        </motion.button>
                                    );
                                })}
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

// =========================================================================
// Dropdown Component (With Keyboard Navigation)
// =========================================================================
function Dropdown({ label, options, value, onChange, placeholder, disabled = false, onOpenChange }: {
    label: string;
    options: string[];
    value: string | null;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Notify parent when open state changes
    useEffect(() => {
        if (onOpenChange) onOpenChange(isOpen);
    }, [isOpen, onOpenChange]);

    // Reset highlight when opened
    useEffect(() => {
        if (isOpen) {
            const idx = value ? options.indexOf(value) : 0;
            setHighlightedIndex(idx !== -1 ? idx : 0);
        }
    }, [isOpen, value, options]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const buttons = listRef.current.querySelectorAll('button');
            if (buttons[highlightedIndex]) {
                buttons[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (options[highlightedIndex]) {
                    onChange(options[highlightedIndex]);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

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
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="btn btn-secondary"
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    border: isOpen ? '1px solid var(--primary)' : undefined
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
                    <div
                        ref={listRef}
                        style={{
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
                        }}
                    >
                        {options.map((option, idx) => {
                            const isSelected = value === option;
                            const isHighlighted = highlightedIndex === idx;

                            return (
                                <button
                                    key={option}
                                    onClick={() => { onChange(option); setIsOpen(false); }}
                                    className="btn btn-ghost"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        borderRadius: 0,
                                        background: isHighlighted
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : isSelected
                                                ? 'var(--primary-dim)'
                                                : 'transparent',
                                        fontWeight: isSelected ? 600 : 400,
                                        color: isHighlighted ? 'var(--primary)' : 'inherit',
                                        borderLeft: isHighlighted ? '3px solid var(--primary)' : '3px solid transparent'
                                    }}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}