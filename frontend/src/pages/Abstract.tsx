import React, { useState } from 'react';
import { FileText, Github, PlaySquare } from 'lucide-react';

export const Abstract: React.FC = () => {
    const [abstract, setAbstract] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'txt' || fileExtension === 'md') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setAbstract(text);
                }
            };
            reader.readAsText(file);
        } else if (fileExtension === 'docx' || fileExtension === 'pdf') {
            setAbstract(`[Content extracted from ${file.name} via code]\n\nNote: This is a placeholder for the paper extraction requirement (.docx, .pdf).`);
        } else {
            setAbstract('Unsupported file format.');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-16 w-full pt-8 relative">
            <div className="absolute top-0 right-0 z-10">
                <input
                    type="file"
                    accept=".docx,.txt,.md,.pdf"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            <div className="flex flex-col items-center text-center space-y-6 pt-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                    SayEmo | Emotions in Your Voice
                </h1>

                <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8">
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

                <div className="flex flex-wrap justify-center gap-6 pt-10">
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <FileText className="w-5 h-5 text-primary-400" />
                        REPORT PDF
                    </button>
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <Github className="w-5 h-5 text-primary-400" />
                        SOURCE CODE
                    </button>
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg border border-white/5 tracking-wider">
                        <PlaySquare className="w-5 h-5 text-primary-400" />
                        DEMO VIDEO
                    </button>
                </div>
            </div>

            <div className="w-full h-[1px] bg-white/10 mt-14 mb-12"></div>

            <div className="max-w-[900px] mx-auto">
                <h2 className="text-4xl font-extrabold text-white text-center mb-10 tracking-tight">Abstract</h2>

                <div className="text-text-secondary text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                    {abstract ? (
                        <div className="bg-black/20 border border-white/5 rounded-3xl p-10 shadow-inner">
                            {abstract}
                        </div>
                    ) : (
                        <div className="text-center opacity-80 italic space-y-4 py-10 bg-black/20 border border-white/5 rounded-3xl p-10 relative overflow-hidden">
                            <p>No abstract content loaded yet.</p>
                            <p className="text-base text-text-secondary/80">Click the "Import Paper" button above to extract content.</p>

                            <div className="mt-10 text-left not-italic opacity-100 text-text-secondary text-lg leading-relaxed max-h-40 overflow-hidden relative blur-[1px]">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/80 pointer-events-none z-10"></div>
                                <p>Put Abstract here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
