import os
import torch
import torch.nn as nn
import librosa
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import Wav2Vec2Model
import torch.nn.functional as F

NUM_CLASSES = 7
frozen = True

app = Flask(__name__)
CORS(app)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
EMOTIONS = ['Happy', 'Sad', 'Angry', 'Neutral', 'Surprise', 'Fear', 'Disgust']

# ==============================================================
# 1. DEFINE YOUR MODEL ARCHITECTURES
# ==============================================================

# Architecture 1: Wav2Vec2 + BiLSTM + Attention (Implementation depends on your specific code)
class Wav2Vec2_BiLSTM_Attention(nn.Module):
    def __init__(self):
        super().__init__()
        # Load pre-trained Wav2Vec2
        self.wav2vec2 = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")

        if frozen:
            for param in self.wav2vec2.parameters():
                param.requires_grad = False

        # BiLSTM xử lý sequence features từ Wav2Vec2 (hidden_size=768)
        self.lstm = nn.LSTM(
            input_size=768,
            hidden_size=256,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )

        # Attention Layer
        self.attention = nn.Sequential(
            nn.Linear(512, 128),
            nn.Tanh(),
            nn.Linear(128, 1)
        )

        # Classifier
        self.classifier = nn.Sequential(
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, NUM_CLASSES)
        )

    def forward(self, x):
        # x shape: (Batch, Audio_Length)
        with torch.no_grad(): # Nếu frozen=True
            features = self.wav2vec2(x).last_hidden_state # (B, T, 768)

        lstm_out, _ = self.lstm(features) # (B, T, 512)

        # Attention mechanism
        attn_weights = torch.softmax(self.attention(lstm_out), dim=1)
        context = torch.sum(attn_weights * lstm_out, dim=1) # (B, 512)

        logits = self.classifier(context)
        return logits


class TemporalAttention(nn.Module):
    def __init__(self, hidden_dim, dropout_rate=0.5):
        super().__init__()
        self.attn = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.Tanh(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_dim // 2, 1)
        )

    def forward(self, x):
        """
        x: (B, T, D)
        """
        scores = self.attn(x)        # (B, T, 1)
        weights = torch.softmax(scores, dim=1)
        context = torch.sum(weights * x, dim=1)
        return context, weights

# Architecture 2: 3DCNN + BiLSTM + Attention
class CNN3D_BiLSTM_Attention(nn.Module):
    def __init__(self, num_classes=7, dropout_rate=0.5):
        super().__init__()

        self.lstm_hidden = 192
        lstm_output_dim = self.lstm_hidden * 2

        # -------- Temporal CNN (Conv3D) --------
        self.cnn = nn.Sequential(
            nn.Conv3d(1, 32, kernel_size=(5, 3, 1), padding=(2, 1, 0)),
            nn.BatchNorm3d(32),
            nn.ReLU(),
            nn.MaxPool3d((2, 2, 1)),   # ↓T, ↓F

            nn.Conv3d(32, 64, kernel_size=(5, 3, 1), padding=(2, 1, 0)),
            nn.BatchNorm3d(64),
            nn.ReLU(),
            nn.MaxPool3d((2, 2, 1)),   # ↓T, ↓F

            nn.Conv3d(64, 128, kernel_size=(3, 3, 1), padding=(1, 1, 0)),
            nn.BatchNorm3d(128),
            nn.ReLU(),
            nn.MaxPool3d((1, 2, 1))    # chỉ ↓F
        )

        # Preserve T, collapse F and W
        self.pool = nn.AdaptiveAvgPool3d((None, 1, 1))

        # Project CNN channels → LSTM dim
        self.proj = nn.Linear(128, 256)

        # -------- BiLSTM --------
        self.lstm = nn.LSTM(
            input_size=256,
            hidden_size=self.lstm_hidden,
            num_layers=2,
            dropout=dropout_rate,
            bidirectional=True,
            batch_first=True
        )

        # -------- Temporal Attention --------
        self.attention = TemporalAttention(
            hidden_dim=lstm_output_dim,
            dropout_rate=dropout_rate
        )

        # -------- Classifier --------
        self.classifier = nn.Sequential(
            nn.Linear(lstm_output_dim, self.lstm_hidden),
            nn.BatchNorm1d(self.lstm_hidden),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(self.lstm_hidden, num_classes)
        )

    def forward(self, x):
        """
        x: (B, 1, T, 128, 1)
        """
        x = self.cnn(x)
        x = self.pool(x)  # (B, C, T, 1, 1)

        B, C, T, _, _ = x.shape
        x = x.permute(0, 2, 1, 3, 4).contiguous()
        x = x.view(B, T, C)           # (B, T, 128)

        x = self.proj(x)              # (B, T, 256)

        lstm_out, _ = self.lstm(x)    # (B, T, 384)

        context, attn_weights = self.attention(lstm_out)

        logits = self.classifier(context)
        return logits

# ==============================================================
# 2. LOAD MODELS INTO MEMORY
# ==============================================================

# We will store loaded models in a dictionary
loaded_models = {}

