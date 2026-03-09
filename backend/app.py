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


# -------------------- Building blocks --------------------
class Conv3DBlock(nn.Module):
    def __init__(self, in_c, out_c, kernel_size=3, stride=1,
                 padding=1, pool_size=(1, 2, 2), dropout=0.2):
        super().__init__()
        self.conv1 = nn.Conv3d(in_c, out_c, kernel_size, stride, padding)
        self.bn1   = nn.BatchNorm3d(out_c)
        self.conv2 = nn.Conv3d(out_c, out_c, kernel_size, stride, padding)
        self.bn2   = nn.BatchNorm3d(out_c)
        self.pool  = nn.MaxPool3d(pool_size)
        self.drop  = nn.Dropout3d(dropout)
        self.residual = (nn.Sequential(nn.Conv3d(in_c, out_c, 1),
                                       nn.BatchNorm3d(out_c))
                         if in_c != out_c else nn.Identity())

    def forward(self, x):
        res = self.residual(x)
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        if res.shape != x.shape:
            res = F.adaptive_avg_pool3d(res, x.shape[2:])
        x = x + res
        x = self.pool(x)
        x = self.drop(x)
        return x


class SE3D(nn.Module):
    """Squeeze-and-Excitation (channel attention) for 3-D feature maps."""
    def __init__(self, channels, reduction=8):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction),
            nn.ReLU(),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c = x.shape[:2]
        w = x.view(b, c, -1).mean(dim=2)
        w = self.fc(w).view(b, c, 1, 1, 1)
        return x * w

# Architecture 2: 3DCNN + BiLSTM + Attention
class CNN3D_BiLSTM_Attention(nn.Module):
    def __init__(self, num_classes=NUM_CLASSES):
        super().__init__()
        # Block 1  (B,1,D,128,W) → pool(1,2,2) → (B,32,D,64,W/2)
        self.block1 = Conv3DBlock(1,  32,  pool_size=(1, 2, 2), dropout=0.15)
        self.se1    = SE3D(32)
        # Block 2  → (B,64,D,32,W/4)
        self.block2 = Conv3DBlock(32, 64,  pool_size=(1, 2, 2), dropout=0.2)
        self.se2    = SE3D(64)
        # Block 3  → (B,128,D/2,16,W/8)
        self.block3 = Conv3DBlock(64, 128, pool_size=(2, 2, 2), dropout=0.25)
        self.se3    = SE3D(128)
        # Block 4  → (B,256,D/4,8,W/16)
        self.block4 = Conv3DBlock(128, 256, pool_size=(2, 2, 2), dropout=0.3)
        self.se4    = SE3D(256)

        # Multi-scale parallel convolutions
        self.ms_small  = nn.Sequential(
            nn.Conv3d(256, 128, kernel_size=1),
            nn.BatchNorm3d(128), nn.ReLU())
        self.ms_medium = nn.Sequential(
            nn.Conv3d(256, 128, kernel_size=(3, 1, 3), padding=(1, 0, 1)),
            nn.BatchNorm3d(128), nn.ReLU())
        self.ms_large  = nn.Sequential(
            nn.Conv3d(256, 128, kernel_size=3, padding=1),
            nn.BatchNorm3d(128), nn.ReLU())

        # Pooling + classifier
        self.gap = nn.AdaptiveAvgPool3d(1)
        self.gmp = nn.AdaptiveMaxPool3d(1)
        # 128*3 * 2 = 768
        self.classifier = nn.Sequential(
            nn.Linear(768, 512),
            nn.BatchNorm1d(512), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv3d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out',
                                        nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm3d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_normal_(m.weight)

    def forward(self, x):
        x = self.se1(self.block1(x))
        x = self.se2(self.block2(x))
        x = self.se3(self.block3(x))
        x = self.se4(self.block4(x))

        ms1 = self.ms_small(x)
        ms2 = self.ms_medium(x)
        ms3 = self.ms_large(x)
        ms  = torch.cat([ms1, ms2, ms3], dim=1)        # (B, 384, ...)

        avg_p = self.gap(ms).flatten(1)                 # (B, 384)
        max_p = self.gmp(ms).flatten(1)                 # (B, 384)
        feat  = torch.cat([avg_p, max_p], dim=1)        # (B, 768)
        return self.classifier(feat)

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
