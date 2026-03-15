import React from 'react';
import { FileText, Github, PlaySquare } from 'lucide-react';

export const Abstract: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto pb-16 w-full pt-8 relative">
            <div className="flex flex-col items-center text-center space-y-6 pt-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    SayEmo | Emotions in Your Voice
                </h1>

                <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex flex-col items-center">
                        <span className="text-primary-400 font-bold text-lg md:text-xl">Nguyen Minh Triet</span>
                        <span className="text-text-secondary/60 text-sm mt-1.5">Contributor</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-primary-400 font-bold text-lg md:text-xl">Nguyen Quach Lam Giang</span>
                        <span className="text-text-secondary/60 text-sm mt-1.5">Contributor</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-primary-400 font-bold text-lg md:text-xl">Bui Tan Phat</span>
                        <span className="text-text-secondary/60 text-sm mt-1.5">Contributor</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-primary-400 font-bold text-lg md:text-xl">Do Khang</span>
                        <span className="text-text-secondary/60 text-sm mt-1.5">Contributor</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-6 pt-10 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <FileText className="w-5 h-5 text-primary-400" />
                        REPORT PDF
                    </button>
                    <a href="https://github.com/SONNYisCoding/SayEmo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <Github className="w-5 h-5 text-primary-400" />
                        SOURCE CODE
                    </a>
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <PlaySquare className="w-5 h-5 text-primary-400" />
                        DEMO VIDEO
                    </button>
                </div>
            </div>

            <div className="w-full h-[1px] bg-white/10 mt-14 mb-12 animate-fade-in-up" style={{ animationDelay: '600ms' }}></div>

            <div className="max-w-[900px] mx-auto animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <h2 className="text-4xl font-extrabold text-white text-center mb-10 tracking-tight">Abstract</h2>

                <div className="text-text-secondary text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                    <div className="bg-black/20 border border-white/5 rounded-3xl p-10 shadow-inner">
                        Speech Emotion Recognition (SER) has become an important research topic in artificial intelligence and speech signal processing, with applications in human–computer interaction, virtual assistants, and behavioral analysis. However, recognizing emotions from speech remains challenging due to the complexity of acoustic features, the overlap between emotional states, and the variability across different datasets. In this study, we propose a deep learning–based approach to effectively capture spatiotemporal representations from speech signals for improving SER performance. The proposed method is evaluated on a combined emotional speech dataset constructed from multiple sources to increase data diversity and improve model generalization. Experimental results demonstrate that the model can effectively learn emotional representations and achieve promising performance in terms of evaluation metrics such as accuracy and F1-score. These findings indicate that the proposed approach has the potential to enhance the effectiveness of speech emotion recognition systems in real-world applications.
                    </div>
                </div>
            </div>
        </div>
    );
};
