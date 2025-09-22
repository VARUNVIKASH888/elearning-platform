"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# ============= Authentication Schemas =============

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    role: str = Field(default="student")
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['student', 'instructor', 'admin']:
            raise ValueError('Invalid role')
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============= Course Schemas =============

class CourseCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    difficulty_level: Optional[str] = "beginner"
    estimated_duration_hours: Optional[int] = None
    
    @validator('difficulty_level')
    def validate_difficulty(cls, v):
        if v and v not in ['beginner', 'intermediate', 'advanced']:
            raise ValueError('Invalid difficulty level')
        return v


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    difficulty_level: Optional[str] = None
    estimated_duration_hours: Optional[int] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    category: Optional[str]
    instructor_id: Optional[UUID]
    difficulty_level: Optional[str]
    estimated_duration_hours: Optional[int]
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============= Module Schemas =============

class ModuleCreate(BaseModel):
    course_id: UUID
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    content_type: Optional[str] = "mixed"
    order_index: int
    
    @validator('content_type')
    def validate_content_type(cls, v):
        if v and v not in ['video', 'text', 'interactive', 'mixed']:
            raise ValueError('Invalid content type')
        return v


class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    content_type: Optional[str] = None
    order_index: Optional[int] = None


class ModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    description: Optional[str]
    content_type: Optional[str]
    order_index: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Lesson Schemas =============

class LessonCreate(BaseModel):
    module_id: UUID
    title: str = Field(..., max_length=500)
    content: Optional[str] = None
    media_url: Optional[str] = Field(None, max_length=1000)
    media_type: Optional[str] = Field(None, max_length=50)
    duration_minutes: Optional[int] = None
    order_index: int


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    media_url: Optional[str] = Field(None, max_length=1000)
    media_type: Optional[str] = Field(None, max_length=50)
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None


class LessonResponse(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    content: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    duration_minutes: Optional[int]
    order_index: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Quiz Schemas =============

class AnswerOptionCreate(BaseModel):
    option_text: str
    is_correct: bool
    order_index: int


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    difficulty_level: str = "medium"
    points: int = 1
    order_index: int
    answer_options: List[AnswerOptionCreate]
    
    @validator('question_type')
    def validate_question_type(cls, v):
        if v not in ['multiple_choice', 'true_false', 'short_answer']:
            raise ValueError('Invalid question type')
        return v
    
    @validator('difficulty_level')
    def validate_difficulty(cls, v):
        if v not in ['easy', 'medium', 'hard']:
            raise ValueError('Invalid difficulty level')
        return v


class QuizCreate(BaseModel):
    module_id: UUID
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    passing_score: int = 70
    time_limit_minutes: Optional[int] = None
    questions: List[QuestionCreate]


class QuizResponse(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    description: Optional[str]
    passing_score: int
    time_limit_minutes: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnswerSubmission(BaseModel):
    question_id: UUID
    answer_option_id: Optional[UUID] = None
    answer_text: Optional[str] = None


class QuizSubmission(BaseModel):
    quiz_id: UUID
    answers: List[AnswerSubmission]


class QuizResultResponse(BaseModel):
    attempt_id: UUID
    quiz_id: UUID
    score: Decimal
    total_points: int
    passed: bool
    time_taken_minutes: Optional[int]
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ============= Progress Schemas =============

class ProgressUpdate(BaseModel):
    lesson_id: UUID
    completion_status: str = "in_progress"
    time_spent_minutes: int = 0
    
    @validator('completion_status')
    def validate_status(cls, v):
        if v not in ['not_started', 'in_progress', 'completed']:
            raise ValueError('Invalid completion status')
        return v


class ProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    module_id: UUID
    lesson_id: UUID
    completion_status: str
    score: Optional[Decimal]
    time_spent_minutes: int
    last_accessed: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============= Recommendation Schemas =============

class RecommendationResponse(BaseModel):
    id: UUID
    course_id: UUID
    module_id: Optional[UUID]
    recommendation_score: Decimal
    recommendation_reason: Optional[str]
    course_title: Optional[str] = None
    module_title: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============= Analytics Schemas =============

class AnalyticsResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    module_id: Optional[UUID]
    engagement_time_minutes: int
    completion_rate: Optional[Decimal]
    average_score: Optional[Decimal]
    last_accessed: Optional[datetime]
    session_count: int
    
    class Config:
        from_attributes = True


class UserEngagementResponse(BaseModel):
    user_id: UUID
    login_count: int
    total_time_spent_minutes: int
    courses_enrolled: int
    courses_completed: int
    average_quiz_score: Optional[Decimal]
    engagement_score: Optional[Decimal]
    dropout_risk_score: Optional[Decimal]
    last_activity: Optional[datetime]
    
    class Config:
        from_attributes = True


class DashboardAnalytics(BaseModel):
    total_users: int
    active_users_today: int
    total_courses: int
    total_enrollments: int
    average_completion_rate: float
    total_quiz_attempts: int
    average_quiz_score: float


class InstructorAnalytics(BaseModel):
    course_id: UUID
    course_title: str
    total_enrollments: int
    active_learners: int
    completion_rate: float
    average_score: float
    total_time_spent_hours: float


# ============= ML Model Schemas =============

class PredictionRequest(BaseModel):
    user_id: UUID
    features: dict


class RecommendationRequest(BaseModel):
    user_id: UUID
    top_n: int = 5


class AdaptiveQuestionRequest(BaseModel):
    user_id: UUID
    quiz_id: UUID
    previous_answers: List[dict]