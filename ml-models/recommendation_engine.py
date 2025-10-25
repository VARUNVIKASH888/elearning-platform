"""
Simple Content-Based Recommendation Engine
No collaborative filtering - just category/difficulty matching
"""
import sys
import os

# Fix import path to find backend modules
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

from database import SessionLocal
from models import User, Course, UserProgress

class RecommendationEngine:
    """
    Basic content-based recommendations
    Recommends based on category and difficulty of last completed course
    """
    
    def __init__(self):
        self.courses = []
    
    def get_recommendations(self, user_id: str, top_n: int = 10):
        """Get simple recommendations based on user's last course"""
        db = SessionLocal()
        
        try:
            # Get user's enrolled courses
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == user_id
            ).all()
            
            if not progress:
                # New user - recommend beginner courses
                return self._get_beginner_courses(db, top_n)
            
            # Get last course user enrolled in
            course_ids = list(set(p.course_id for p in progress))
            last_course = db.query(Course).filter(
                Course.id == course_ids[-1]
            ).first()
            
            if not last_course:
                return self._get_beginner_courses(db, top_n)
            
            # Find courses in same category
            similar_courses = db.query(Course).filter(
                Course.category == last_course.category,
                Course.id.not_in(course_ids),
                Course.is_published == True
            ).limit(top_n).all()
            
            recommendations = []
            for course in similar_courses:
                recommendations.append({
                    'course_id': str(course.id),
                    'title': course.title,
                    'score': 0.8,
                    'reason': f"Similar to {last_course.title}"
                })
            
            # If not enough, add popular courses
            if len(recommendations) < top_n:
                popular = self._get_popular_courses(db, top_n - len(recommendations), course_ids)
                recommendations.extend(popular)
            
            return recommendations
            
        finally:
            db.close()
    
    def _get_beginner_courses(self, db, top_n):
        """Get beginner courses for new users"""
        courses = db.query(Course).filter(
            Course.difficulty_level == 'beginner',
            Course.is_published == True
        ).limit(top_n).all()
        
        return [
            {
                'course_id': str(c.id),
                'title': c.title,
                'score': 0.7,
                'reason': 'Great for beginners'
            }
            for c in courses
        ]
    
    def _get_popular_courses(self, db, top_n, exclude_ids):
        """Get most popular courses"""
        courses = db.query(Course).filter(
            Course.id.not_in(exclude_ids),
            Course.is_published == True
        ).limit(top_n).all()
        
        return [
            {
                'course_id': str(c.id),
                'title': c.title,
                'score': 0.6,
                'reason': 'Popular course'
            }
            for c in courses
        ]
    
    def load_model(self):
        """No model to load - using simple rules"""
        print("ℹ️  Using simple content-based recommendations")
        return True
    
    def save_model(self):
        """No model to save"""
        pass
