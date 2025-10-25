FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy ML code
COPY . .

# Create models directory
RUN mkdir -p models

# Expose port
EXPOSE 8001

# Start ML API server
CMD ["uvicorn", "ml_api:app", "--host", "0.0.0.0", "--port", "8001"]