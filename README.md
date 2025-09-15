# E-Learning Platform

A modern, full-stack e-learning platform with AI-powered features built with FastAPI, React, and PostgreSQL.

## 🎯 Overview

This platform provides a complete learning management system (LMS) with personalized course recommendations, progress tracking, and student engagement analytics. The system uses basic AI techniques to help students discover relevant courses and identify at-risk learners.

## ✨ Features

### Core Functionality

#### 🎓 User Management
- Multi-role System: Students, instructors, and administrators
- Secure Authentication: JWT-based authentication with bcrypt password hashing
- Profile Management: Customizable user profiles with activity tracking
- Role-based Access Control: Different permissions for each user type

#### 📚 Course Management
- Rich Course Content: Courses organized into modules and lessons
- Multiple Content Types: Video lessons, reading materials, quizzes
- Course Categories: Programming, Data Science, Web Development, Design, and more
- Difficulty Levels: Beginner, Intermediate, Advanced
- Instructor Tools: Create and manage courses, modules, lessons, and assessments

#### 📊 Progress Tracking
- Real-time Progress: Track completion status across all courses
- Detailed Analytics: View time spent, scores, and completion rates
- Visual Dashboards: Charts and graphs showing learning progress
- Milestone Tracking: Monitor achievements and goals

#### ✅ Assessment System
- Interactive Quizzes: Multiple-choice questions with instant feedback
- Automatic Grading: Immediate score calculation
- Quiz Attempts: Track all quiz submissions and scores
- Performance Analytics: Identify strong and weak areas

### 🤖 AI/ML Features (Basic Implementation)

#### 1. Content-Based Course Recommendations

**How it works:**
- Analyzes the category and difficulty level of courses you've enrolled in
- Suggests similar courses in the same category
- Provides beginner-friendly courses for new users
- Uses fixed scoring (0.6-0.8) for recommendation strength

**Example:**
If you enrolled in "Python for Beginners" (Programming, Beginner)
→ Recommends: "JavaScript Fundamentals" (Programming, Beginner) - Score: 0.7
→ Recommends: "Web Development with React" (Programming, Intermediate) - Score: 0.8

**Benefits:**
- Discover courses aligned with your interests
- Progressive learning path from beginner to advanced
- No cold-start problem for new users

#### 2. Student Dropout Risk Prediction

**How it works:**
Analyzes 3 key behavioral features:
- Days since last login (40% weight): How recently you've accessed the platform
- Login frequency (30% weight): How often you engage with the platform
- Completion rate (30% weight): Percentage of started lessons you've completed

**Risk Levels:**
- Low Risk (Score < 0.4): Student is engaged and on track
- Medium Risk (Score 0.4-0.7): Some warning signs, monitoring recommended
- High Risk (Score > 0.7): Significant risk of dropping out, intervention needed

**Example:**
Student Profile:

Last login: 16 days ago → +0.4 risk
Login frequency: 0.15 (once per week) → +0.3 risk
Completion rate: 0.25 (25% of lessons) → +0.3 risk
= Total: 1.0 (High Risk)
→ Recommendation: "Contact student, Send reminder email"

#### 3. Engagement Scoring

**How it works:**
Calculates a 0-100 engagement score based on:
- Login recency (40 points): Logged in today = 40pts, last week = 20pts
- Login frequency (30 points): Based on login pattern over time
- Completion rate (30 points): Based on lesson completion percentage

**Engagement Levels:**
- High (70-100): Actively engaged student
- Medium (40-69): Moderately engaged, could improve
- Low (0-39): Disengaged, needs attention

## 📋 System Requirements

### Required
- Python: 3.11 or higher
- Node.js: 18.x or higher
- PostgreSQL: 14 or higher
- Git: For version control

### Optional
- Redis: 7.x (for caching - improves performance)
- Docker: For containerized deployment

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/elearning-platform.git
cd elearning-platform
```

### Step 2: Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb elearning_db

# Apply schema
psql -d elearning_db -f database/schema.sql
```

