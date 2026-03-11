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

loaded_models = {}
load_errors = []

def load_all_models():
    """Load all models at startup to avoid delay during inference."""
    global load_errors
    load_errors = []
    model_dir = os.environ.get('MODEL_DIR', 'models')
    print(f"[MODEL LOADER] Looking for models in: {model_dir}")
    print(f"[MODEL LOADER] Directory exists: {os.path.exists(model_dir)}")
    if os.path.exists(model_dir):
        print(f"[MODEL LOADER] Files in model_dir: {os.listdir(model_dir)}")
    
    # Load Model 1 — Wav2Vec2 BiLSTM Attention
    try:
        model1_path = os.path.join(model_dir, 'Wav2Vec2-BiLSTM-Attention.pt')
        print(f"[MODEL LOADER] Model1 path exists: {os.path.exists(model1_path)}")
        if os.path.exists(model1_path):
            model1 = Wav2Vec2_BiLSTM_Attention()
            model1.load_state_dict(torch.load(model1_path, map_location=device, weights_only=False))
            model1.to(device)
            model1.eval()
            loaded_models['wav2vec2-bilstm'] = model1 
            print("[MODEL LOADER] ✅ Loaded Model 1: Wav2Vec2_BiLSTM_Attention")
        else:
            msg = f"Model1 NOT FOUND at {model1_path}"
            print(f"[MODEL LOADER] ❌ {msg}")
            load_errors.append(msg)
    except Exception as e:
        import traceback
        msg = f"Model1 load error: {str(e)}"
        print(f"[MODEL LOADER] ❌ {msg}")
        traceback.print_exc()
        load_errors.append(msg)
        
    # Load Model 2 — 3DCNN BiLSTM Attention
    try:
        model2_path = os.path.join(model_dir, '3dcnn-BiLSTM-Attention.pt')
        print(f"[MODEL LOADER] Model2 path exists: {os.path.exists(model2_path)}")
        if os.path.exists(model2_path):
            model2 = CNN3D_BiLSTM_Attention()
            model2.load_state_dict(torch.load(model2_path, map_location=device, weights_only=False))
            model2.to(device)
            model2.eval()
            loaded_models['3dcnn-bilstm'] = model2
            print("[MODEL LOADER] ✅ Loaded Model 2: 3DCNN_BiLSTM_Attention")
        else:
            msg = f"Model2 NOT FOUND at {model2_path}"
            print(f"[MODEL LOADER] ❌ {msg}")
            load_errors.append(msg)
    except Exception as e:
        import traceback
        msg = f"Model2 load error: {str(e)}"
        print(f"[MODEL LOADER] ❌ {msg}")
        traceback.print_exc()
        load_errors.append(msg)

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
    wav_io = convert_webm_to_wav(audio_file)
    
    try:
        y, sr = librosa.load(wav_io, sr=16000)
        # Pad very short audio
        min_len = int(0.5 * 16000)
        if len(y) < min_len:
            y = np.pad(y, (0, min_len - len(y)))
    except Exception as e:
        raise ValueError(f"Error loading {wav_io}: {e}")

    mel = librosa.feature.melspectrogram(
        y=y, sr=16000, n_fft=1024, hop_length=256,
        n_mels=128, power=2.0
    )
    log_mel = librosa.power_to_db(mel, ref=1.0)
    
    # Expected tensor shape for CNN3D_BiLSTM_Attention: (B, 1, T, 128, 1)
    features = torch.tensor(log_mel, dtype=torch.float32)  # (128, T)
    features = features.transpose(0, 1)  # (T, 128)
    features = features.unsqueeze(0).unsqueeze(1).unsqueeze(-1)  # (1, 1, T, 128, 1)
    
    return features


# ==============================================================
# 4. API ENDPOINT
# ==============================================================

@app.route('/api/health', methods=['GET'])
def health():
    model_dir = os.environ.get('MODEL_DIR', 'models')
    dir_exists = os.path.exists(model_dir)
    files = os.listdir(model_dir) if dir_exists else []
    return jsonify({
        'status': 'ok',
        'model_dir': model_dir,
        'dir_exists': dir_exists,
        'files_in_dir': files,
        'loaded_models': list(loaded_models.keys()),
        'load_errors': load_errors,
    })

@app.route('/api/reload', methods=['GET'])
def reload_models():
    loaded_models.clear()
    load_all_models()
    model_dir = os.environ.get('MODEL_DIR', 'models')
    dir_exists = os.path.exists(model_dir)
    files = os.listdir(model_dir) if dir_exists else []
    return jsonify({
        'status': 'reload_complete',
        'model_dir': model_dir,
        'dir_exists': dir_exists,
        'files_in_dir': files,
        'loaded_models': list(loaded_models.keys()),
        'load_errors': load_errors,
    })

@app.route('/api/predict', methods=['POST'])
def predict_emotion():
    # Lazy-load models if they weren't loaded at startup (GCS FUSE may not be ready immediately)
    if len(loaded_models) == 0:
        print("[PREDICT] No models loaded yet, attempting lazy load...")
        load_all_models()

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    # 🌟 Get the model ID selected from the React Frontend Sidebar
    selected_model_id = request.form.get('modelName', 'wav2vec2-bilstm')
    
    # Check if we have this model loaded
    if selected_model_id not in loaded_models:
        model_dir = os.environ.get('MODEL_DIR', 'models')
        available = list(loaded_models.keys())
        dir_files = os.listdir(model_dir) if os.path.exists(model_dir) else []
        return jsonify({
            'error': f'Model {selected_model_id} not loaded or invalid',
            'loaded_models': available,
            'model_dir': model_dir,
            'files_in_dir': dir_files
        }), 400
        
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
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
