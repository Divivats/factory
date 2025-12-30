// Log File Selector Component with Year/Month/Day Headers
// Location: src/components/LogAnalyzer/LogFileSelector.tsx

import { useState, useMemo } from 'react';
import { FileText, ChevronDown, Calendar } from 'lucide-react';
import type { LogFileNode } from '../../types/logTypes';

interface Props {
    logFiles: LogFileNode[];
    selectedFile: string | null;
    onSelectFile: (filePath: string) => void;
    disabled?: boolean;
}

interface GroupedFile {
    path: string;
    name: string;
    size?: number;
    modifiedDate?: string;
}

interface FilesByDay {
    day: string;
    files: GroupedFile[];
}

interface FilesByMonth {
    month: string;
    days: FilesByDay[];
}

interface FilesByYear {
    year: string;
    months: FilesByMonth[];
}

export default function LogFileSelector({ logFiles, selectedFile, onSelectFile, disabled }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    // Flatten and group files by year/month/day
    const groupedFiles = useMemo(() => {
        const flatFiles: GroupedFile[] = [];

        const flatten = (nodes: LogFileNode[]) => {
            nodes.forEach(node => {
                if (node.isDirectory && node.children) {
                    flatten(node.children);
                } else if (!node.isDirectory) {
                    flatFiles.push({
                        path: node.path,
                        name: node.name,
                        size: node.size,
                        modifiedDate: node.modifiedDate
                    });
                }
            });
        };

        flatten(logFiles);

        // Group by year/month/day based on modified date or filename
        const yearMap = new Map<string, Map<string, Map<string, GroupedFile[]>>>();

        flatFiles.forEach(file => {
            let year = 'Unknown';
            let month = 'Unknown';
            let day = 'Unknown';

            if (file.modifiedDate) {
                const date = new Date(file.modifiedDate);
                year = date.getFullYear().toString();
                month = date.toLocaleDateString('en-US', { month: 'long' });
                day = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else {
                // Try to extract date from filename (common format: YYYY-MM-DD or YYYYMMDD)
                const dateMatch = file.name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
                if (dateMatch) {
                    const [, y, m, d] = dateMatch;
                    year = y;
                    const monthIndex = parseInt(m) - 1;
                    const date = new Date(parseInt(y), monthIndex, parseInt(d));
                    month = date.toLocaleDateString('en-US', { month: 'long' });
                    day = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                }
            }

            if (!yearMap.has(year)) {
                yearMap.set(year, new Map());
            }
            const monthMap = yearMap.get(year)!;

            if (!monthMap.has(month)) {
                monthMap.set(month, new Map());
            }
            const dayMap = monthMap.get(month)!;

            if (!dayMap.has(day)) {
                dayMap.set(day, []);
            }
            dayMap.get(day)!.push(file);
        });

        // Convert to array structure
        const result: FilesByYear[] = [];

        yearMap.forEach((monthMap, year) => {
            const months: FilesByMonth[] = [];

            monthMap.forEach((dayMap, month) => {
                const days: FilesByDay[] = [];

                dayMap.forEach((files, day) => {
                    days.push({ day, files });
                });

                months.push({ month, days });
            });

            result.push({ year, months });
        });

        // Sort years descending, months chronologically, days chronologically
        result.sort((a, b) => {
            if (a.year === 'Unknown') return 1;
            if (b.year === 'Unknown') return -1;
            return parseInt(b.year) - parseInt(a.year);
        });

        return result;
    }, [logFiles]);

    const selectedFileName = useMemo(() => {
        if (!selectedFile) return null;

        const allFiles: GroupedFile[] = [];
        groupedFiles.forEach(year => {
            year.months.forEach(month => {
                month.days.forEach(day => {
                    allFiles.push(...day.files);
                });
            });
        });

        const file = allFiles.find(f => f.path === selectedFile);
        return file?.name || null;
    }, [selectedFile, groupedFiles]);

    const totalFiles = useMemo(() => {
        let count = 0;
        groupedFiles.forEach(year => {
            year.months.forEach(month => {
                month.days.forEach(day => {
                    count += day.files.length;
                });
            });
        });
        return count;
    }, [groupedFiles]);

    return (
        <div style={{ position: 'relative', width: '400px' }}>
            <button
                className="btn btn-secondary"
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={18} color="var(--primary)" />
                    <span style={{
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {selectedFileName || `Select Log File (${totalFiles} available)`}
                    </span>
                </div>
                <ChevronDown size={18} />
            </button>

            {isOpen && !disabled && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            maxHeight: '600px',
                            overflowY: 'auto',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            zIndex: 1000,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                        }}
                    >
                        {groupedFiles.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                No log files available
                            </div>
                        ) : (
                            groupedFiles.map(yearGroup => (
                                <div key={yearGroup.year}>
                                    {/* Year Header */}
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        background: 'linear-gradient(90deg, var(--primary), transparent)',
                                        borderBottom: '1px solid var(--border)',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        backdropFilter: 'blur(8px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Calendar size={16} color="var(--primary)" />
                                        <span style={{
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            {yearGroup.year}
                                        </span>
                                    </div>

                                    {yearGroup.months.map(monthGroup => (
                                        <div key={`${yearGroup.year}-${monthGroup.month}`}>
                                            {/* Month Header */}
                                            <div style={{
                                                padding: '0.6rem 1.5rem',
                                                background: 'var(--bg-hover)',
                                                borderBottom: '1px solid var(--border)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: 'var(--text-main)'
                                            }}>
                                                {monthGroup.month}
                                            </div>

                                            {monthGroup.days.map(dayGroup => (
                                                <div key={`${yearGroup.year}-${monthGroup.month}-${dayGroup.day}`}>
                                                    {/* Day Header */}
                                                    <div style={{
                                                        padding: '0.5rem 2rem',
                                                        background: 'var(--bg-panel)',
                                                        borderBottom: '1px solid var(--border)',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-dim)'
                                                    }}>
                                                        {dayGroup.day}
                                                    </div>

                                                    {/* Files */}
                                                    {dayGroup.files.map(file => (
                                                        <button
                                                            key={file.path}
                                                            className="btn btn-ghost"
                                                            style={{
                                                                width: '100%',
                                                                justifyContent: 'flex-start',
                                                                padding: '0.75rem 2.5rem',
                                                                borderRadius: 0,
                                                                background: file.path === selectedFile ? 'var(--primary-dim)' : 'transparent',
                                                                borderBottom: '1px solid var(--border)'
                                                            }}
                                                            onClick={() => {
                                                                onSelectFile(file.path);
                                                                setIsOpen(false);
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                width: '100%',
                                                                justifyContent: 'space-between'
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.75rem',
                                                                    flex: 1,
                                                                    minWidth: 0
                                                                }}>
                                                                    <FileText size={14} color="var(--primary)" />
                                                                    <span style={{
                                                                        fontSize: '0.85rem',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        {file.name}
                                                                    </span>
                                                                </div>
                                                                {file.size && (
                                                                    <span
                                                                        className="text-mono"
                                                                        style={{
                                                                            fontSize: '0.7rem',
                                                                            color: 'var(--text-dim)',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        {formatFileSize(file.size)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}