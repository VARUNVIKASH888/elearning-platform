from sqlalchemy import create_engine

DATABASE_URL = "postgresql://elearning_user@localhost:5432/elearning_db"
engine = create_engine(DATABASE_URL)
conn = engine.connect()
print("Database connected successfully!")
conn.close()
