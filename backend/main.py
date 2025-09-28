"""
Main FastAPI Application
E-Learning Platform REST API
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from uuid import UUID

from database import get_db, init_db
from models import (
    User, Course, Module, Lesson, Quiz, Question, AnswerOption,
    UserProgress, QuizAttempt, UserAnswer, MLRecommendation,
    Analytics, UserEngagement
)
from schemas import (
    UserLogin, UserRegister, TokenResponse, UserResponse,
    CourseCreate, CourseUpdate, CourseResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse,
    LessonCreate, LessonUpdate, LessonResponse,
    QuizCreate, QuizResponse, QuizSubmission, QuizResultResponse,
    ProgressUpdate, ProgressResponse, RecommendationResponse,
    AnalyticsResponse, UserEngagementResponse, DashboardAnalytics,
    InstructorAnalytics
)
from auth import AuthHandler, require_admin, require_instructor, require_authenticated

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="E-Learning Platform API",
    description="Scalable e-learning platform with AI-powered recommendations",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_handler = AuthHandler()


# ============= Health Check =============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# ============= Authentication Endpoints =============

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = auth_handler.hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Initialize user engagement record
        engagement = UserEngagement(user_id=new_user.id)
        db.add(engagement)
        db.commit()
        
        logger.info(f"New user registered: {new_user.email}")
        return new_user
    
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT tokens"""
    try:
        # Find user
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user or not auth_handler.verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Update engagement
        engagement = db.query(UserEngagement).filter(UserEngagement.user_id == user.id).first()
        if engagement:
            engagement.login_count += 1
            engagement.last_activity = datetime.utcnow()
        
        db.commit()
        
        # Generate tokens
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
        access_token = auth_handler.create_access_token(token_data)
        refresh_token = auth_handler.create_refresh_token(token_data)
        
        logger.info(f"User logged in: {user.email}")
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============= Course Endpoints =============

