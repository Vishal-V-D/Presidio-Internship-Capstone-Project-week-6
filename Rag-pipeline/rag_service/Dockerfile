# ✅ Light Base Image
FROM python:3.11-slim

# ✅ Set work dir
WORKDIR /app

# ✅ Install system dependencies (Chroma needs)
RUN apt-get update && apt-get install -y \
    gcc \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ✅ Copy requirements
COPY requirements.txt .

# ✅ Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# ✅ Copy app
COPY . .

# ✅ Expose port
EXPOSE 8000

# ✅ Start FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
