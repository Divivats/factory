// Loading Overlay Component - Slower & Smooth Connected Pistons
// Location: src/components/LogAnalyzer/LoadingOverlay.tsx

import React from 'react';

interface Props {
    message?: string;
    submessage?: string;
}

export default function LoadingOverlay({ message = 'LOADING...', submessage }: Props) {
    const pegCount = 12;
    const radius = 85;
    const pegSize = 32;

    // CONFIG: Animation Speed
    // Increased duration for a "somewhat slow", relaxed mechanical feel
    const ANIMATION_DURATION = '2.2s';
    const STAGGER_DELAY = 0.18; // Increased delay to match the slower speed

    // Helper to generate the "Solid Column" shadow stack
    // The cylinder lifts 20px, so we need ~20 layers of shadow to bridge the gap perfectly.
    const generateColumnShadow = (color: string) => {
        let shadow = '';
        for (let i = 1; i <= 20; i++) {
            shadow += `0px ${i}px 0px ${color}${i === 20 ? '' : ','}`;
        }
        return shadow;
    };

    const cylinderBodyColor = '#3b5cb8'; // Darker blue for the sides

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: '#23242a',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.5s ease-out', // Slower fade in too
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* The Tray - Tilted 15 degrees */}
            <div
                style={{
                    position: 'relative',
                    width: '260px',
                    height: '260px',
                    borderRadius: '50%',
                    background: '#2b2b2b',
                    // The concave dish look
                    boxShadow: 'inset 5px 5px 15px rgba(0,0,0,0.5), inset -5px -5px 15px rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // Tilted slightly to show the piston sides
                    transform: 'rotateX(15deg)',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* 1. The Piston Pegs */}
                {[...Array(pegCount)].map((_, i) => {
                    const angle = (i * 360) / pegCount;
                    const radian = (angle * Math.PI) / 180;
                    const x = Math.cos(radian - Math.PI / 2) * radius;
                    const y = Math.sin(radian - Math.PI / 2) * radius;

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                width: `${pegSize}px`,
                                height: `${pegSize}px`,
                                // Position on the tray
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    // Default: Dark Hole
                                    background: '#2b2b2b',
                                    boxShadow: 'inset 2px 2px 5px #181818, inset -2px -2px 5px #3e3e3e',
                                    // The Piston Animation
                                    animation: `pistonPump ${ANIMATION_DURATION} ease-in-out infinite`,
                                    animationDelay: `${i * STAGGER_DELAY}s`,
                                }}
                            />
                        </div>
                    );
                })}

                {/* 2. Center Text - Counter-rotated to stand up straight */}
                <div style={{
                    zIndex: 10,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    // Counter-rotate so text faces user directly
                    transform: 'rotateX(-15deg)'
                }}>
                    <div style={{
                        color: '#eeeeee',
                        fontSize: '14px',
                        letterSpacing: '3px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        opacity: 0.9,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {message}
                    </div>
                    {submessage && (
                        <div style={{
                            color: '#888888',
                            fontSize: '12px',
                            marginTop: '6px',
                            fontWeight: '400'
                        }}>
                            {submessage}
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Keyframes */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes pistonPump {
                    0% {
                        /* DOWN: Inside the hole */
                        transform: translateY(0px);
                        background-color: #2b2b2b;
                        /* Inner shadow = Hole */
                        box-shadow: inset 2px 2px 5px #181818, inset -2px -2px 5px #3e3e3e;
                    }
                    12% {
                        /* UP: Popped out */
                        /* Lift 20px up */
                        transform: translateY(-20px); 
                        background-color: #5d8bf4;    /* Bright Blue Cap */
                        
                        /* THE CONNECTED SURFACE TRICK:
                           The shadow stack now has 20 layers to match the 20px lift.
                           This ensures no gap appears between the cap and the tray.
                        */
                        box-shadow: 
                            /* The Cylinder Body */
                            ${generateColumnShadow(cylinderBodyColor)},
                            /* The Drop Shadow on the floor */
                            0px 30px 20px rgba(0,0,0,0.4);
                    }
                    35%, 100% {
                        /* BACK DOWN SLOWLY */
                        transform: translateY(0px);
                        background-color: #2b2b2b;
                        box-shadow: inset 2px 2px 5px #181818, inset -2px -2px 5px #3e3e3e;
                    }
                }
            `}</style>
        </div>
    );
}