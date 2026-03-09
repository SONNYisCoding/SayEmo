import React, { useState } from 'react';
import { BookOpen, Save, CheckCircle2, UploadCloud } from 'lucide-react';

export const Abstract: React.FC = () => {
    const [abstract, setAbstract] = useState('');
    const [saved, setSaved] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = () => {
        // Here you would typically save to your backend
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                setAbstract(text);
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    Project Abstract
                    <BookOpen className="w-8 h-8 text-primary-400" />
                </h1>
                <p className="text-text-secondary text-lg">Provide a summary of your Speech Emotion Recognition project.</p>
            </header>

            <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <BookOpen className="w-32 h-32" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between mb-3">
                        <label htmlFor="abstract" className="block text-sm font-semibold text-text-secondary uppercase tracking-wider">
                            Abstract Content
                        </label>

                        <div>
                            <input
                                type="file"
                                accept=".txt,.md"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg border border-primary-500/20"
                            >
                                <UploadCloud className="w-4 h-4" />
                                Import from File (.txt, .md)
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="abstract"
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        placeholder="Enter the abstract of your project here. E.g. 'In this project, we explore the use of advanced deep learning models such as 3DCNN and Wav2Vec2.0 to accurately recognize human emotion from speech signals...'"
                        className="w-full h-80 bg-black/20 border border-white/10 rounded-2xl p-6 text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y transition-all"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!abstract.trim()}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${saved
                            ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                    >
                        {saved ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Saved Successfully
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Abstract
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
