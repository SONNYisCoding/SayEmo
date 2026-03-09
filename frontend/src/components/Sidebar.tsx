import React from 'react';
import { NavLink } from 'react-router-dom';
import type { ModelMetric } from '../types';
import { Activity, Brain, Server, ShieldCheck, Home, FileText, CalendarRange } from 'lucide-react';

interface SidebarProps {
    models: ModelMetric[];
    selectedModel: string;
    onSelectModel: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ models, selectedModel, onSelectModel }) => {
    return (
        <aside className="w-72 bg-surface/50 backdrop-blur-xl border-r border-white/10 h-screen flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 text-primary-400 font-bold text-2xl tracking-tight">
                    <div className="p-2 bg-primary-500/20 rounded-xl">
                        <Activity className="w-6 h-6 text-primary-400" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-300">
                        SayEmo AI
                    </span>
                </div>
                <p className="text-sm text-text-secondary mt-2 opacity-80">Speech Emotion Recognition</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">

                {/* Navigation Menu */}
                <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2">
                        Menu
                    </h3>
                    <nav className="space-y-1">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary-500/20 text-primary-300 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                    : 'text-text-secondary hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Home className="w-5 h-5" /> Dashboard
                        </NavLink>
                        <NavLink
                            to="/abstract"
                            className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary-500/20 text-primary-300 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                    : 'text-text-secondary hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <FileText className="w-5 h-5" /> Abstract
                        </NavLink>
                        <NavLink
                            to="/timeline"
                            className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary-500/20 text-primary-300 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                    : 'text-text-secondary hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CalendarRange className="w-5 h-5" /> Project Timeline
                        </NavLink>
                    </nav>
                </div>

                <div className="h-px bg-white/10 w-full" />

                {/* Model Selection */}
                <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" /> Inference Models
                    </h3>
                    <div className="space-y-2">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => onSelectModel(model.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group border ${selectedModel === model.id
                                    ? 'bg-primary-500/10 border-primary-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                {selectedModel === model.id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-50 pointer-events-none" />
                                )}
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className={`font-semibold ${selectedModel === model.id ? 'text-primary-300' : 'text-text-primary'}`}>
                                        {model.name}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${model.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'
                                        }`} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs relative z-10 mt-3">
                                    <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                        <span className="text-text-secondary block mb-1">Accuracy</span>
                                        <span className="font-medium text-emerald-300">{(model.accuracy * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                        <span className="text-text-secondary block mb-1">F1-Score</span>
                                        <span className="font-medium text-indigo-300">{(model.f1_score * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex items-center gap-3 text-sm text-text-secondary px-2">
                    <Server className="w-4 h-4" />
                    <span>Backend Connected</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto" />
                </div>
            </div>
        </aside>
    );
};
