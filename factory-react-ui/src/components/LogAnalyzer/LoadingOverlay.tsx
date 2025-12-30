// Loading Overlay Component - Engaging Animation
// Location: src/components/LogAnalyzer/LoadingOverlay.tsx

import { Loader2, Zap } from 'lucide-react';

interface Props {
    message?: string;
    submessage?: string;
}

export default function LoadingOverlay({ message = 'Loading...', submessage }: Props) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(11, 17, 33, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.3s ease-out'
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(56, 189, 248, 0.1) 100%)',
                    border: '2px solid var(--primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 5rem',
                    textAlign: 'center',
                    boxShadow: '0 25px 80px rgba(56, 189, 248, 0.3), 0 0 100px rgba(56, 189, 248, 0.1)',
                    animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Animated Background Effect */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                    animation: 'pulse 2s ease-in-out infinite'
                }} />

                {/* Orbiting Circles */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto',
                        position: 'relative'
                    }}>
                        {/* Center Spinner */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'spin 1s linear infinite'
                        }}>
                            <Loader2 size={64} color="var(--primary)" strokeWidth={2} />
                        </div>

                        {/* Orbiting Dots */}
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    boxShadow: '0 0 20px var(--primary)',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-6px',
                                    marginLeft: '-6px',
                                    animation: `orbit 2s linear infinite`,
                                    animationDelay: `${i * 0.5}s`,
                                    transformOrigin: '6px 6px'
                                }}
                            />
                        ))}
                    </div>

                    {/* Lightning Bolt Accent */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'flash 1.5s ease-in-out infinite'
                    }}>
                        <Zap size={32} color="var(--primary)" fill="var(--primary)" />
                    </div>
                </div>

                {/* Message */}
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: submessage ? '0.75rem' : 0,
                    background: 'linear-gradient(90deg, var(--primary), var(--text-main))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 2s ease-in-out infinite'
                }}>
                    {message}
                </div>

                {/* Submessage */}
                {submessage && (
                    <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-dim)',
                        marginTop: '0.75rem'
                    }}>
                        {submessage}
                    </div>
                )}

                {/* Animated Progress Dots */}
                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.75rem'
                }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                boxShadow: '0 0 15px var(--primary)',
                                animation: `bounce 1.4s ease-in-out ${i * 0.15}s infinite`
                            }}
                        />
                    ))}
                </div>

                {/* Progress Bar */}
                <div style={{
                    marginTop: '2rem',
                    height: '4px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    width: '250px',
                    margin: '2rem auto 0'
                }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), #60a5fa)',
                        borderRadius: '2px',
                        animation: 'progress 1.5s ease-in-out infinite',
                        boxShadow: '0 0 20px var(--primary)'
                    }} />
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes orbit {
                    0% { 
                        transform: rotate(0deg) translateX(60px) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% { 
                        transform: rotate(360deg) translateX(60px) rotate(-360deg);
                        opacity: 0;
                    }
                }

                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0.6) translateY(0);
                        opacity: 0.4;
                    }
                    40% {
                        transform: scale(1.2) translateY(-20px);
                        opacity: 1;
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.8;
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -200% center;
                    }
                    100% {
                        background-position: 200% center;
                    }
                }

                @keyframes flash {
                    0%, 100% {
                        opacity: 0.3;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                }

                @keyframes progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
            `}</style>
        </div>
    );
}