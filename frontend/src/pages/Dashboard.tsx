import React, { useState, useRef, useCallback } from 'react';
import type { PredictionResponse } from '../types';
import { UploadCloud, Mic, Square, Play, Loader2, Sparkles, AlertCircle, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:5000';

const chartColors = [
    '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6',
];

export const Dashboard: React.FC = () => {
    // Get selected model name from layout context
    const { selectedModel, selectedModelName } = useOutletContext<{ selectedModel: string, selectedModelName: string }>();

    const [file, setFile] = useState<File | Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isInferring, setIsInferring] = useState(false);
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.includes('audio')) {
                setFile(droppedFile);
                setAudioUrl(URL.createObjectURL(droppedFile));
                setResult(null);
                setError(null);
            } else {
                setError('Please drop a valid audio file (.wav, .mp3)');
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setAudioUrl(URL.createObjectURL(selected));
            setResult(null);
            setError(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setFile(audioBlob);
                setAudioUrl(URL.createObjectURL(audioBlob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setResult(null);
            setError(null);
        } catch (err) {
            setError('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleInfer = async () => {
        if (!file) return;

        setIsInferring(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('audio', file, 'audio_sample.webm');
            formData.append('modelName', selectedModel);

            const response = await axios.post<PredictionResponse>(`${BACKEND_URL}/api/predict`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to connect to the backend server. Make sure it is running on port 5000.');
        } finally {
            setIsInferring(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    Emotion Analysis Panel
                    <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </h1>
                <p className="text-text-secondary text-lg">Upload an audio file or record a voice snippet to detect emotions.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Card */}
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-surface/60 hover:border-primary-500/40 group relative overflow-hidden h-72"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="p-4 bg-primary-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <UploadCloud className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Drag & Drop Audio</h3>
                    <p className="text-text-secondary text-sm mb-6 max-w-xs">Supported formats: .wav, .mp3, .ogg</p>
                    <label className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full cursor-pointer transition-colors font-medium text-sm">
                        Browse Files
                        <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>

                {/* Record Card */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all h-72 relative overflow-hidden">
                    <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                    </div>
                    <div className={`p-4 rounded-full mb-6 transition-all duration-500 ${isRecording
                        ? 'bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-110 animate-pulse'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}>
                        <Mic className={`w-10 h-10 ${isRecording ? 'text-rose-400' : 'text-text-secondary'}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Live Recording</h3>
                    <p className="text-text-secondary text-sm mb-6 h-5">
                        {isRecording ? 'Recording in progress...' : 'Click to start capturing your voice'}
                    </p>
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-lg text-sm ${isRecording
                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5'
                            }`}
                    >
                        {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Audio Player & Inference Logic */}
            {audioUrl && (
                <div className="bg-surface/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl transform transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 w-full bg-black/20 p-4 rounded-2xl border border-white/5">
                            <audio src={audioUrl} controls className="w-full h-10 custom-audio" />
                        </div>
                        <button
                            onClick={handleInfer}
                            disabled={isInferring}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-500 hover:from-primary-500 hover:to-indigo-400 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/25 transition-all hover:shadow-primary-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group whitespace-nowrap"
                        >
                            {isInferring ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing Voice...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Run Inference
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700 pb-12">
                    <div className="lg:col-span-1 bg-gradient-to-br from-surface/80 to-surface/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-32 h-32" />
                        </div>
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Detected Emotion</h3>
                        <div className="text-5xl font-black text-white mb-4 tracking-tighter capitalize bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                            {result.predicted_emotion}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                    style={{ width: `${result.confidence * 100}%` }}
                                />
                            </div>
                            <span className="text-emerald-300 font-bold whitespace-nowrap">
                                {(result.confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-6 border-t border-white/10 pt-4">
                            Based on <strong>{selectedModelName}</strong> model
                        </p>
                    </div>

                    <div className="lg:col-span-2 bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl h-[320px] flex flex-col">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">Probability Distribution</h3>
                        <div className="flex-1 w-full -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={result.results} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <XAxis type="number" hide domain={[0, 1]} />
                                    <YAxis dataKey="emotion" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, 'Confidence']}
                                    />
                                    <Bar dataKey="probability" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                        {result.results.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} opacity={0.9} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
