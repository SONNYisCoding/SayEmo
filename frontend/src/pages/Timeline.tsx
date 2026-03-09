import React from 'react';
import { Calendar, Monitor, Cpu, Network, CheckCircle2 } from 'lucide-react';

interface TimelineItem {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
}

const timelineData: TimelineItem[] = [
    {
        id: 1,
        title: "Research & Initiation",
        subtitle: "Week 37-39",
        description: "Study Mech-Eye 3D Camera",
        icon: <Monitor className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    },
    {
        id: 2,
        title: "System Setup",
        subtitle: "Week 39-40",
        description: "Setup Camera & 2D/3D Processing",
        icon: <Monitor className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    },
    {
        id: 3,
        title: "Data & AI Training",
        subtitle: "Week 41-43",
        description: "Data Collection & Training YOLOv8/U-Net",
        icon: <Cpu className="w-5 h-5 text-white" />,
        iconBg: "bg-orange-500"
    },
    {
        id: 4,
        title: "System Integration",
        subtitle: "Week 43-46",
        description: "Inference Pipeline & Skeletonization",
        icon: <Network className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    },
    {
        id: 5,
        title: "Finalization",
        subtitle: "Week 46-49",
        description: "Final Report & Optimization",
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        iconBg: "bg-emerald-500"
    }
];

export const Timeline: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
                    Project Timeline
                </h1>
                <p className="text-text-secondary text-lg font-medium">
                    [Week 37] 08/09/2025 - 14/12/2025 [Week 49]
                </p>
            </header>

            <div className="relative mt-16">
                {/* Central Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white/10 rounded-full" />

                <div className="space-y-12">
                    {timelineData.map((item, index) => {
                        const isEven = index % 2 !== 0; // Alternating layout

                        return (
                            <div key={item.id} className="relative flex items-center justify-between w-full">

                                {/* Left Side Box or Subtitle */}
                                <div className={`w-[45%] flex ${isEven ? 'justify-end' : 'justify-end'}`}>
                                    {isEven ? (
                                        // Card on Left
                                        <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-md hover:bg-surface/80 transition-all">
                                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                            <p className="text-sm text-text-secondary">{item.description}</p>
                                        </div>
                                    ) : (
                                        // Text on Left
                                        <div className="pr-8 flex items-center h-full">
                                            <span className={`text-xl font-bold ${item.iconBg.replace('bg-', 'text-')}`}>
                                                {item.subtitle}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Center Icon */}
                                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
                                    <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center shadow-lg border-4 border-background ring-2 ring-white/10`}>
                                        {item.icon}
                                    </div>
                                </div>

                                {/* Right Side Box or Subtitle */}
                                <div className={`w-[45%] flex ${isEven ? 'justify-start' : 'justify-start'}`}>
                                    {isEven ? (
                                        // Text on Right
                                        <div className="pl-8 flex items-center h-full">
                                            <span className={`text-xl font-bold ${item.iconBg.replace('bg-', 'text-')}`}>
                                                {item.subtitle}
                                            </span>
                                        </div>
                                    ) : (
                                        // Card on Right
                                        <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-md hover:bg-surface/80 transition-all">
                                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                            <p className="text-sm text-text-secondary">{item.description}</p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
