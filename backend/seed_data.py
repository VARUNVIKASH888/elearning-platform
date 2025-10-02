"""
Seed script - populates the database with sample data
Run: python seed_data.py
"""
'''
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import (User, Course, Module, Lesson, Quiz, Question,
                    AnswerOption, UserProgress, UserEngagement)
#from auth import get_password_hash
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password): return pwd_context.hash(password)
import uuid

db = SessionLocal()
print("🌱 Seeding database...")

# ─── 1. USERS ────────────────────────────────────────────────
print("Creating users...")

def get_or_create_user(email, name, role, password):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            name=name,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True
        )
        db.add(user)
        db.flush()
        # Create engagement record
        eng = UserEngagement(id=uuid.uuid4(), user_id=user.id)
        db.add(eng)
        db.flush()
        print(f"  ✅ Created {role}: {email}")
    else:
        print(f"  ⏭  Skipping {role}: {email} (exists)")
    return user

admin      = get_or_create_user("admin@elearning.com",  "Admin User",    "admin",      "admin123")
instructor1= get_or_create_user("john@elearning.com",   "John Smith",    "instructor", "instructor123")
instructor2= get_or_create_user("sara@elearning.com",   "Sara Johnson",  "instructor", "instructor123")
student    = get_or_create_user("student@test.com",     "Test Student",  "student",    "password123")
student2   = get_or_create_user("alice@test.com",       "Alice Brown",   "student",    "password123")
db.commit()

# ─── 2. COURSE DATA ──────────────────────────────────────────
courses_data = [
    {
        "title": "Python for Beginners",
        "description": "Learn Python programming from scratch. Covers variables, loops, functions, and object-oriented programming.",
        "difficulty_level": "beginner",
        "category": "Programming",
        "instructor": instructor1,
        "modules": [
            {
                "title": "Getting Started with Python",
                "content_type": "text",
                "lessons": [
                    ("Introduction to Python",
                     "Python is a high-level, interpreted programming language known for its simplicity.\n\nIn this lesson:\n- What Python is and why it's popular\n- How to install Python\n- Your first Python program: Hello, World!\n\nprint('Hello, World!')"),
                    ("Variables and Data Types",
                     "Variables are containers for storing data values.\n\nPython data types:\n- int: whole numbers (e.g. 5)\n- float: decimals (e.g. 3.14)\n- str: text (e.g. 'Hello')\n- bool: True or False\n\nname = 'Alice'\nage = 25\nheight = 5.6"),
                    ("Control Flow",
                     "Control flow determines execution order.\n\nif/elif/else:\nif age >= 18:\n    print('Adult')\nelif age >= 13:\n    print('Teenager')\nelse:\n    print('Child')\n\nfor i in range(5):\n    print(i)"),
                ],
                "quiz": {
                    "title": "Python Basics Quiz",
                    "questions": [
                        ("What is the correct way to create a variable in Python?",
                         [("x == 5", False), ("x = 5", True), ("int x = 5", False), ("var x = 5", False)]),
                        ("Which data type is used for decimal numbers?",
                         [("int", False), ("str", False), ("float", True), ("bool", False)]),
                        ("What does the 'def' keyword do?",
                         [("Defines a variable", False), ("Defines a function", True), ("Defines a class", False), ("Defines a module", False)]),
                    ]
                }
            },
            {
                "title": "Functions and Modules",
                "content_type": "text",
                "lessons": [
                    ("Defining Functions",
                     "Functions are reusable blocks of code.\n\ndef greet(name):\n    return f'Hello, {name}!'\n\nresult = greet('Alice')\nprint(result)  # Hello, Alice!"),
                    ("Python Modules",
                     "Modules are files containing Python code.\n\nimport math\nprint(math.pi)\n\nfrom datetime import datetime\nnow = datetime.now()\nprint(now)"),
                ],
                "quiz": {
                    "title": "Functions Quiz",
                    "questions": [
                        ("How do you define a function in Python?",
                         [("function myFunc():", False), ("def myFunc():", True), ("func myFunc():", False), ("define myFunc():", False)]),
                        ("What does 'return' do in a function?",
                         [("Ends the program", False), ("Prints a value", False), ("Sends a value back to the caller", True), ("Imports a module", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Web Development with React",
        "description": "Build modern web applications using React.js. Learn components, state, hooks, and API integration.",
        "difficulty_level": "intermediate",
        "category": "Web Development",
        "instructor": instructor1,
        "modules": [
            {
                "title": "React Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Introduction to React",
                     "React is a JavaScript library for building UIs.\n\nKey concepts:\n- Components: reusable UI pieces\n- JSX: JavaScript + HTML syntax\n- Virtual DOM: efficient rendering\n\nfunction Hello() {\n  return <h1>Hello, World!</h1>;\n}"),
                    ("Components and Props",
                     "Props pass data to components.\n\nfunction Greeting({ name }) {\n  return <h2>Hello, {name}!</h2>;\n}\n\n<Greeting name='Alice' />"),
                    ("State and useState",
                     "State manages component data.\n\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count+1)}>{count}</button>;\n}"),
                ],
                "quiz": {
                    "title": "React Basics Quiz",
                    "questions": [
                        ("What hook manages state in React?",
                         [("useEffect", False), ("useState", True), ("useContext", False), ("useRef", False)]),
                        ("What does JSX stand for?",
                         [("JavaScript XML", True), ("Java Syntax Extension", False), ("JavaScript Extension", False), ("JSON XML", False)]),
                        ("How do you pass data to a child component?",
                         [("Using state", False), ("Using props", True), ("Using context only", False), ("Using refs", False)]),
                    ]
                }
            },
            {
                "title": "Advanced React",
                "content_type": "text",
                "lessons": [
                    ("useEffect Hook",
                     "useEffect performs side effects.\n\nuseEffect(() => {\n  fetch('/api/data')\n    .then(r => r.json())\n    .then(setData);\n}, []); // runs once on mount"),
                    ("React Router",
                     "React Router enables navigation.\n\n<Routes>\n  <Route path='/' element={<Home />} />\n  <Route path='/about' element={<About />} />\n</Routes>"),
                ],
                "quiz": {
                    "title": "Advanced React Quiz",
                    "questions": [
                        ("When does useEffect with [] run?",
                         [("Every render", False), ("Never", False), ("Once on mount", True), ("On unmount only", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Machine Learning Fundamentals",
        "description": "Understand core ML concepts including supervised learning, neural networks, and model evaluation.",
        "difficulty_level": "advanced",
        "category": "Data Science",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Introduction to ML",
                "content_type": "text",
                "lessons": [
                    ("What is Machine Learning?",
                     "ML is a subset of AI that learns from data.\n\nTypes:\n1. Supervised Learning: labeled data\n   - Classification (spam detection)\n   - Regression (price prediction)\n\n2. Unsupervised Learning: unlabeled data\n   - Clustering\n\n3. Reinforcement Learning: rewards/penalties"),
                    ("Data Preprocessing",
                     "Preprocessing is crucial before training.\n\n# Handle missing values\ndf.fillna(df.mean(), inplace=True)\n\n# Scale features\nfrom sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)"),
                ],
                "quiz": {
                    "title": "ML Fundamentals Quiz",
                    "questions": [
                        ("Which ML type uses labeled training data?",
                         [("Unsupervised", False), ("Reinforcement", False), ("Supervised", True), ("Generative", False)]),
                        ("What does overfitting mean?",
                         [("Model is too simple", False), ("Good on train, poor on new data", True), ("Too few parameters", False), ("Trains too slowly", False)]),
                        ("What does StandardScaler do?",
                         [("Removes outliers", False), ("Encodes categories", False), ("Scales to mean=0, std=1", True), ("Fills missing values", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Data Science with Python",
        "description": "Analyze and visualize data using Pandas, NumPy, and Matplotlib.",
        "difficulty_level": "intermediate",
        "category": "Data Science",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Pandas & NumPy",
                "content_type": "text",
                "lessons": [
                    ("Introduction to Pandas",
                     "Pandas is a powerful data library.\n\nimport pandas as pd\n\ndf = pd.DataFrame({\n    'name': ['Alice', 'Bob'],\n    'age': [25, 30]\n})\n\nprint(df.head())\nprint(df.describe())"),
                    ("Data Analysis",
                     "Analyzing with Pandas:\n\n# Filter rows\nyoung = df[df['age'] < 30]\n\n# Group by\navg = df.groupby('dept')['score'].mean()\n\n# Sort\ndf_sorted = df.sort_values('score', ascending=False)"),
                ],
                "quiz": {
                    "title": "Data Science Quiz",
                    "questions": [
                        ("Which library is used for data manipulation?",
                         [("NumPy", False), ("Pandas", True), ("Matplotlib", False), ("Scikit-learn", False)]),
                        ("What does df.head() return?",
                         [("Last 5 rows", False), ("First 5 rows", True), ("All rows", False), ("Column names only", False)]),
                    ]
                }
            },
        ],
    },
]

# ─── 3. BUILD COURSES ────────────────────────────────────────
print("\nCreating courses, modules, lessons and quizzes...")

for course_data in courses_data:
    existing = db.query(Course).filter(Course.title == course_data["title"]).first()
    if existing:
        print(f"  ⏭  Skipping '{course_data['title']}' (exists)")
        continue

    course = Course(
        id=uuid.uuid4(),
        title=course_data["title"],
        description=course_data["description"],
        difficulty_level=course_data["difficulty_level"],
        category=course_data["category"],
        instructor_id=course_data["instructor"].id,
        is_published=True,
        estimated_duration_hours=10,
    )
    db.add(course)
    db.flush()

    first_lesson = None  # track for auto-progress

    for m_idx, mod_data in enumerate(course_data["modules"]):
        module = Module(
            id=uuid.uuid4(),
            course_id=course.id,
            title=mod_data["title"],
            content_type=mod_data["content_type"],
            order_index=m_idx + 1,
        )
        db.add(module)
        db.flush()

        # Lessons
        for l_idx, (title, content) in enumerate(mod_data["lessons"]):
            lesson = Lesson(
                id=uuid.uuid4(),
                module_id=module.id,
                title=title,
                content=content,
                media_type="text",
                order_index=l_idx + 1,
                duration_minutes=10,
            )
            db.add(lesson)
            db.flush()
            if first_lesson is None:
                first_lesson = (lesson, module)

        # Quiz attached to this module
        quiz_data = mod_data.get("quiz")
        if quiz_data:
            quiz = Quiz(
                id=uuid.uuid4(),
                module_id=module.id,
                title=quiz_data["title"],
                passing_score=70,
                time_limit_minutes=15,
            )
            db.add(quiz)
            db.flush()

            for q_idx, (q_text, options) in enumerate(quiz_data["questions"]):
                question = Question(
                    id=uuid.uuid4(),
                    quiz_id=quiz.id,
                    question_text=q_text,
                    question_type="multiple_choice",
                    difficulty_level="medium",
                    points=1,
                    order_index=q_idx + 1,
                )
                db.add(question)
                db.flush()

                for o_idx, (opt_text, is_correct) in enumerate(options):
                    option = AnswerOption(
                        id=uuid.uuid4(),
                        question_id=question.id,
                        option_text=opt_text,
                        is_correct=is_correct,
                        order_index=o_idx + 1,
                    )
                    db.add(option)

    # Auto-enroll test student by creating an in_progress UserProgress
    # for the first lesson of the course
    if student and first_lesson:
        lesson_obj, module_obj = first_lesson
        exists = db.query(UserProgress).filter(
            UserProgress.user_id == student.id,
            UserProgress.lesson_id == lesson_obj.id
        ).first()
        if not exists:
            progress = UserProgress(
                id=uuid.uuid4(),
                user_id=student.id,
                course_id=course.id,
                module_id=module_obj.id,
                lesson_id=lesson_obj.id,
                completion_status="not_started",
                time_spent_minutes=0,
            )
            db.add(progress)

    print(f"  ✅ Created '{course_data['title']}'")

db.commit()
print("\n✅ Database seeded successfully!")
print("\n📋 Test Accounts:")
print("  Student:    student@test.com     / password123")
print("  Student:    alice@test.com       / password123")
print("  Instructor: john@elearning.com   / instructor123")
print("  Instructor: sara@elearning.com   / instructor123")
print("  Admin:      admin@elearning.com  / admin123")

# ─── 4. FIX PROGRESS - create records for ALL lessons ────────
print("\nFixing progress records for test student...")
from models import UserProgress, User, Course, Module, Lesson
import uuid

student = db.query(User).filter(User.email == "student@test.com").first()
courses = db.query(Course).all()

for course in courses:
    lessons = db.query(Lesson).join(Module).filter(Module.course_id == course.id).all()
    for lesson in lessons:
        exists = db.query(UserProgress).filter(
            UserProgress.user_id == student.id,
            UserProgress.lesson_id == lesson.id
        ).first()
        if not exists:
            progress = UserProgress(
                id=uuid.uuid4(),
                user_id=student.id,
                course_id=course.id,
                module_id=lesson.module_id,
                lesson_id=lesson.id,
                completion_status="not_started",
                time_spent_minutes=0,
            )
            db.add(progress)
            print(f"  + Added progress for: {lesson.title}")

db.commit()
print("✅ Progress records fixed!")
db.close() 



from database import SessionLocal
from models import User, Course, Module, Lesson, Quiz, Question, AnswerOption
from auth import AuthHandler

def seed():
    db = SessionLocal()
    auth = AuthHandler()
    
    try:
        # Create instructor
        instructor = User(
            email="instructor@test.com",
            name="John Instructor",
            role="instructor",
            hashed_password=auth.hash_password("instructor123"),
            is_active=True
        )
        db.add(instructor)
        db.flush()
        
        # Create courses
        courses_data = [
            {
                "title": "Introduction to Python Programming",
                "description": "Learn Python from scratch with hands-on projects and real-world examples",
                "category": "Programming",
                "difficulty_level": "beginner"
            },
            {
                "title": "Advanced React Development",
                "description": "Master React hooks, context, and modern patterns",
                "category": "Web Development",
                "difficulty_level": "advanced"
            },
            {
                "title": "Machine Learning Fundamentals",
                "description": "Introduction to ML algorithms and practical applications",
                "category": "Data Science",
                "difficulty_level": "intermediate"
            }
        ]
        
        for course_data in courses_data:
            course = Course(
                **course_data,
                instructor_id=instructor.id,
                estimated_duration_hours=40,
                is_published=True
            )
            db.add(course)
            db.flush()
            
            # Create module for each course
            module = Module(
                course_id=course.id,
                title=f"{course.title} - Module 1",
                description="Getting started with the fundamentals",
                content_type="mixed",
                order_index=1
            )
            db.add(module)
            db.flush()
            
            # Create lessons
            for i in range(1, 4):
                lesson = Lesson(
                    module_id=module.id,
                    title=f"Lesson {i}: Introduction",
                    content=f"This is the content for lesson {i}. Learn the key concepts and practice with examples.",
                    duration_minutes=30,
                    order_index=i
                )
                db.add(lesson)
            
            # Create quiz
            quiz = Quiz(
                module_id=module.id,
                title=f"{course.title} - Quiz 1",
                description="Test your knowledge",
                passing_score=70,
                time_limit_minutes=15
            )
            db.add(quiz)
            db.flush()
            
            # Create questions
            question = Question(
                quiz_id=quiz.id,
                question_text="What is the main topic of this course?",
                question_type="multiple_choice",
                difficulty_level="easy",
                points=10,
                order_index=1
            )
            db.add(question)
            db.flush()
            
            # Create answer options
            options = [
                {"text": course.title, "is_correct": True},
                {"text": "Something else", "is_correct": False},
                {"text": "Another option", "is_correct": False},
                {"text": "Wrong answer", "is_correct": False}
            ]
            
            for idx, opt in enumerate(options):
                answer = AnswerOption(
                    question_id=question.id,
                    option_text=opt["text"],
                    is_correct=opt["is_correct"],
                    order_index=idx + 1
                )
                db.add(answer)
        
        db.commit()
        print("✅ Sample data created successfully!")
        print(f"   Created 3 courses with modules, lessons, and quizzes")
        print(f"   Instructor login: instructor@test.com / instructor123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()

# Run it
python seed_data.py '''

