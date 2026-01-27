'use client';

import React from 'react';
import { VoiceState } from '@/types';

interface VoiceControlProps {
    state: VoiceState;
    onStart: () => void;
    onStop: () => void;
    isSupported: boolean;
    transcript?: string;
}

const VoiceControl: React.FC<VoiceControlProps> = ({
    state,
    onStart,
    onStop,
    isSupported,
    transcript,
}) => {
    const handleClick = () => {
        if (state === 'listening') {
            onStop();
        } else if (state === 'idle') {
            onStart();
        }
    };

    const getButtonColor = () => {
        switch (state) {
            case 'listening':
                return 'from-green-500 to-emerald-600';
            case 'processing':
                return 'from-yellow-500 to-amber-600';
            case 'speaking':
                return 'from-rose-500 to-red-600';
            default:
                return 'from-red-500 to-red-700';
        }
    };

    const getStatusText = () => {
        switch (state) {
            case 'listening':
                return 'Mendengarkan...';
            case 'processing':
                return 'Memproses...';
            case 'speaking':
                return 'Berbicara...';
            default:
                return 'Tekan untuk berbicara';
        }
    };

    const getIcon = () => {
        switch (state) {
            case 'listening':
                return (
                    <svg
                        className="w-10 h-10 animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                );
            case 'processing':
                return (
                    <svg
                        className="w-10 h-10 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                );
            case 'speaking':
                return (
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                );
        }
    };

    if (!isSupported) {
        return (
            <div className="text-center p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                <p className="text-red-400 font-medium">
                    ⚠️ Browser Anda tidak mendukung Web Speech API
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                    Silakan gunakan Google Chrome atau Microsoft Edge
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Main control button */}
            <button
                onClick={handleClick}
                disabled={state === 'processing' || state === 'speaking'}
                className={`
          relative w-20 h-20 md:w-24 md:h-24 rounded-full
          bg-gradient-to-br ${getButtonColor()}
          text-white shadow-lg
          transform transition-all duration-300
          hover:scale-110 hover:shadow-2xl
          active:scale-95
          disabled:opacity-70 disabled:cursor-not-allowed
          focus:outline-none focus:ring-4 focus:ring-white/30
        `}
            >
                {/* Pulse animation ring */}
                {state === 'listening' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-30" />
                    </>
                )}
                {state === 'speaking' && (
                    <span className="absolute inset-0 rounded-full bg-rose-400 animate-pulse opacity-30" />
                )}

                {/* Icon */}
                <span className="relative z-10 flex items-center justify-center [&>svg]:w-8 [&>svg]:h-8 [&>svg]:md:w-10 [&>svg]:md:h-10">
                    {getIcon()}
                </span>
            </button>

            {/* Status text */}
            <div className="text-center">
                <p className="text-white/90 font-medium text-lg">{getStatusText()}</p>

                {/* Transcript preview */}
                {transcript && state === 'listening' && (
                    <p className="text-white/60 text-sm mt-2 max-w-xs truncate">
                        &quot;{transcript}&quot;
                    </p>
                )}
            </div>

            {/* Audio wave animation for listening state */}
            {state === 'listening' && (
                <div className="flex items-center gap-1 h-8">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-green-400 rounded-full animate-pulse"
                            style={{
                                height: `${12 + Math.random() * 20}px`,
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.5s',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoiceControl;