def load_all_models():
    """Load all models at startup to avoid delay during inference."""
    try:
        # Load Model 1
        model1 = Wav2Vec2_BiLSTM_Attention()
        model1_path = 'models/Wav2Vec2-BiLSTM-Attention.pt'
        if os.path.exists(model1_path):
            model1.load_state_dict(torch.load(model1_path, map_location=device))
            model1.to(device)
            model1.eval()
            # The key 'wav2vec2-bilstm' must match the 'id' in MOCK_MODELS in React frontend
            loaded_models['wav2vec2-bilstm'] = model1 
            print("Loaded Model 1: Wav2Vec2_BiLSTM_Attention")
            
        # Load Model 2
        model2 = CNN3D_BiLSTM_Attention()
        model2_path = 'models/3dcnn-BiLSTM-Attention.pt'
        if os.path.exists(model2_path):
            model2.load_state_dict(torch.load(model2_path, map_location=device))
            model2.to(device)
            model2.eval()
            # The key '3dcnn-bilstm' must match the 'id' in frontend
            loaded_models['3dcnn-bilstm'] = model2
            print("Loaded Model 2: 3DCNN_BiLSTM_Attention")
            
    except Exception as e:
        print(f"Error loading models: {e}")

# Call this immediately when server starts
load_all_models()

# ==============================================================
# 3. FEATURE EXTRACTION
# ==============================================================

# Initialize the Wav2Vec2Processor once
from transformers import Wav2Vec2Processor
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base")

import io
from pydub import AudioSegment

def convert_webm_to_wav(audio_file):
    # Read browser upload (WebM usually) into pydub and export to WAV bytes
    audio_file.seek(0)
    audio = AudioSegment.from_file(audio_file)
    wav_io = io.BytesIO()
    audio.export(wav_io, format="wav")
    wav_io.seek(0)
    return wav_io

def extract_features_for_wav2vec2(audio_file):
    wav_io = convert_webm_to_wav(audio_file)
    # Load audio using librosa and resample to 16000Hz (Wav2Vec2 requirement)
    waveform, sr = librosa.load(wav_io, sr=16000)
    
    # Process using huggingface's feature extractor
    input_values = processor(
        waveform, 
        sampling_rate=16000, 
        return_tensors="pt"
    ).input_values
    
    return input_values

def extract_features_for_3dcnn(audio_file):
    import torchaudio.transforms as transforms
    
    wav_io = convert_webm_to_wav(audio_file)
    # Load the audio using librosa
    waveform, sr = librosa.load(wav_io, sr=16000)
    
    # Convert waveform to tensor
    waveform = torch.tensor(waveform).unsqueeze(0) # (1, audio_length)
    
    # Feature extraction parameters (matching standard SER training scripts)
    n_mels = 128
    n_fft = 2048
    hop_length = 512
    
    # Extract Mel-spectrogram
    mel_transform = transforms.MelSpectrogram(
        sample_rate=16000,
        n_mels=n_mels,
        n_fft=n_fft,
        hop_length=hop_length
    )
    amplitude_to_db = transforms.AmplitudeToDB()
    
    melspec = mel_transform(waveform)
    melspec_db = amplitude_to_db(melspec) # Shape: (1, n_mels, time_frames)
    
    # Fix for 3DCNN input shape requirements.
    # The network has multiple 3D pooling layers that reduce the depth (D) dimension.
    # If D=1, pooling crashes with 'Output size is too small'.
    # We interpolate the time axis to exactly 128 frames, and sequence it as Depth=4, Width=32.
    melspec_db = melspec_db.unsqueeze(0) # (1, 1, 128, time_frames)
    
    import torch.nn.functional as F
    melspec_db = F.interpolate(melspec_db, size=(128, 128), mode='bilinear', align_corners=False) # (1, 1, 128, 128)
    
    # Reshape to (Batch=1, Channel=1, Depth=4, Height=128, Width=32)
    melspec_3d = melspec_db.view(1, 1, 128, 4, 32).transpose(2, 3) 
    
    return melspec_3d


# ==============================================================
# 4. API ENDPOINT
# ==============================================================

@app.route('/api/predict', methods=['POST'])
def predict_emotion():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    # 🌟 Get the model ID selected from the React Frontend Sidebar
    selected_model_id = request.form.get('modelName', 'wav2vec2-bilstm')
    
    # Check if we have this model loaded
    if selected_model_id not in loaded_models:
        return jsonify({'error': f'Model {selected_model_id} not loaded or invalid'}), 400
        
    model = loaded_models[selected_model_id]
    
    try:
        # 🌟 Extract features based on which model is selected
        if selected_model_id == 'wav2vec2-bilstm':
            features = extract_features_for_wav2vec2(audio_file)
        elif selected_model_id == '3dcnn-bilstm':
            features = extract_features_for_3dcnn(audio_file)
            
        features = features.to(device)
        
        # Run Inference
        with torch.no_grad():
            outputs = model(features)
            # Apply softmax to convert raw logits into probabilities (0-1)
            probs_tensor = F.softmax(outputs[0], dim=0)
            probs = probs_tensor.cpu().numpy().tolist()
        
        results = [{'emotion': e, 'probability': p} for e, p in zip(EMOTIONS, probs)]
        results.sort(key=lambda x: x['probability'], reverse=True)
        
        return jsonify({
            'predicted_emotion': results[0]['emotion'],
            'confidence': results[0]['probability'],
            'results': results,
            'message': 'Prediction successful'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
