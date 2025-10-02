from database import SessionLocal
from models import User, Course, Module, Lesson, UserProgress
from auth import AuthHandler
import random

db = SessionLocal()
auth = AuthHandler()

try:
    # Create 5 additional students
    students = []
    for i in range(5):
        student = User(
            email=f"mlstudent{i+1}@test.com",
            name=f"ML Student {i+1}",
            role="student",
            hashed_password=auth.hash_password("password123"),
            is_active=True
        )
        db.add(student)
        db.flush()
        students.append(student)
    
    # Get all courses and lessons
    courses = db.query(Course).all()
    
    # Create realistic enrollment patterns
    for student in students:
        # Each student enrolls in 2-4 courses
        num_enrollments = random.randint(2, 4)
        enrolled_courses = random.sample(courses, min(num_enrollments, len(courses)))
        
        for course in enrolled_courses:
            # Get course lessons
            modules = db.query(Module).filter(Module.course_id == course.id).all()
            lessons = []
            for module in modules:
                module_lessons = db.query(Lesson).filter(Lesson.module_id == module.id).all()
                lessons.extend(module_lessons)
            
            # Complete random percentage of lessons
            completion_rate = random.choice([0.2, 0.4, 0.6, 0.8, 1.0])
            num_to_complete = int(len(lessons) * completion_rate)
            
            for idx, lesson in enumerate(lessons):
                status = 'completed' if idx < num_to_complete else 'not_started'
                progress = UserProgress(
                    user_id=student.id,
                    course_id=course.id,
                    module_id=lesson.module_id,
                    lesson_id=lesson.id,
                    completion_status=status,
                    time_spent_minutes=random.randint(5, 30) if status == 'completed' else 0,
                    score=random.uniform(70, 100) if status == 'completed' else None
                )
                db.add(progress)
    
    db.commit()
    print("✅ Training data generated!")
    print(f"   Created {len(students)} students")
    print(f"   With varied enrollment patterns")
    
except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
