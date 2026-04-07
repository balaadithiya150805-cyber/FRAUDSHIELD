# 🛡️ ML Fraud Detection System

A production-ready machine learning pipeline for detecting fraudulent transactions. This project leverages an XGBoost classifier served via a FastAPI backend, cleanly integrated with an interactive Streamlit dashboard.

## 🌟 Features
- **Machine Learning Analysis:** Built with XGBoost and StandardScaler, incorporating cost-sensitive learning to handle data imbalances.
- **REST API Backend:** Container-ready FastAPI serving live inference endpoints with custom error handling and CORS support.
- **Interactive UI:** A Streamlit dashboard that dynamically evaluates and color-codes transactions based on defined risk probabilities (LOW, MEDIUM, HIGH).
- **Deployment Ready:** Fully configured to deploy seamlessly onto hosting environments like Render and Streamlit Cloud.

## 🚀 Setup Instructions

1. **Clone the Repository & Setup Environment**
   ```bash
   git clone <repository-url>
   cd fraudshield-ai
   python -m venv venv
   # On macOS/Linux: source venv/bin/activate
   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Train the Model Base**
   ```bash
   python model/train.py
   ```
   *(This generates the necessary `model.pkl` and `scaler.pkl` required for the API API.)*

3. **Run Locally**
   - **Backend (API):** `uvicorn backend.main:app --reload --port 8000`
   - **Frontend (UI):** Open a split terminal and run `streamlit run frontend/app.py`

## 🔌 API Reference

### `POST /predict`
Evaluates a transaction payload and returns a risk distribution metric.

**Request Payload:**
```json
{
  "amount": 120.50,
  "time": 14,
  "transaction_type": 2,
  "location": 15
}
```
**Response Output:**
```json
{
  "fraud": 0,
  "probability": 0.12,
  "risk_level": "LOW"
}
```
*(Interactive API documentation is securely hosted at `/docs` when the backend runs).*

## 🌍 Deployment

### 1. Deploying the Backend (Render)
- Deploy your repository as a new **Web Service**.
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- *Keep the generated `.onrender.com` URL handy.*

### 2. Deploying the Frontend (Streamlit Cloud)
- Go to Streamlit Community Cloud, host your project and target `frontend/app.py` as the Main File Path.
- Map the backend API securely by heading to **Advanced Settings -> Secrets** and defining your Render link:
  ```toml
  BACKEND_URL="https://your-backend-app-name.onrender.com"
  ```