"""
Seed script - populates the database with sample data
Run: python seed_data.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import (User, Course, Module, Lesson, Quiz, Question,
                    AnswerOption, UserProgress, UserEngagement)
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password): return pwd_context.hash(password)
import uuid

db = SessionLocal()
print("🌱 Seeding database...")

# ─── 1. USERS ────────────────────────────────────────────────
print("Creating users...")

def get_or_create_user(email, name, role, password):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            name=name,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True
        )
        db.add(user)
        db.flush()
        eng = UserEngagement(id=uuid.uuid4(), user_id=user.id)
        db.add(eng)
        db.flush()
        print(f"  ✅ Created {role}: {email}")
    else:
        print(f"  ⏭  Skipping {role}: {email} (exists)")
    return user

admin       = get_or_create_user("admin@elearning.com",  "Admin User",    "admin",      "admin123")
instructor1 = get_or_create_user("john@elearning.com",   "John Smith",    "instructor", "instructor123")
instructor2 = get_or_create_user("sara@elearning.com",   "Sara Johnson",  "instructor", "instructor123")
student     = get_or_create_user("student@test.com",     "Test Student",  "student",    "password123")
student2    = get_or_create_user("alice@test.com",        "Alice Brown",   "student",    "password123")
db.commit()

# ─── 2. COURSE DATA ──────────────────────────────────────────
courses_data = [
    {
        "title": "Python for Beginners",
        "description": "Learn Python programming from scratch. Covers variables, loops, functions, and object-oriented programming.",
        "difficulty_level": "beginner",
        "category": "Programming",
        "instructor": instructor1,
        "modules": [
            {
                "title": "Getting Started with Python",
                "content_type": "text",
                "lessons": [
                    ("Introduction to Python",
                     "Python is a high-level, interpreted programming language known for its simplicity.\n\nIn this lesson:\n- What Python is and why it's popular\n- How to install Python\n- Your first Python program: Hello, World!\n\nprint('Hello, World!')"),
                    ("Variables and Data Types",
                     "Variables are containers for storing data values.\n\nPython data types:\n- int: whole numbers (e.g. 5)\n- float: decimals (e.g. 3.14)\n- str: text (e.g. 'Hello')\n- bool: True or False\n\nname = 'Alice'\nage = 25\nheight = 5.6"),
                    ("Control Flow",
                     "Control flow determines execution order.\n\nif/elif/else:\nif age >= 18:\n    print('Adult')\nelif age >= 13:\n    print('Teenager')\nelse:\n    print('Child')\n\nfor i in range(5):\n    print(i)"),
                ],
                "quiz": {
                    "title": "Python Basics Quiz",
                    "questions": [
                        ("What is the correct way to create a variable in Python?",
                         [("x == 5", False), ("x = 5", True), ("int x = 5", False), ("var x = 5", False)]),
                        ("Which data type is used for decimal numbers?",
                         [("int", False), ("str", False), ("float", True), ("bool", False)]),
                        ("What does the 'def' keyword do?",
                         [("Defines a variable", False), ("Defines a function", True), ("Defines a class", False), ("Defines a module", False)]),
                    ]
                }
            },
            {
                "title": "Functions and Modules",
                "content_type": "text",
                "lessons": [
                    ("Defining Functions",
                     "Functions are reusable blocks of code.\n\ndef greet(name):\n    return f'Hello, {name}!'\n\nresult = greet('Alice')\nprint(result)  # Hello, Alice!"),
                    ("Python Modules",
                     "Modules are files containing Python code.\n\nimport math\nprint(math.pi)\n\nfrom datetime import datetime\nnow = datetime.now()\nprint(now)"),
                ],
                "quiz": {
                    "title": "Functions Quiz",
                    "questions": [
                        ("How do you define a function in Python?",
                         [("function myFunc():", False), ("def myFunc():", True), ("func myFunc():", False), ("define myFunc():", False)]),
                        ("What does 'return' do in a function?",
                         [("Ends the program", False), ("Prints a value", False), ("Sends a value back to the caller", True), ("Imports a module", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Web Development with React",
        "description": "Build modern web applications using React.js. Learn components, state, hooks, and API integration.",
        "difficulty_level": "intermediate",
        "category": "Web Development",
        "instructor": instructor1,
        "modules": [
            {
                "title": "React Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Introduction to React",
                     "React is a JavaScript library for building UIs.\n\nKey concepts:\n- Components: reusable UI pieces\n- JSX: JavaScript + HTML syntax\n- Virtual DOM: efficient rendering\n\nfunction Hello() {\n  return <h1>Hello, World!</h1>;\n}"),
                    ("Components and Props",
                     "Props pass data to components.\n\nfunction Greeting({ name }) {\n  return <h2>Hello, {name}!</h2>;\n}\n\n<Greeting name='Alice' />"),
                    ("State and useState",
                     "State manages component data.\n\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count+1)}>{count}</button>;\n}"),
                ],
                "quiz": {
                    "title": "React Basics Quiz",
                    "questions": [
                        ("What hook manages state in React?",
                         [("useEffect", False), ("useState", True), ("useContext", False), ("useRef", False)]),
                        ("What does JSX stand for?",
                         [("JavaScript XML", True), ("Java Syntax Extension", False), ("JavaScript Extension", False), ("JSON XML", False)]),
                        ("How do you pass data to a child component?",
                         [("Using state", False), ("Using props", True), ("Using context only", False), ("Using refs", False)]),
                    ]
                }
            },
            {
                "title": "Advanced React",
                "content_type": "text",
                "lessons": [
                    ("useEffect Hook",
                     "useEffect performs side effects.\n\nuseEffect(() => {\n  fetch('/api/data')\n    .then(r => r.json())\n    .then(setData);\n}, []); // runs once on mount"),
                    ("React Router",
                     "React Router enables navigation.\n\n<Routes>\n  <Route path='/' element={<Home />} />\n  <Route path='/about' element={<About />} />\n</Routes>"),
                ],
                "quiz": {
                    "title": "Advanced React Quiz",
                    "questions": [
                        ("When does useEffect with [] run?",
                         [("Every render", False), ("Never", False), ("Once on mount", True), ("On unmount only", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Machine Learning Fundamentals",
        "description": "Understand core ML concepts including supervised learning, neural networks, and model evaluation.",
        "difficulty_level": "advanced",
        "category": "Data Science",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Introduction to ML",
                "content_type": "text",
                "lessons": [
                    ("What is Machine Learning?",
                     "ML is a subset of AI that learns from data.\n\nTypes:\n1. Supervised Learning: labeled data\n   - Classification (spam detection)\n   - Regression (price prediction)\n\n2. Unsupervised Learning: unlabeled data\n   - Clustering\n\n3. Reinforcement Learning: rewards/penalties"),
                    ("Data Preprocessing",
                     "Preprocessing is crucial before training.\n\n# Handle missing values\ndf.fillna(df.mean(), inplace=True)\n\n# Scale features\nfrom sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)"),
                ],
                "quiz": {
                    "title": "ML Fundamentals Quiz",
                    "questions": [
                        ("Which ML type uses labeled training data?",
                         [("Unsupervised", False), ("Reinforcement", False), ("Supervised", True), ("Generative", False)]),
                        ("What does overfitting mean?",
                         [("Model is too simple", False), ("Good on train, poor on new data", True), ("Too few parameters", False), ("Trains too slowly", False)]),
                        ("What does StandardScaler do?",
                         [("Removes outliers", False), ("Encodes categories", False), ("Scales to mean=0, std=1", True), ("Fills missing values", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Data Science with Python",
        "description": "Analyze and visualize data using Pandas, NumPy, and Matplotlib.",
        "difficulty_level": "intermediate",
        "category": "Data Science",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Pandas & NumPy",
                "content_type": "text",
                "lessons": [
                    ("Introduction to Pandas",
                     "Pandas is a powerful data library.\n\nimport pandas as pd\n\ndf = pd.DataFrame({\n    'name': ['Alice', 'Bob'],\n    'age': [25, 30]\n})\n\nprint(df.head())\nprint(df.describe())"),
                    ("Data Analysis",
                     "Analyzing with Pandas:\n\n# Filter rows\nyoung = df[df['age'] < 30]\n\n# Group by\navg = df.groupby('dept')['score'].mean()\n\n# Sort\ndf_sorted = df.sort_values('score', ascending=False)"),
                ],
                "quiz": {
                    "title": "Data Science Quiz",
                    "questions": [
                        ("Which library is used for data manipulation?",
                         [("NumPy", False), ("Pandas", True), ("Matplotlib", False), ("Scikit-learn", False)]),
                        ("What does df.head() return?",
                         [("Last 5 rows", False), ("First 5 rows", True), ("All rows", False), ("Column names only", False)]),
                    ]
                }
            },
        ],
    },
    # ─── NEW COURSES FOR RECOMMENDATIONS ──────────────────────
    {
        "title": "JavaScript Fundamentals",
        "description": "Master JavaScript from basics to advanced concepts including ES6+, async/await, and DOM manipulation.",
        "difficulty_level": "beginner",
        "category": "Web Development",
        "instructor": instructor1,
        "modules": [
            {
                "title": "JavaScript Basics",
                "content_type": "text",
                "lessons": [
                    ("Introduction to JavaScript",
                     "JavaScript is the language of the web.\n\nVariables:\nlet name = 'Alice';\nconst age = 25;\nvar old = 'avoid this';\n\nData types: string, number, boolean, null, undefined, object"),
                    ("Functions and Arrays",
                     "Functions in JS:\nfunction add(a, b) { return a + b; }\nconst multiply = (a, b) => a * b;\n\nArrays:\nconst nums = [1, 2, 3];\nnums.push(4);\nnums.map(n => n * 2);"),
                ],
                "quiz": {
                    "title": "JavaScript Basics Quiz",
                    "questions": [
                        ("Which keyword declares a constant in JavaScript?",
                         [("var", False), ("let", False), ("const", True), ("def", False)]),
                        ("What does arr.map() do?",
                         [("Filters elements", False), ("Transforms each element", True), ("Sorts elements", False), ("Removes elements", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Django Web Framework",
        "description": "Build powerful web applications with Python and Django. Covers models, views, templates and REST APIs.",
        "difficulty_level": "intermediate",
        "category": "Web Development",
        "instructor": instructor1,
        "modules": [
            {
                "title": "Django Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Getting Started with Django",
                     "Django is a high-level Python web framework.\n\nCreate a project:\ndjango-admin startproject mysite\ncd mysite\npython manage.py runserver\n\nCreate an app:\npython manage.py startapp myapp"),
                    ("Models and Database",
                     "Django models define your database structure.\n\nfrom django.db import models\n\nclass Article(models.Model):\n    title = models.CharField(max_length=200)\n    content = models.TextField()\n    created_at = models.DateTimeField(auto_now_add=True)\n\npython manage.py makemigrations\npython manage.py migrate"),
                ],
                "quiz": {
                    "title": "Django Quiz",
                    "questions": [
                        ("What command creates Django database tables?",
                         [("python manage.py runserver", False), ("python manage.py migrate", True), ("python manage.py startapp", False), ("python manage.py shell", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "SQL and Database Design",
        "description": "Learn relational database design, SQL queries, joins, indexes and query optimization.",
        "difficulty_level": "beginner",
        "category": "Database",
        "instructor": instructor2,
        "modules": [
            {
                "title": "SQL Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Introduction to SQL",
                     "SQL is the language for relational databases.\n\nBasic queries:\nSELECT * FROM users;\nSELECT name, email FROM users WHERE age > 18;\nINSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');\nUPDATE users SET name='Bob' WHERE id=1;\nDELETE FROM users WHERE id=1;"),
                    ("Joins and Relationships",
                     "Joins combine data from multiple tables.\n\nINNER JOIN:\nSELECT u.name, o.product\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id;\n\nLEFT JOIN returns all rows from left table:\nSELECT u.name, o.product\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id;"),
                ],
                "quiz": {
                    "title": "SQL Quiz",
                    "questions": [
                        ("Which SQL clause filters rows?",
                         [("GROUP BY", False), ("ORDER BY", False), ("WHERE", True), ("HAVING", False)]),
                        ("What does INNER JOIN do?",
                         [("Returns all rows from both tables", False), ("Returns matching rows from both tables", True), ("Returns all rows from left table", False), ("Deletes duplicate rows", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "Deep Learning with PyTorch",
        "description": "Build neural networks from scratch using PyTorch. Covers CNNs, RNNs, transformers and more.",
        "difficulty_level": "advanced",
        "category": "Data Science",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Neural Network Basics",
                "content_type": "text",
                "lessons": [
                    ("Introduction to PyTorch",
                     "PyTorch is a deep learning framework.\n\nimport torch\nimport torch.nn as nn\n\n# Create a tensor\nx = torch.tensor([1.0, 2.0, 3.0])\nprint(x.shape)  # torch.Size([3])\n\n# Simple neural network\nmodel = nn.Sequential(\n    nn.Linear(10, 64),\n    nn.ReLU(),\n    nn.Linear(64, 1)\n)"),
                    ("Training a Model",
                     "Training loop in PyTorch:\n\noptimizer = torch.optim.Adam(model.parameters(), lr=0.001)\ncriterion = nn.MSELoss()\n\nfor epoch in range(100):\n    optimizer.zero_grad()\n    output = model(X_train)\n    loss = criterion(output, y_train)\n    loss.backward()\n    optimizer.step()"),
                ],
                "quiz": {
                    "title": "PyTorch Quiz",
                    "questions": [
                        ("What does loss.backward() do?",
                         [("Updates weights", False), ("Computes gradients", True), ("Resets gradients", False), ("Evaluates the model", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "DevOps and Docker",
        "description": "Learn containerization, CI/CD pipelines, Docker Compose, Kubernetes basics and cloud deployment.",
        "difficulty_level": "intermediate",
        "category": "DevOps",
        "instructor": instructor1,
        "modules": [
            {
                "title": "Docker Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Introduction to Docker",
                     "Docker packages apps into containers.\n\nKey commands:\ndocker build -t myapp .\ndocker run -p 8000:8000 myapp\ndocker ps  # list running containers\ndocker stop <container_id>\n\nDockerfile example:\nFROM python:3.11\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ['python', 'app.py']"),
                    ("Docker Compose",
                     "Docker Compose runs multi-container apps.\n\ndocker-compose.yml:\nversion: '3'\nservices:\n  web:\n    build: .\n    ports:\n      - '8000:8000'\n  db:\n    image: postgres:14\n    environment:\n      POSTGRES_DB: mydb\n\nRun with:\ndocker-compose up"),
                ],
                "quiz": {
                    "title": "Docker Quiz",
                    "questions": [
                        ("What command builds a Docker image?",
                         [("docker run", False), ("docker build", True), ("docker push", False), ("docker pull", False)]),
                    ]
                }
            },
        ],
    },
    {
        "title": "UI/UX Design Principles",
        "description": "Learn user interface and experience design, wireframing, prototyping and usability testing.",
        "difficulty_level": "beginner",
        "category": "Design",
        "instructor": instructor2,
        "modules": [
            {
                "title": "Design Fundamentals",
                "content_type": "text",
                "lessons": [
                    ("Principles of Good Design",
                     "Core design principles:\n\n1. Hierarchy - guide the user's eye\n2. Contrast - make important things stand out\n3. Alignment - create visual order\n4. Repetition - maintain consistency\n5. Proximity - group related items\n\nColors:\n- Use 60-30-10 rule (dominant, secondary, accent)\n- Ensure accessible contrast ratios (4.5:1 minimum)"),
                    ("User Experience Basics",
                     "UX Design Process:\n1. Research - understand users\n2. Define - identify problems\n3. Ideate - brainstorm solutions\n4. Prototype - build mockups\n5. Test - validate with users\n\nKey UX metrics:\n- Task completion rate\n- Time on task\n- Error rate\n- User satisfaction score"),
                ],
                "quiz": {
                    "title": "Design Quiz",
                    "questions": [
                        ("What does UX stand for?",
                         [("User Experience", True), ("User Extension", False), ("UI Extension", False), ("Unified Experience", False)]),
                    ]
                }
            },
        ],
    },
]

# ─── 3. BUILD COURSES ────────────────────────────────────────
print("\nCreating courses, modules, lessons and quizzes...")

for course_data in courses_data:
    existing = db.query(Course).filter(Course.title == course_data["title"]).first()
    if existing:
        print(f"  ⏭  Skipping '{course_data['title']}' (exists)")
        continue

    course = Course(
        id=uuid.uuid4(),
        title=course_data["title"],
        description=course_data["description"],
        difficulty_level=course_data["difficulty_level"],
        category=course_data["category"],
        instructor_id=course_data["instructor"].id,
        is_published=True,
        estimated_duration_hours=10,
    )
    db.add(course)
    db.flush()

    for m_idx, mod_data in enumerate(course_data["modules"]):
        module = Module(
            id=uuid.uuid4(),
            course_id=course.id,
            title=mod_data["title"],
            content_type=mod_data["content_type"],
            order_index=m_idx + 1,
        )
        db.add(module)
        db.flush()

        for l_idx, (title, content) in enumerate(mod_data["lessons"]):
            lesson = Lesson(
                id=uuid.uuid4(),
                module_id=module.id,
                title=title,
                content=content,
                media_type="text",
                order_index=l_idx + 1,
                duration_minutes=10,
            )
            db.add(lesson)
            db.flush()

        quiz_data = mod_data.get("quiz")
        if quiz_data:
            quiz = Quiz(
                id=uuid.uuid4(),
                module_id=module.id,
                title=quiz_data["title"],
                passing_score=70,
                time_limit_minutes=15,
            )
            db.add(quiz)
            db.flush()

            for q_idx, (q_text, options) in enumerate(quiz_data["questions"]):
                question = Question(
                    id=uuid.uuid4(),
                    quiz_id=quiz.id,
                    question_text=q_text,
                    question_type="multiple_choice",
                    difficulty_level="medium",
                    points=1,
                    order_index=q_idx + 1,
                )
                db.add(question)
                db.flush()

                for o_idx, (opt_text, is_correct) in enumerate(options):
                    option = AnswerOption(
                        id=uuid.uuid4(),
                        question_id=question.id,
                        option_text=opt_text,
                        is_correct=is_correct,
                        order_index=o_idx + 1,
                    )
                    db.add(option)

    print(f"  ✅ Created '{course_data['title']}'")

db.commit()

# ─── 4. FIX PROGRESS - only enroll student in first 4 courses ─
print("\nFixing progress records for test student...")

student = db.query(User).filter(User.email == "student@test.com").first()
# Only enroll in original 4 courses so recommendations have 6 new ones to suggest
enroll_titles = [
    "Python for Beginners",
    "Web Development with React",
    "Machine Learning Fundamentals",
    "Data Science with Python",
]

for title in enroll_titles:
    course = db.query(Course).filter(Course.title == title).first()
    if not course:
        continue
    lessons = db.query(Lesson).join(Module).filter(Module.course_id == course.id).all()
    for lesson in lessons:
        exists = db.query(UserProgress).filter(
            UserProgress.user_id == student.id,
            UserProgress.lesson_id == lesson.id
        ).first()
        if not exists:
            progress = UserProgress(
                id=uuid.uuid4(),
                user_id=student.id,
                course_id=course.id,
                module_id=lesson.module_id,
                lesson_id=lesson.id,
                completion_status="not_started",
                time_spent_minutes=0,
            )
            db.add(progress)
            print(f"  + Progress: {lesson.title}")

db.commit()
print("✅ Progress records fixed!")

print("\n✅ Database seeded successfully!")
print("\n📋 Test Accounts:")
print("  Student:    student@test.com     / password123")
print("  Student:    alice@test.com       / password123")
print("  Instructor: john@elearning.com   / instructor123")
print("  Instructor: sara@elearning.com   / instructor123")
print("  Admin:      admin@elearning.com  / admin123")
print("\n📚 Total courses: 10 (4 enrolled + 6 available for recommendations)")
db.close()