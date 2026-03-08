# SayEmo - Speech Emotion Recognition Dashboard

SayEmo is a modern web application designed for Speech Emotion Recognition (SER). It provides an intuitive interface to analyze emotions from voice recordings using various AI models.

## Features

- **Model Selection:** Choose from multiple available SER models (e.g., Wav2Vec2.0, HuBERT).
- **Audio Upload:** Drag and drop or browse to upload `.wav`, `.mp3`, or `.ogg` audio files.
- **Live Recording:** Record your voice directly from the browser using the Web MediaRecorder API.
- **Real-time Inference:** Connects to a Flask backend to process audio and predict emotions.
- **Visualization:** Beautiful and interactive bar charts to display emotion probability distributions using Recharts.
- **Modern UI:** Built with React, Tailwind CSS, Lucide Icons, featuring a responsive, dark-mode glassmorphism design.

## Tech Stack

### Frontend
- **Framework:** React 19+ (Vite)
- **Language:** TypeScript (`TSX`)
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Framework:** Python Flask
- **CORS:** Flask-CORS
- **Server:** Werkzeug
- **AI Integration Placeholder:** Ready to integrate Librosa, PyTorch, or TensorFlow models.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Python (3.9 or higher recommended)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SONNYisCoding/SayEmo.git
   cd SayEmo
   ```

2. **Frontend Setup:**
   Navigate to the `frontend` directory, install dependencies, and start the development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

3. **Backend Setup:**
   Navigate to the `backend` directory, create a virtual environment, install requirements, and start the Flask API:
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
   The backend will run on `http://localhost:5000` or `http://127.0.0.1:5000`.

## Integrating AI Models

By default, the backend runs a **Mock API** that returns random probability distributions for demonstration purposes.

To integrate real models:
1. Place your compiled model files (e.g., `.h5`, `.pth`) in a `backend/models` directory (you may need to create this directory).
2. Modify `backend/app.py` to:
   - Load the AI libraries (TensorFlow/PyTorch, Librosa).
   - Load the model files at application startup.
   - Process the incoming audio file from `request.files['audio']`.
   - Run inference and return the actual emotion probabilities matching the expected JSON structure.

## Deployment Strategy (Google Cloud & Firebase)

As recommended for a scalable architecture:
- **Backend:** Package the Flask app via Docker and deploy it to **Google Cloud Run** to handle heavy ML inference workloads (ensure at least 2GB of RAM).
- **Frontend:** Build the Vite app and deploy it to **Firebase Hosting** for fast global content delivery.
- **Database:** Use **Firestore** to store model metrics (accuracy, F1-score) and dynamically fetch them in the frontend for the model selection sidebar.
