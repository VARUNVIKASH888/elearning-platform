"""
SQLAlchemy ORM Models for E-Learning Platform
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, 
    ForeignKey, Numeric, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    courses_taught = relationship("Course", back_populates="instructor")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("MLRecommendation", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete-orphan")
    engagement = relationship("UserEngagement", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(role.in_(['student', 'instructor', 'admin']), name='check_user_role'),
    )


class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), index=True)
    difficulty_level = Column(String(20))
    estimated_duration_hours = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_published = Column(Boolean, default=False)
    
    # Relationships
    instructor = relationship("User", back_populates="courses_taught")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="course", cascade="all, delete-orphan")
    recommendations = relationship("MLRecommendation", back_populates="course", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="course", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            difficulty_level.in_(['beginner', 'intermediate', 'advanced']), 
            name='check_difficulty_level'
        ),
    )


class Module(Base):
    __tablename__ = 'modules'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    content_type = Column(String(50))
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="module", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="module", cascade="all, delete-orphan")
    recommendations = relationship("MLRecommendation", back_populates="module", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="module", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            content_type.in_(['video', 'text', 'interactive', 'mixed']), 
            name='check_content_type'
        ),
    )


class Lesson(Base):
    __tablename__ = 'lessons'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text)
    media_url = Column(String(1000))
    media_type = Column(String(50))
    duration_minutes = Column(Integer)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("Module", back_populates="lessons")
    progress = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = 'quizzes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    passing_score = Column(Integer, default=70)
    time_limit_minutes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("Module", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50))
    difficulty_level = Column(String(20))
    points = Column(Integer, default=1)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    answer_options = relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan")
    user_answers = relationship("UserAnswer", back_populates="question", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            question_type.in_(['multiple_choice', 'true_false', 'short_answer']), 
            name='check_question_type'
        ),
        CheckConstraint(
            difficulty_level.in_(['easy', 'medium', 'hard']), 
            name='check_question_difficulty'
        ),
    )


class AnswerOption(Base):
    __tablename__ = 'answer_options'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey('questions.id', ondelete='CASCADE'), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False)
    
    # Relationships
    question = relationship("Question", back_populates="answer_options")
    user_answers = relationship("UserAnswer", back_populates="answer_option")


class UserProgress(Base):
    __tablename__ = 'user_progress'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False, index=True)
    completion_status = Column(String(20), index=True)
    score = Column(Numeric(5, 2))
    time_spent_minutes = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="progress")
    course = relationship("Course", back_populates="progress")
    module = relationship("Module", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'lesson_id', name='unique_user_lesson'),
        CheckConstraint(
            completion_status.in_(['not_started', 'in_progress', 'completed']), 
            name='check_completion_status'
        ),
    )


class QuizAttempt(Base):
    __tablename__ = 'quiz_attempts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False, index=True)
    score = Column(Numeric(5, 2))
    total_points = Column(Integer)
    passed = Column(Boolean)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True))
    time_taken_minutes = Column(Integer)
    
    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    user_answers = relationship("UserAnswer", back_populates="attempt", cascade="all, delete-orphan")


class UserAnswer(Base):
    __tablename__ = 'user_answers'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey('quiz_attempts.id', ondelete='CASCADE'), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    answer_option_id = Column(UUID(as_uuid=True), ForeignKey('answer_options.id', ondelete='SET NULL'))
    answer_text = Column(Text)
    is_correct = Column(Boolean)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    attempt = relationship("QuizAttempt", back_populates="user_answers")
    question = relationship("Question", back_populates="user_answers")
    answer_option = relationship("AnswerOption", back_populates="user_answers")


class MLRecommendation(Base):
    __tablename__ = 'ml_recommendations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='SET NULL'))
    recommendation_score = Column(Numeric(5, 4), index=True)
    recommendation_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="recommendations")
    course = relationship("Course", back_populates="recommendations")
    module = relationship("Module", back_populates="recommendations")


class Analytics(Base):
    __tablename__ = 'analytics'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='SET NULL'))
    engagement_time_minutes = Column(Integer, default=0)
    completion_rate = Column(Numeric(5, 2))
    average_score = Column(Numeric(5, 2))
    last_accessed = Column(DateTime(timezone=True))
    session_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="analytics")
    course = relationship("Course", back_populates="analytics")
    module = relationship("Module", back_populates="analytics")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', 'module_id', name='unique_user_course_module_analytics'),
    )


class UserEngagement(Base):
    __tablename__ = 'user_engagement'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    login_count = Column(Integer, default=0)
    total_time_spent_minutes = Column(Integer, default=0)
    courses_enrolled = Column(Integer, default=0)
    courses_completed = Column(Integer, default=0)
    average_quiz_score = Column(Numeric(5, 2))
    engagement_score = Column(Numeric(5, 4))
    dropout_risk_score = Column(Numeric(5, 4), index=True)
    last_activity = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="engagement")