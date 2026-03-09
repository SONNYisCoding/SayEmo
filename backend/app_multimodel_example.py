import os
import torch
import torch.nn as nn
import librosa
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

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
        # TODO: Paste your exact Wav2Vec2 architecture here
        # Example structure
        # self.wav2vec2 = Wav2Vec2Model.from_pretrained(...)
        # self.bilstm = nn.LSTM(...)
        # self.attention = ...
        # self.fc = nn.Linear(..., 7)
        pass

    def forward(self, x):
        # TODO: Implement forward pass
        # return torch.softmax(x, dim=1)
        pass

# Architecture 2: 3DCNN + BiLSTM + Attention
class CNN3D_BiLSTM_Attention(nn.Module):
    def __init__(self):
        super().__init__()
        # TODO: Paste your exact 3DCNN architecture here
        pass

    def forward(self, x):
        # return torch.softmax(x, dim=1)
        pass

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

def extract_features_for_wav2vec2(audio_bytes):
    # TODO: Implement how you preprocessed audio for Wav2Vec2
    pass

def extract_features_for_3dcnn(audio_bytes):
    # TODO: Implement how you extracted features for 3DCNN (e.g., Log-Mel Spectrograms reshaped to 3D)
    pass


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
            probs = outputs[0].cpu().numpy().tolist()
        
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
