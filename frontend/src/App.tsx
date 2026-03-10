import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Abstract } from './pages/Abstract';
import { Timeline } from './pages/Timeline';
import type { ModelMetric } from './types';

const MOCK_MODELS: ModelMetric[] = [
  { id: 'wav2vec2-bilstm', name: 'Wav2Vec2 BiLSTM Attention', accuracy: 0.89, f1_score: 0.88, status: 'active' },
  { id: '3dcnn-bilstm', name: '3DCNN BiLSTM Attention', accuracy: 0.92, f1_score: 0.91, status: 'active' },
];

function Layout() {
  const [selectedModel, setSelectedModel] = useState<string>(MOCK_MODELS[0].id);
  const selectedModelName = MOCK_MODELS.find(m => m.id === selectedModel)?.name || 'Unknown Model';

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans selection:bg-primary-500/30">
      {/* Decorative background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex w-full">
        <Sidebar
          models={MOCK_MODELS}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        <main className="flex-1 overflow-y-auto p-12 relative">
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
