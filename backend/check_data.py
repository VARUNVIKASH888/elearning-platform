from database import SessionLocal
from models import User, Course, UserProgress, QuizAttempt

db = SessionLocal()

print("=== Data Analysis ===\n")

users = db.query(User).filter(User.role == 'student').count()
courses = db.query(Course).count()
progress = db.query(UserProgress).count()
quiz_attempts = db.query(QuizAttempt).count()

print(f"Students: {users}")
print(f"Courses: {courses}")
print(f"Progress records: {progress}")
print(f"Quiz attempts: {quiz_attempts}")

# Check if we have enough data
if progress < 20:
    print("\n⚠️  WARNING: Not enough data to train ML models")
    print("   Need at least 20 progress records")
    print("   Recommendation: Create more sample enrollments")
else:
    print("\n✅ Enough data for basic ML training")

# Show sample user behavior
print("\n=== Sample User Behavior ===")
sample_progress = db.query(UserProgress).limit(5).all()
for p in sample_progress:
    user = db.query(User).filter(User.id == p.user_id).first()
    course = db.query(Course).filter(Course.id == p.course_id).first()
    print(f"User: {user.email} | Course: {course.title if course else 'N/A'} | Status: {p.completion_status}")

db.close()
