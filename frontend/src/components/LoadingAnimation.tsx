import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Cpu, Activity, Waves } from 'lucide-react';

const LOADING_MESSAGES = [
    "Waking up the SayEmo Artificial Intelligence...",
    "Cold starting the Cloud Run container...",
    "Loading deep learning models into memory...",
    "Extracting audio features (Log-Mel Spectrograms)...",
    "Running transformer-based inference...",
    "Analyzing emotions with high precision...",
    "Almost there! Decoding neural representations..."
];

export const LoadingAnimation: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        // Cycle through messages every 6 seconds to match the long wait time
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in duration-700">
            {/* Visual Animation Circle */}
            <div className="relative w-48 h-48 mb-12 flex justify-center items-center">
                
                {/* Outer rotating dashed ring */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary-500/30 animate-[spin_10s_linear_infinite]" />
                
                {/* Middle pulsing ring */}
                <div className="absolute inset-4 rounded-full border border-indigo-500/50 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                
                {/* Inner glowing core */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary-600 to-rose-500 blur-xl opacity-40 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-10 rounded-full bg-surface/90 backdrop-blur-3xl border border-white/10 flex items-center justify-center shadow-2xl z-10">
                    <div className="relative">
                        <Waves className="w-12 h-12 text-primary-400 absolute opacity-50 animate-ping" />
                        <Brain className="w-12 h-12 text-white relative z-10 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                </div>

                {/* Orbiting particles */}
                <Sparkles className="absolute top-0 left-1/2 -ml-3 w-6 h-6 text-amber-400 animate-[spin_4s_linear_infinite_reverse] origin-[50%_96px]" />
                <Cpu className="absolute bottom-0 right-1/2 -mr-3 w-6 h-6 text-emerald-400 animate-[spin_6s_linear_infinite] origin-[50%_-96px]" />
                <Activity className="absolute left-0 top-1/2 -mt-3 w-6 h-6 text-rose-400 animate-[spin_5s_linear_infinite] origin-[96px_50%]" />
            </div>

            {/* Text and Status */}
            <div className="text-center space-y-4 max-w-md w-full">
                <div className="h-2 w-full bg-surface border border-white/10 rounded-full overflow-hidden mb-8 relative">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-[translateX_2s_linear_infinite]" 
                         style={{ transform: 'translateX(-100%)', animation: 'slide-right 2s ease-in-out infinite' }} />
                    <style>{`
                        @keyframes slide-right {
                            0% { left: -30%; }
                            100% { left: 130%; }
                        }
                    `}</style>
                </div>

                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-300 animate-pulse">
                    AI is processing your audio
                </h3>
                
                <p className="text-text-secondary h-6 transition-all duration-500 ease-in-out font-medium">
                    {LOADING_MESSAGES[messageIndex]}
                </p>

                <p className="text-xs text-text-secondary/50 pt-4">
                    First request may take up to 4-6 minutes due to server load mechanics. Please don't refresh the page.
                </p>
            </div>
        </div>
    );
};
