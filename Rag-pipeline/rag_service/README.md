# FastAPI RAG Pipeline - Code Evaluation

This project implements a **RAG pipeline** to provide grounded, best-practice-based coding feedback.

## Features

- Index PDFs of language best practices
- Ingest web pages for live coding standards
- LangChain + Chroma embeddings
- Gemini LLM for feedback
- FastAPI microservice with VS Code-friendly structure

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt

##  Add .env with your Gemini API key:

# Windows example
python -m venv rag_env
.\rag_env\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
docker run -d -p 8000:8000 rag-service