#### Option B: Docker PostgreSQL

```bash
docker run -d \
  --name elearning-postgres \
  -e POSTGRES_DB=elearning_db \
  -e POSTGRES_USER=elearning_user \
  -e POSTGRES_PASSWORD=changeme \
  -p 5432:5432 \
  postgres:14

# Apply schema
psql -h localhost -U elearning_user -d elearning_db -f database/schema.sql
```

### Step 3: Backend API Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/Scripts/activate  # Windows (Git Bash)
# source venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Seed database with sample data
python seed_data.py

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend is now running at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Step 4: ML API Setup

```bash
cd ml-models
source ../backend/venv/Scripts/activate
uvicorn ml_api:app --reload --host 0.0.0.0 --port 8001
```

ML API is now running at:
- API: http://localhost:8001
- Docs: http://localhost:8001/docs

### Step 5: Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Frontend is now running at: http://localhost:3000

## 🏗️ Architecture

┌────────────────────────────────────────────┐
│         FRONTEND (Port 3000)               │
│   React 18 + Material-UI                  │
└──────────────┬─────────────────────────────┘
│ HTTP Requests
┌──────┴──────┐
│             │
┌───────▼──────┐  ┌──▼─────────────┐
│ Backend API  │  │   ML API       │
│ (Port 8000)  │  │  (Port 8001)   │
│              │  │                │
│ • Auth       │  │ • Recommend    │
│ • CRUD       │  │ • Dropout      │
│ • Progress   │  │ • Engagement   │
└──────┬───────┘  └────────────────┘
│
┌───┴────┐
│        │
┌──▼──┐  ┌─▼────┐
│ DB  │  │Redis │
│     │  │(Opt) │
└─────┘  └──────┘

## 📊 Database Schema

### Core Tables (13 total)

- **users**: User accounts (students, instructors, admins)
- **courses**: Course catalog
- **modules**: Course modules
- **lessons**: Individual lessons
- **quizzes**: Assessments
- **questions**: Quiz questions
- **answer_options**: Multiple choice options
- **user_progress**: Lesson completion tracking
- **quiz_attempts**: Quiz submissions
- **user_answers**: Individual quiz answers
- **ml_recommendations**: AI-generated suggestions
- **analytics**: Platform metrics
- **user_engagement**: Engagement tracking

See `database/schema.sql` for complete schema.

## 🔐 Authentication

### Register a New User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "name": "John Doe",
    "password": "SecurePass123!",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123!"
  }'
```

### Use Token

```bash
curl -X GET http://localhost:8000/api/courses \
  -H "Authorization: Bearer <your-token>"
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course (instructor/admin)
- `GET /api/courses/{id}` - Get course details
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course
- `POST /api/courses/{id}/enroll` - Enroll in course

### Progress
- `GET /api/progress/user/{user_id}` - Get user progress
- `GET /api/progress/course/{course_id}` - Get course progress
- `POST /api/progress` - Update progress

### Quizzes
- `GET /api/quizzes/{id}` - Get quiz details
- `GET /api/quizzes/{id}/questions` - Get quiz questions
- `POST /api/quizzes/{id}/submit` - Submit quiz answers

### ML/AI
- `POST /api/ml/recommendations` - Get course recommendations
- `POST /api/ml/predict-dropout` - Predict dropout risk
- `POST /api/ml/engagement-score` - Calculate engagement score
- `GET /api/ml/health` - Check ML API status

Full documentation: http://localhost:8000/docs

## 🧪 Testing

### Test Accounts

After running seed_data.py:

- Student: `student@test.com` / `password123`
- Student: `alice@test.com` / `password123`
- Instructor: `john@elearning.com` / `instructor123`
- Admin: `admin@elearning.com` / `admin123`

### Sample Courses

