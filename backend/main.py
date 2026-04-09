import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fraud Detection API")

# Add CORS Middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Robust absolute paths to ensure the model loads correctly in any environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'model', 'scaler.pkl')

model = None
scaler = None

@app.on_event("startup")
def load_model():
    global model, scaler
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        logger.info(f"Successfully loaded models from {BASE_DIR}/model")
    except Exception as e:
        logger.error(f"Error loading models: {e}. API will start but predictions will fail.")

class Transaction(BaseModel):
    amount: float
    time: int
    transaction_type: int
    location: int

@app.post("/predict")
def predict(tx: Transaction):
    if model is None or scaler is None:
        logger.error("Prediction attempted, but models are not loaded.")
        return {"error": "Models not loaded correctly. Ensure model.pkl and scaler.pkl exist."}
        
    try:
        features = np.array([[tx.amount, tx.time, tx.transaction_type, tx.location]])
        features_scaled = scaler.transform(features)
        
        probability = float(model.predict_proba(features_scaled)[0][1])
        is_fraud = int(probability > 0.5)
        
        if probability < 0.3:
            risk_level = "LOW"
        elif probability <= 0.7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
            
        logger.info(f"Prediction made: Risk={risk_level}, Probability={probability:.2f}")
        return {
            "fraud": is_fraud,
            "probability": probability,
            "risk_level": risk_level
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {"error": f"Internal server error: {e}"}

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Fraud Detection API running."}
