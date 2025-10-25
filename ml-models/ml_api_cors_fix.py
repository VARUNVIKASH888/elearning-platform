# Add this import at the top of ml_api.py
from fastapi.middleware.cors import CORSMiddleware

# After creating the app, add CORS middleware:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
