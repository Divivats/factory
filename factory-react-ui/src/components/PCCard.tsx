import { Cpu, Circle, Zap } from 'lucide-react'
import type { FactoryPC } from '../types'

interface Props {
    pc: FactoryPC
    onClick: (pc: FactoryPC) => void
    showVersion?: boolean  // Only show in overview mode
}

export default function PCCard({ pc, onClick, showVersion = false }: Props) {
    // Determine overall status color
    const getStatusColor = () => {
        if (!pc.isOnline) return 'var(--danger)'
        return 'var(--success)'
    }

    const getStatusGlow = () => {
        if (!pc.isOnline) return 'rgba(248, 113, 113, 0.15)'
        return 'rgba(52, 211, 153, 0.15)'
    }

    return (
        <div
            className="pc-card-aesthetic"
            onClick={() => onClick(pc)}
            style={{
                position: 'relative',
                width: '90px',
                background: `linear-gradient(135deg, ${getStatusGlow()}, var(--bg-card))`,
                border: `1px solid ${getStatusColor()}`,
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                boxShadow: `0 2px 8px ${getStatusGlow()}`,
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 8px 20px ${getStatusGlow()}, 0 0 0 2px ${getStatusColor()}`
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${getStatusGlow()}`
            }}
        >
            {/* Animated status pulse ring */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getStatusColor()}, transparent 70%)`,
                opacity: 0.15,
                animation: 'pulse-glow 2s ease-in-out infinite'
            }} />

            {/* PC Icon with gradient background */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '0.2rem'
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${getStatusGlow()}, transparent)`,
                    border: `2px solid ${getStatusColor()}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: `0 4px 12px ${getStatusGlow()}`
                }}>
                    <Cpu size={20} strokeWidth={2.5} color={getStatusColor()} />

                    {/* Status indicator dot */}
                    <div style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: getStatusColor(),
                        border: '2px solid var(--bg-card)',
                        boxShadow: `0 0 8px ${getStatusColor()}`,
                        animation: pc.isOnline ? 'pulse-dot 2s ease-in-out infinite' : 'none'
                    }} />
                </div>
            </div>

            {/* PC Number */}
            <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                textAlign: 'center',
                letterSpacing: '-0.02em',
                lineHeight: 1
            }}>
                PC-{pc.pcNumber}
            </div>

            {/* IP Address */}
            <div className="text-mono" style={{
                fontSize: '0.55rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: '0.2rem'
            }}>
                {pc.ipAddress}
            </div>

            {/* Version Badge - Only in Overview */}
            {showVersion && (
                <div className="text-mono" style={{
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textAlign: 'center',
                    padding: '0.15rem 0.25rem',
                    background: 'var(--primary-dim)',
                    border: '1px solid var(--primary)',
                    borderRadius: '4px',
                    letterSpacing: '0.02em'
                }}>
                    v{pc.modelVersion}
                </div>
            )}

            {/* Status Pills - Agent & App */}
            <div style={{
                display: 'flex',
                gap: '0.2rem',
                justifyContent: 'center'
            }}>
                {/* Agent Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    padding: '0.12rem 0.3rem',
                    borderRadius: '10px',
                    background: pc.isOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${pc.isOnline ? 'var(--success)' : 'var(--danger)'}`,
                    fontSize: '0.48rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                }}>
                    <Circle
                        size={4}
                        fill={pc.isOnline ? 'var(--success)' : 'var(--danger)'}
                        strokeWidth={0}
                    />
                    <span style={{ color: pc.isOnline ? 'var(--success)' : 'var(--danger)' }}>AG</span>
                </div>

                {/* App Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    padding: '0.12rem 0.3rem',
                    borderRadius: '10px',
                    background: pc.isApplicationRunning ? 'var(--success-bg)' : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${pc.isApplicationRunning ? 'var(--success)' : 'var(--border)'}`,
                    fontSize: '0.48rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                }}>
                    <Zap
                        size={4}
                        fill={pc.isApplicationRunning ? 'var(--success)' : 'var(--text-dim)'}
                        strokeWidth={0}
                    />
                    <span style={{ color: pc.isApplicationRunning ? 'var(--success)' : 'var(--text-dim)' }}>AP</span>
                </div>
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        opacity: 0.15;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.3;
                        transform: scale(1.1);
                    }
                }

                @keyframes pulse-dot {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }
            `}</style>
        </div>
    )
}
