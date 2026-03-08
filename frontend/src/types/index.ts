export interface ModelMetric {
    id: string;
    name: string;
    accuracy: number;
    f1_score: number;
    status: 'active' | 'training' | 'error';
}

export interface EmotionResult {
    emotion: string;
    probability: number;
}

export interface PredictionResponse {
    predicted_emotion: string;
    confidence: number;
    results: EmotionResult[];
    message: string;
}
