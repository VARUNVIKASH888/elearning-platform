"""
Simple ML API - Basic recommendations and risk prediction
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

from recommendation_engine import RecommendationEngine
from predictive_analytics import PredictiveAnalyticsEngine

app = FastAPI(title="E-Learning ML API - Basic", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
recommender = RecommendationEngine()
predictive_engine = PredictiveAnalyticsEngine()

recommender.load_model()
predictive_engine.load_model()

# Request/Response Models
class RecommendationRequest(BaseModel):
    user_id: str
    top_n: int = 10

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict]

class DropoutPredictionRequest(BaseModel):
    user_data: Dict

# Endpoints
@app.post("/api/ml/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Simple content-based recommendations"""
    try:
        recommendations = recommender.get_recommendations(
            request.user_id,
            top_n=request.top_n
        )
        
        return {
            "user_id": request.user_id,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/predict-dropout")
async def predict_dropout(request: DropoutPredictionRequest):
    """Simple 3-feature dropout prediction"""
    try:
        prediction = predictive_engine.predict_dropout_risk(request.user_data)
        return prediction
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/engagement-score")
async def calculate_engagement(user_data: Dict):
    """Simple engagement calculation"""
    try:
        score = predictive_engine.calculate_engagement_score(user_data)
        return {
            "engagement_score": score,
            "level": "high" if score > 70 else "medium" if score > 40 else "low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "model_type": "rule-based",
        "features": "basic"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
