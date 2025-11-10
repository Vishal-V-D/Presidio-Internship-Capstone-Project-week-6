# ✅ Light Base Image
FROM python:3.11-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Install system dependencies (needed for Chroma + embeddings)
RUN apt-get update && apt-get install -y \
    gcc \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ✅ Copy dependency file
COPY requirements.txt .

# ✅ Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ✅ Copy all project files
COPY . .

# ✅ Expose Flask port
EXPOSE 8000

# ✅ Start Flask app
CMD ["python", "app.py"]
