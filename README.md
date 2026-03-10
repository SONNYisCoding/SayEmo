<p align="center">
  <img src="frontend/public/logo.png" alt="SayEmo Logo" width="120" />
</p>

<h1 align="center">SayEmo - Speech Emotion Recognition</h1>

<p align="center">
  <a href="https://sayemo.web.app">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-sayemo.web.app-6366f1?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

<p align="center">
  A modern web application for Speech Emotion Recognition (SER).<br/>
  Upload an audio file or record your voice to detect emotions using deep learning models.
</p>

---

## ✨ Features

- **Model Selection:** Choose between multiple SER models — Wav2Vec2 BiLSTM Attention & 3DCNN BiLSTM Attention.
- **Audio Upload:** Drag & drop or browse to upload `.wav`, `.mp3`, or `.ogg` audio files.
- **Live Recording:** Record your voice directly from the browser using the Web MediaRecorder API.
- **Real-time Inference:** Connects to a Flask backend to process audio and predict emotions.
- **Visualization:** Interactive bar charts displaying emotion probability distributions (Recharts).
- **Modern UI:** React + Tailwind CSS with a responsive, dark-mode glassmorphism design and mobile support.

## 🚀 Live Demo

👉 **Try it now:** [https://sayemo.web.app](https://sayemo.web.app)

> Upload a voice recording or use your microphone to analyze emotions in real-time!

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19+ (Vite)
- **Language:** TypeScript (TSX)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Hosting:** Firebase Hosting

### Backend
- **Framework:** Python Flask
- **Deep Learning:** PyTorch (CPU), Wav2Vec2, 3DCNN
- **Audio Processing:** Librosa, Pydub, FFmpeg
- **CORS:** Flask-CORS
- **Hosting:** Google Cloud Run
- **Model Storage:** Google Cloud Storage

## 📦 Getting Started (Local Development)

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- FFmpeg (Install via Chocolatey: `choco install ffmpeg`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SONNYisCoding/SayEmo.git
   cd SayEmo
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv

   # Windows:
   .\venv\Scripts\Activate.ps1
   # macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   python app.py
   ```
   The backend will run on `http://localhost:5000`.

## 🧠 AI Models

The backend uses two deep learning architectures for emotion recognition:

| Model | Architecture | Accuracy | F1-Score |
|-------|-------------|----------|----------|
| Wav2Vec2 BiLSTM Attention | Wav2Vec2 → BiLSTM → Attention → Classifier | 89.0% | 88.0% |
| 3DCNN BiLSTM Attention | 3D CNN → BiLSTM → Temporal Attention → Classifier | 92.0% | 91.0% |

Model weights (`.pt` files) are stored in Google Cloud Storage and mounted at runtime via Cloud Storage FUSE.

## ☁️ Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Firebase Hosting | [sayemo.web.app](https://sayemo.web.app) |
| Backend | Google Cloud Run | `asia-southeast1` region |
| Models | Google Cloud Storage | `dbm-dat-dataset` bucket |

### Deploy Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Deploy Backend
```bash
cd backend
gcloud run deploy sayemo-backend --source . --region asia-southeast1
```