@app.post("/api/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    user_id: str = Depends(auth_handler.get_current_user_id),
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Create a new course (instructor/admin only)"""
    try:
        new_course = Course(
            **course_data.dict(),
            instructor_id=UUID(user_id)
        )
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        
        logger.info(f"Course created: {new_course.title} by user {user_id}")
        return new_course
    
    except Exception as e:
        db.rollback()
        logger.error(f"Course creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of published courses"""
    query = db.query(Course).filter(Course.is_published == True)
    
    if category:
        query = query.filter(Course.category == category)
    if difficulty:
        query = query.filter(Course.difficulty_level == difficulty)
    
    courses = query.offset(skip).limit(limit).all()
    return courses


@app.get("/api/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: UUID, db: Session = Depends(get_db)):
    """Get course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.put("/api/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    user_id: str = Depends(auth_handler.get_current_user_id),
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Update course (instructor/admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check ownership (non-admin)
    if role != "admin" and str(course.instructor_id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this course")
    
    # Update fields
    for field, value in course_data.dict(exclude_unset=True).items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    return course


@app.delete("/api/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    user_id: str = Depends(auth_handler.get_current_user_id),
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Delete course (instructor/admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check ownership
    if role != "admin" and str(course.instructor_id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")
    
    db.delete(course)
    db.commit()


# ============= Module Endpoints =============

@app.post("/api/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    module_data: ModuleCreate,
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Create a new module"""
    try:
        new_module = Module(**module_data.dict())
        db.add(new_module)
        db.commit()
        db.refresh(new_module)
        return new_module
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/courses/{course_id}/modules", response_model=List[ModuleResponse])
async def get_course_modules(course_id: UUID, db: Session = Depends(get_db)):
    """Get all modules for a course"""
    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
    return modules


@app.put("/api/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: UUID,
    module_data: ModuleUpdate,
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Update module"""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    for field, value in module_data.dict(exclude_unset=True).items():
        setattr(module, field, value)
    
    db.commit()
    db.refresh(module)
    return module


# ============= Lesson Endpoints =============

@app.post("/api/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Create a new lesson"""
    try:
        new_lesson = Lesson(**lesson_data.dict())
        db.add(new_lesson)
        db.commit()
        db.refresh(new_lesson)
        return new_lesson
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/modules/{module_id}/lessons", response_model=List[LessonResponse])
async def get_module_lessons(module_id: UUID, db: Session = Depends(get_db)):
    """Get all lessons for a module"""
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.order_index).all()
    return lessons


@app.get("/api/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: UUID, db: Session = Depends(get_db)):
    """Get lesson by ID"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# ============= Quiz Endpoints =============

@app.post("/api/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Create a new quiz with questions"""
    try:
        # Create quiz
        new_quiz = Quiz(
            module_id=quiz_data.module_id,
            title=quiz_data.title,
            description=quiz_data.description,
            passing_score=quiz_data.passing_score,
            time_limit_minutes=quiz_data.time_limit_minutes
        )
        db.add(new_quiz)
        db.flush()
        
        # Create questions and answer options
        for q_data in quiz_data.questions:
            question = Question(
                quiz_id=new_quiz.id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                difficulty_level=q_data.difficulty_level,
                points=q_data.points,
                order_index=q_data.order_index
            )
            db.add(question)
            db.flush()
            
            # Add answer options
            for opt_data in q_data.answer_options:
                option = AnswerOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct,
                    order_index=opt_data.order_index
                )
                db.add(option)
        
        db.commit()
        db.refresh(new_quiz)
        return new_quiz
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/modules/{module_id}/quizzes", response_model=List[QuizResponse])
async def get_module_quizzes(module_id: UUID, db: Session = Depends(get_db)):
    """Get all quizzes for a module"""
    quizzes = db.query(Quiz).filter(Quiz.module_id == module_id).all()
    return quizzes

@app.get("/api/quizzes/{quiz_id}/questions")
async def get_quiz_questions(quiz_id: UUID, db: Session = Depends(get_db)):
    """Get all questions and answer options for a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = db.query(Question).filter(
        Question.quiz_id == quiz_id
    ).order_by(Question.order_index).all()
    
    result = []
    for q in questions:
        options = db.query(AnswerOption).filter(
            AnswerOption.question_id == q.id
        ).order_by(AnswerOption.order_index).all()
        
        result.append({
            "id": str(q.id),
            "question_text": q.question_text,
            "question_type": q.question_type,
            "difficulty_level": q.difficulty_level,
            "points": q.points,
            "order_index": q.order_index,
            "options": [
                {
                    "id": str(o.id),
                    "option_text": o.option_text,
                    "order_index": o.order_index
                }
                for o in options
            ]
        })
    
    return {
        "quiz_id": str(quiz_id),
        "quiz_title": quiz.title,
        "passing_score": quiz.passing_score,
        "time_limit_minutes": quiz.time_limit_minutes,
        "questions": result
    }
@app.post("/api/quizzes/submit", response_model=QuizResultResponse)
async def submit_quiz(
    submission: QuizSubmission,
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and get results"""
    try:
        quiz = db.query(Quiz).filter(Quiz.id == submission.quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Create attempt
        attempt = QuizAttempt(
            user_id=UUID(user_id),
            quiz_id=submission.quiz_id,
            started_at=datetime.utcnow()
        )
        db.add(attempt)
        db.flush()
        
        total_points = 0
        points_earned = 0
        
        # Process answers
        for answer in submission.answers:
            question = db.query(Question).filter(Question.id == answer.question_id).first()
            if not question:
                continue
            
            total_points += question.points
            is_correct = False
            
            # Check answer
            if answer.answer_option_id:
                option = db.query(AnswerOption).filter(AnswerOption.id == answer.answer_option_id).first()
                is_correct = option.is_correct if option else False
            
            user_answer = UserAnswer(
                attempt_id=attempt.id,
                question_id=answer.question_id,
                answer_option_id=answer.answer_option_id,
                answer_text=answer.answer_text,
                is_correct=is_correct,
                points_earned=question.points if is_correct else 0
            )
            db.add(user_answer)
            
            if is_correct:
                points_earned += question.points
        
        # Calculate score
        score = (points_earned / total_points * 100) if total_points > 0 else 0
        attempt.score = score
        attempt.total_points = total_points
        attempt.passed = score >= quiz.passing_score
        attempt.submitted_at = datetime.utcnow()
        
        db.commit()
        db.refresh(attempt)
        
        return {
            "attempt_id": attempt.id,
            "quiz_id": attempt.quiz_id,
            "score": attempt.score,
            "total_points": attempt.total_points,
            "passed": attempt.passed,
            "time_taken_minutes": attempt.time_taken_minutes,
            "submitted_at": attempt.submitted_at
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============= Progress Tracking Endpoints =============

@app.post("/api/progress", response_model=ProgressResponse)
async def update_progress(
    progress_data: ProgressUpdate,
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update user progress for a lesson"""
    try:
        # Get lesson details
        lesson = db.query(Lesson).filter(Lesson.id == progress_data.lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        module = db.query(Module).filter(Module.id == lesson.module_id).first()
        
        # Check existing progress
        progress = db.query(UserProgress).filter(
            and_(
                UserProgress.user_id == UUID(user_id),
                UserProgress.lesson_id == progress_data.lesson_id
            )
        ).first()
        
        if progress:
            # Update existing
            progress.completion_status = progress_data.completion_status
            progress.time_spent_minutes += progress_data.time_spent_minutes
            progress.last_accessed = datetime.utcnow()
            if progress_data.completion_status == "completed":
                progress.completed_at = datetime.utcnow()
        else:
            # Create new
            progress = UserProgress(
                user_id=UUID(user_id),
                course_id=module.course_id,
                module_id=lesson.module_id,
                lesson_id=progress_data.lesson_id,
                completion_status=progress_data.completion_status,
                time_spent_minutes=progress_data.time_spent_minutes,
                completed_at=datetime.utcnow() if progress_data.completion_status == "completed" else None
            )
            db.add(progress)
        
        db.commit()
        db.refresh(progress)
        return progress
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/progress/course/{course_id}", response_model=List[ProgressResponse])
async def get_course_progress(
    course_id: UUID,
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user progress for a specific course"""
    progress = db.query(UserProgress).filter(
        and_(
            UserProgress.user_id == UUID(user_id),
            UserProgress.course_id == course_id
        )
    ).all()
    return progress


# ============= Recommendation Endpoints =============

@app.get("/api/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    user_id: str = Depends(auth_handler.get_current_user_id),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get personalized course recommendations"""
    recommendations = db.query(
        MLRecommendation, Course.title.label("course_title")
    ).join(
        Course, MLRecommendation.course_id == Course.id
    ).filter(
        MLRecommendation.user_id == UUID(user_id)
    ).order_by(
        MLRecommendation.recommendation_score.desc()
    ).limit(limit).all()
    
    return [
        {
            **rec[0].__dict__,
            "course_title": rec[1]
        }
        for rec in recommendations
    ]

# ============= Admin Endpoints =============

@app.get("/api/admin/students")
async def get_all_students(
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all students with progress summary - Admin only"""
    students = db.query(User).filter(User.role == 'student').all()
    
    result = []
    for student in students:
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == student.id
        ).all()
        
        completed = sum(1 for p in progress if p.completion_status == 'completed')
        total = len(progress)
        courses = len(set(str(p.course_id) for p in progress))
        
        result.append({
            "id": str(student.id),
            "name": student.name,
            "email": student.email,
            "is_active": student.is_active,
            "last_login": student.last_login.isoformat() if student.last_login else None,
            "courses_enrolled": courses,
            "lessons_completed": completed,
            "lessons_total": total,
            "completion_rate": round(completed / total, 2) if total > 0 else 0,
        })
    
    return result


@app.get("/api/admin/users")
async def get_all_users(
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all users - Admin only"""
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]
    
# ============= Analytics Endpoints =============

@app.get("/api/analytics/dashboard", response_model=DashboardAnalytics)
async def get_dashboard_analytics(
    role: str = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Get platform-wide analytics (admin only)"""
    today = datetime.utcnow().date()
    
    total_users = db.query(func.count(User.id)).scalar()
    active_today = db.query(func.count(User.id)).filter(
        func.date(User.last_login) == today
    ).scalar()
    
    total_courses = db.query(func.count(Course.id)).scalar()
    total_enrollments = db.query(func.count(UserProgress.id)).scalar()
    
    avg_completion = db.query(func.avg(Analytics.completion_rate)).scalar() or 0
    total_quiz_attempts = db.query(func.count(QuizAttempt.id)).scalar()
    avg_quiz_score = db.query(func.avg(QuizAttempt.score)).scalar() or 0
    
    return {
        "total_users": total_users,
        "active_users_today": active_today,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "average_completion_rate": float(avg_completion),
        "total_quiz_attempts": total_quiz_attempts,
        "average_quiz_score": float(avg_quiz_score)
    }


@app.get("/api/analytics/instructor", response_model=List[InstructorAnalytics])
async def get_instructor_analytics(
    user_id: str = Depends(auth_handler.get_current_user_id),
    role: str = Depends(require_instructor()),
    db: Session = Depends(get_db)
):
    """Get analytics for instructor's courses"""
    courses = db.query(Course).filter(Course.instructor_id == UUID(user_id)).all()
    
    analytics_list = []
    for course in courses:
        enrollments = db.query(func.count(func.distinct(UserProgress.user_id))).filter(
            UserProgress.course_id == course.id
        ).scalar()
        
        active_learners = db.query(func.count(func.distinct(UserProgress.user_id))).filter(
            and_(
                UserProgress.course_id == course.id,
                UserProgress.last_accessed >= datetime.utcnow() - timedelta(days=7)
            )
        ).scalar()
        
        completion = db.query(func.avg(Analytics.completion_rate)).filter(
            Analytics.course_id == course.id
        ).scalar() or 0
        
        avg_score = db.query(func.avg(Analytics.average_score)).filter(
            Analytics.course_id == course.id
        ).scalar() or 0
        
        total_time = db.query(func.sum(Analytics.engagement_time_minutes)).filter(
            Analytics.course_id == course.id
        ).scalar() or 0
        
        analytics_list.append({
            "course_id": course.id,
            "course_title": course.title,
            "total_enrollments": enrollments,
            "active_learners": active_learners,
            "completion_rate": float(completion),
            "average_score": float(avg_score),
            "total_time_spent_hours": float(total_time) / 60
        })
    
    return analytics_list


@app.get("/api/analytics/user", response_model=UserEngagementResponse)
async def get_user_analytics(
    user_id: str = Depends(auth_handler.get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get analytics for current user"""
    engagement = db.query(UserEngagement).filter(UserEngagement.user_id == UUID(user_id)).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="User engagement data not found")
    return engagement


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)