1. Python for Beginners (Programming, Beginner)
2. Web Development with React (Web Development, Intermediate)
3. Machine Learning Fundamentals (Data Science, Advanced)
4. Data Science with Python (Data Science, Intermediate)
5. JavaScript Fundamentals (Programming, Beginner)
6. Django Web Framework (Web Development, Intermediate)
7. SQL and Database Design (Databases, Beginner)
8. Deep Learning with PyTorch (AI, Advanced)
9. DevOps and Docker (DevOps, Intermediate)
10. UI/UX Design Principles (Design, Beginner)

## 🤖 AI Implementation

### Content-Based Recommendation Engine

File: `ml-models/recommendation_engine.py`

```python
def get_recommendations(user_id, top_n=10):
    # Get user's enrolled courses
    user_courses = fetch_user_courses(user_id)
    
    # For new users, return beginner courses
    if not user_courses:
        return get_beginner_courses(top_n)
    
    # Get last enrolled course
    last_course = user_courses[-1]
    
    # Find similar courses (same category)
    similar = find_courses_by_category(
        category=last_course.category,
        exclude=user_courses
    )
    
    # Assign fixed scores
    for course in similar:
        course.score = 0.8
        course.reason = f"Similar to {last_course.title}"
    
    return similar
```

No training required - rule-based system.

### Dropout Risk Prediction

File: `ml-models/predictive_analytics.py`

```python
def predict_dropout_risk(user_data):
    risk_score = 0.0
    
    # Feature 1: Days since last login (40%)
    if user_data['days_since_last_login'] > 14:
        risk_score += 0.4
    elif user_data['days_since_last_login'] > 7:
        risk_score += 0.2
    
    # Feature 2: Login frequency (30%)
    if user_data['login_frequency'] < 0.2:
        risk_score += 0.3
    
    # Feature 3: Completion rate (30%)
    if user_data['completion_rate'] < 0.3:
        risk_score += 0.3
    
    # Determine risk level
    if risk_score < 0.4:
        return 'low'
    elif risk_score < 0.7:
        return 'medium'
    else:
        return 'high'
```

Uses 3 features (not 6 like advanced systems).

## 🔧 Configuration

### Backend (.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/elearning_db
REDIS_HOST=localhost
REDIS_PORT=6379
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ML_API_URL=http://localhost:8001
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432
psql -h localhost -U postgres -d elearning_db
```

### Port Already in Use

```bash
# Find process
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### ML API Import Errors

```bash
cd ml-models
source ../backend/venv/Scripts/activate
python -c "from database import SessionLocal; print('OK')"
```

### React Build Errors

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure
elearning-platform/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   ├── seed_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── ml-models/
│   ├── ml_api.py
│   ├── recommendation_engine.py
│   └── predictive_analytics.py
├── database/
│   └── schema.sql
└── README.md

## 🚀 Deployment

### Production Checklist

- [ ] Change SECRET_KEY to strong random string
- [ ] Set DEBUG=False
- [ ] Use production database
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Use Gunicorn with workers
- [ ] Minify frontend (npm run build)
- [ ] Configure rate limiting

### VPS Deployment

```bash
# Backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# ML API
gunicorn ml_api:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

# Frontend
npm run build
# Serve build/ with Nginx
```

## 📄 License

MIT License

Copyright (c) 2025 E-Learning Platform

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📧 Support

- Documentation: Check README and API docs at /docs
- Issues: Create issue in GitHub repository
- API Reference: http://localhost:8000/docs

## 🎓 Technologies

- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React 18, Material-UI
- AI/ML: Python (rule-based algorithms)
- Auth: JWT, bcrypt
- Cache: Redis (optional)

## 🔄 Changelog

### Version 1.0.0 (December 2025)

Initial Release

Features:
- User authentication (JWT)
- Multi-role system
- Course management
- Progress tracking
- Quiz system
- Basic AI recommendations
- Dropout prediction (3-feature)
- Engagement scoring
- Responsive design

Technical:
- FastAPI backend
- React 18 frontend
- PostgreSQL database
- RESTful API

---

Built with FastAPI, React, and PostgreSQL

An educational platform demonstrating modern web development and basic AI integration
