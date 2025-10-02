from database import SessionLocal
from models import User, Course, Module, Lesson
from auth import AuthHandler

def create_course():
    db = SessionLocal()
    
    try:
        # Get an instructor (or create one)
        instructor = db.query(User).filter(User.role == "instructor").first()
        
        if not instructor:
            auth = AuthHandler()
            instructor = User(
                email="testinstructor@test.com",
                name="Test Instructor",
                role="instructor",
                hashed_password=auth.hash_password("instructor123"),
                is_active=True
            )
            db.add(instructor)
            db.flush()
        
        # Create NEW test course
        course = Course(
            title="Brand New Test Course - Machine Learning Advanced",
            description="This is a newly created course to test enrollment functionality",
            category="Data Science",
            difficulty_level="advanced",
            estimated_duration_hours=50,
            instructor_id=instructor.id,
            is_published=True
        )
        db.add(course)
        db.flush()
        
        # Create module
        module = Module(
            course_id=course.id,
            title="Advanced ML Concepts",
            description="Deep dive into machine learning algorithms",
            content_type="mixed",
            order_index=1
        )
        db.add(module)
        db.flush()
        
        # Create 3 lessons
        for i in range(1, 4):
            lesson = Lesson(
                module_id=module.id,
                title=f"Lesson {i}: Advanced Topic {i}",
                content=f"This is lesson {i} content about advanced ML.",
                duration_minutes=45,
                order_index=i
            )
            db.add(lesson)
        
        db.commit()
        print("Course created successfully!")
        print(f"Course ID: {course.id}")
        print(f"Title: {course.title}")
        print("")
        print("Now refresh your browser and look for this course!")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_course()
