import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Abstract } from './pages/Abstract';
import { Timeline } from './pages/Timeline';
import { Menu, X } from 'lucide-react';
import type { ModelMetric } from './types';

const MOCK_MODELS: ModelMetric[] = [
  { id: 'wav2vec2-bilstm', name: 'Wav2Vec2 BiLSTM Attention', accuracy: 0.80, f1_score: 0.82, status: 'active' },
  { id: '3dcnn-bilstm', name: '3DCNN BiLSTM Attention', accuracy: 0.89, f1_score: 0.89, status: 'active' },
  { id: 'wav2vec2-transformer', name: 'Wav2Vec2 Transformer', accuracy: 0.86, f1_score: 0.86, status: 'active' },
];

function Layout() {
  const [selectedModel, setSelectedModel] = useState<string>(MOCK_MODELS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const selectedModelName = MOCK_MODELS.find(m => m.id === selectedModel)?.name || 'Unknown Model';

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans selection:bg-primary-500/30">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex w-full">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4">
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-300">
            SayEmo AI
          </span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 rounded-lg border border-white/10 text-white">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <Sidebar
          models={MOCK_MODELS}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-12 relative w-full overflow-x-hidden">
          <Outlet context={{ selectedModel, selectedModelName }} />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="abstract" element={<Abstract />} />
          <Route path="timeline" element={<Timeline />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
