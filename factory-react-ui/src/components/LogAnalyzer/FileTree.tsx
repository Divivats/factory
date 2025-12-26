// File Tree Component
// Location: src/components/LogAnalyzer/FileTree.tsx

import { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import type { LogFileNode } from '../../types/logTypes';

interface Props {
    nodes: LogFileNode[];
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
}

export default function FileTree({ nodes, selectedFile, onSelectFile }: Props) {
    return (
        <div style={{ padding: '0.5rem' }}>
            {nodes.map(node => (
                <TreeNode
                    key={node.path}
                    node={node}
                    level={0}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                />
            ))}
        </div>
    );
}

interface TreeNodeProps {
    node: LogFileNode;
    level: number;
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
}

function TreeNode({ node, level, selectedFile, onSelectFile }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level === 0);

    const isSelected = node.path === selectedFile;

    const handleClick = () => {
        if (node.isDirectory) {
            setIsExpanded(!isExpanded);
        } else {
            onSelectFile(node.path);
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    paddingLeft: `${level * 1.5 + 0.5}rem`,
                    background: isSelected ? 'var(--primary-dim)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                    }
                }}
            >
                {node.isDirectory ? (
                    <>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {isExpanded ? <FolderOpen size={16} color="var(--warning)" /> : <Folder size={16} color="var(--warning)" />}
                    </>
                ) : (
                    <>
                        <div style={{ width: '16px' }} />
                        <FileText size={16} color="var(--primary)" />
                    </>
                )}
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{node.name}</span>
                {!node.isDirectory && node.size && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {formatFileSize(node.size)}
                    </span>
                )}
            </button>

            {node.isDirectory && isExpanded && node.children && node.children.length > 0 && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            level={level + 1}
                            selectedFile={selectedFile}
                            onSelectFile={onSelectFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}