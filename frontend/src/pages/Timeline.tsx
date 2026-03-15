import React from 'react';
import { Monitor, Cpu, Network } from 'lucide-react';

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
        subtitle: "Week 1-3",
        description: "Study SER Methods",
        icon: <Monitor className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    },
    {
        id: 2,
        title: "Dataset Setup",
        subtitle: "Week 3-5",
        description: "Setup Dataset and Preprocessing",
        icon: <Monitor className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    },
    {
        id: 3,
        title: "Training Models",
        subtitle: "Week 5-7",
        description: "Training SER Models and Evaluate",
        icon: <Cpu className="w-5 h-5 text-white" />,
        iconBg: "bg-orange-500"
    },
    {
        id: 4,
        title: "Paper Completion and Report",
        subtitle: "Week 7-8",
        description: "Complete Paper and Report",
        icon: <Network className="w-5 h-5 text-white" />,
        iconBg: "bg-blue-500"
    }
];

const AnimatedTimelineItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const isEven = index % 2 !== 0; // Alternating layout

    return (
        <div ref={ref} className="relative flex items-center justify-between w-full group">
            {/* Left Side Box or Subtitle */}
            <div className={`w-[45%] flex ${isEven ? 'justify-end' : 'justify-end'} transition-all duration-1000 ease-out delay-[200ms] ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
                {isEven ? (
                    // Card on Left
                    <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-md hover:bg-surface/80 hover:-translate-y-1 transition-all hover:shadow-2xl hover:border-white/20">
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
            <div className={`absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10 transition-all duration-700 ease-out ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] border-4 border-background ring-2 ring-white/10 transition-all duration-300 group-hover:scale-110`}>
                    {item.icon}
                </div>
            </div>

            {/* Right Side Box or Subtitle */}
            <div className={`w-[45%] flex ${isEven ? 'justify-start' : 'justify-start'} transition-all duration-1000 ease-out delay-[200ms] ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
                {isEven ? (
                    // Text on Right
                    <div className="pl-8 flex items-center h-full">
                        <span className={`text-xl font-bold ${item.iconBg.replace('bg-', 'text-')}`}>
                            {item.subtitle}
                        </span>
                    </div>
                ) : (
                    // Card on Right
                    <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-md hover:bg-surface/80 hover:-translate-y-1 transition-all hover:shadow-2xl hover:border-white/20">
                        <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-text-secondary">{item.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Timeline: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
                    Project Timeline
                </h1>
                <p className="text-text-secondary text-lg font-medium">
                    [Week 1] 06/01/2026 - 15/10/2025 [Week 8]
                </p>
            </header>

            <div className="relative mt-16">
                {/* Central Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white/10 rounded-full" />

                <div className="space-y-12">
                    {timelineData.map((item, index) => (
                        <AnimatedTimelineItem key={item.id} item={item} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};
