import os
from fastapi import FastAPI
from dotenv import load_dotenv

from app.models import Submission, WebsiteSource
from app.rag import get_best_practices, call_gemini
from app.utils import load_webpage

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

app = FastAPI(title="RAG Pipeline AI Feedback")

VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", "embeddings")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Set key for embeddings
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

# ✅ Use same embeddings as seeding
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    transport="rest",
)

# -------------------------------------
# 🩺 Health Endpoints
# -------------------------------------
@app.get("/health")
def health_check():
    """
    Basic health check — confirms the service is running
    """
    return {"status": "ok", "service": "RAG Pipeline", "message": "Service healthy"}

@app.get("/healthz")
def liveness_check():
    """
    Liveness check — deeper check including dependencies
    """
    try:
        # Check GEMINI key loaded
        if not GEMINI_API_KEY:
            raise ValueError("Gemini API key missing")

        # Check vectorstore directory exists
        if not os.path.exists(VECTORSTORE_DIR):
            os.makedirs(VECTORSTORE_DIR, exist_ok=True)

        return {"status": "ok", "checks": {
            "gemini_key": True,
            "vectorstore_dir": True
        }}
    except Exception as e:
        return {"status": "error", "details": str(e)}
# -------------------------------------


@app.post("/api/ai/feedback")
def generate_feedback(submission: Submission):
    """
    Core feedback generator
    """

    print("\n📥 Incoming submission payload:")
    print(submission.model_dump())

    # ✅ Retrieve best practice context based on language
    context = get_best_practices(submission.language)

    # ✅ Create structured list of test results
    testcase_section = ""
    if submission.testCases:
        for i, t in enumerate(submission.testCases):
            testcase_section += f"""
Test Case {i+1}:
Input: {t.input}
Expected Output: {t.expectedOutput}
Actual Output: {t.actualOutput}
Passed: {t.passed}
"""

    # ✅ Build prompt with new required structure
    prompt = f"""
You are an expert code reviewer. Think step-by-step ,don't include emojis in output act like professional.

Use ONLY the retrieved best-practice context below. Do NOT hallucinate.

=== BEST PRACTICES CONTEXT ===
{context}

=== PROBLEM DESCRIPTION ===
Title: {submission.problem.title if submission.problem else "N/A"}
Difficulty: {submission.problem.difficulty if submission.problem else "N/A"}

Description:
{submission.problem.description if submission.problem else "N/A"}

=== USER SUBMISSION ===
Language: {submission.language}

Code:
{submission.code}

Program Output:
{submission.output}

Expected Output:
{submission.expectedOutput}

Submission Stats:
ID: {submission.submission.id if submission.submission else "N/A"}
Verdict: {submission.submission.verdict if submission.submission else "N/A"}
Passed Tests: {submission.submission.passedTests if submission.submission else "N/A"}
Total Tests: {submission.submission.totalTests if submission.submission else "N/A"}

=== TEST CASE RESULTS ===
{testcase_section}


Now provide structured feedback in the following format **ONLY**:

1)  Correctness Summary
- Is the code correct overall? Why?

2)  Test Case Analysis
- Identify failing test cases and explain failure reasons.

3)  Time Complexity
- Estimate Big-O complexity

4)  Space Complexity
- Estimate Big-O complexity

5)  Code Quality & Style
- Identify bad naming, formatting, unnecessary logic, or anti-patterns
- Reference best-practice context with citations

6)  Fixes
- Show improved / corrected code
- Explain changes

7)  Summary
- Score code quality 1–10
"""

    #  Call Gemini
    feedback = call_gemini(prompt)

    # (OPTIONAL) Save in DB here

    return {"feedback": feedback}


@app.post("/api/ai/add_webpage")
def add_webpage(source: WebsiteSource):
    """
    Add new webpage into Chroma embeddings dynamically
    """

    docs = load_webpage(source.url, source.language)

    vectorstore = Chroma(
        persist_directory=VECTORSTORE_DIR,
        embedding_function=embeddings,
        collection_name="best_practices_pdf",
    )

    vectorstore.add_documents(docs)

    return {
        "message": "✅ Webpage added to vector store.",
        "url": source.url,
        "language": source.language,
        "chunks_added": len(docs),
    }
