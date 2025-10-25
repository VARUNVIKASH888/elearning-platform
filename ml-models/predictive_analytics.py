"""
Simple Dropout Prediction
Uses only 3 basic features
"""
import sys
import os
from datetime import datetime

# Fix import path to find backend modules
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

from database import SessionLocal
from models import User, UserProgress

class PredictiveAnalyticsEngine:
    """
    Basic dropout prediction with 3 features
    """
    
    def __init__(self):
        self.feature_names = [
            'days_since_last_login',
            'login_frequency',
            'completion_rate'
        ]
    
    def predict_dropout_risk(self, user_data):
        """Simple 3-feature dropout prediction"""
        
        if isinstance(user_data, dict) and 'user_id' in user_data:
            features = self.extract_features(user_data['user_id'])
        else:
            features = user_data
        
        if not features:
            return {
                'dropout_risk': 0.5,
                'risk_level': 'unknown',
                'contributing_factors': ['Insufficient data'],
                'recommendations': ['Encourage platform engagement']
            }
        
        risk_score = 0.0
        factors = []
        
        # Feature 1: Days since last login (40% weight)
        if features['days_since_last_login'] > 14:
            risk_score += 0.4
            factors.append('Inactive for 2+ weeks')
        elif features['days_since_last_login'] > 7:
            risk_score += 0.2
            factors.append('Not logged in recently')
        
        # Feature 2: Login frequency (30% weight)
        if features['login_frequency'] < 0.2:
            risk_score += 0.3
            factors.append('Low login frequency')
        
        # Feature 3: Completion rate (30% weight)
        if features['completion_rate'] < 0.3:
            risk_score += 0.3
            factors.append('Low completion rate')
        
        # Determine risk level
        if risk_score < 0.4:
            risk_level = 'low'
        elif risk_score < 0.7:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'dropout_risk': round(risk_score, 3),
            'risk_level': risk_level,
            'contributing_factors': factors if factors else ['Student is engaged'],
            'recommendations': self._simple_recommendations(risk_level),
            'features': features
        }
    
    def extract_features(self, user_id):
        """Extract only 3 basic features"""
        db = SessionLocal()
        
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == user_id
            ).all()
            
            # Feature 1: Days since last login
            if user.last_login:
                days_since = (datetime.now() - user.last_login).days
            else:
                days_since = 999
            
            # Feature 2: Login frequency (simplified)
            if progress:
                unique_days = len(set(p.created_at.date() for p in progress))
                total_days = max(1, (datetime.now() - min(p.created_at for p in progress)).days)
                login_frequency = unique_days / total_days
            else:
                login_frequency = 0
            
            # Feature 3: Completion rate
            if progress:
                completed = sum(1 for p in progress if p.completion_status == 'completed')
                completion_rate = completed / len(progress)
            else:
                completion_rate = 0
            
            return {
                'days_since_last_login': days_since,
                'login_frequency': login_frequency,
                'completion_rate': completion_rate
            }
            
        finally:
            db.close()
    
    def _simple_recommendations(self, risk_level):
        """Basic recommendations"""
        if risk_level == 'high':
            return ['Contact student', 'Send reminder email']
        elif risk_level == 'medium':
            return ['Monitor progress', 'Send encouragement']
        else:
            return ['Student is doing well']
    
    def calculate_engagement_score(self, user_data):
        """Simplified engagement (0-100)"""
        if isinstance(user_data, dict) and 'user_id' in user_data:
            features = self.extract_features(user_data['user_id'])
        else:
            features = user_data
        
        if not features:
            return 50.0
        
        score = 0.0
        
        # Login recency (40 points)
        if features['days_since_last_login'] == 0:
            score += 40
        elif features['days_since_last_login'] <= 7:
            score += 20
        
        # Login frequency (30 points)
        score += min(features['login_frequency'] * 100, 30)
        
        # Completion rate (30 points)
        score += features['completion_rate'] * 30
        
        return round(min(score, 100), 1)
    
    def load_model(self):
        """No model to load"""
        print("ℹ️  Using simple rule-based dropout prediction")
        return True
    
    def save_model(self):
        """No model to save"""
        pass
    
    # Placeholder methods for compatibility
    def predict_success_probability(self, user_data, course_difficulty):
        return 0.5
    
    def recommend_learning_path(self, user_data, available_courses, num_recommendations=5):
        return []
    
    def generate_performance_insights(self, user_data):
        return {'insights': 'Basic analysis'}
