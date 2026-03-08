from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
# Enable CORS for all routes (necessary for local development when frontend is on a different port)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict_emotion():
    # In a real SER application, we'd check for files using request.files
    # Example:
    # if 'audio' not in request.files:
    #     return jsonify({'error': 'No audio file provided'}), 400
    # audio_file = request.files['audio']
    # model_name = request.form.get('modelName', 'Default')
    # Use selected model to infer emotion...
    
    # Mocking the inference process for now
    emotions = ['Happy', 'Sad', 'Angry', 'Neutral', 'Surprise', 'Fear', 'Disgust']
    
    # Generate random probabilities
    probs = [random.random() for _ in range(len(emotions))]
    total = sum(probs)
    normalized_probs = [float(p)/total for p in probs]
    
    # Find the predicted emotion
    max_idx = normalized_probs.index(max(normalized_probs))
    predicted = emotions[max_idx]
    
    # Create the result dictionary matching what the frontend expects
    results = [{'emotion': e, 'probability': p} for e, p in zip(emotions, normalized_probs)]
    results.sort(key=lambda x: x['probability'], reverse=True)
    
    return jsonify({
        'predicted_emotion': predicted,
        'confidence': max(normalized_probs),
        'results': results,
        'message': 'Prediction successful (Mock)'
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # Instructions: Place .h5 or .pth files in '/models' folder in backend, and load them at app startup.
    app.run(host='0.0.0.0', port=5000, debug=True)
