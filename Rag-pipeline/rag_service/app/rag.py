import os
import requests
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

# Load env vars
GEMINI_API_KEY = "AIzaSyB1XBZ9H7fYCIQKrhHcDgXunNi5Gl_sEdQ"
GOOGLE_API_KEY = GEMINI_API_KEY
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", "embeddings")

# ✅ Must match seed.py
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    transport="rest"
)

# ✅ Load existing vectorstore
print("📁 Loading Chroma vectorstore...")
vectorstore = Chroma(
    persist_directory=VECTORSTORE_DIR,
    embedding_function=embeddings,
    collection_name="best_practices_pdf",
)
print("✅ Vectorstore loaded successfully!")


def get_best_practices(language: str, k: int = 3) -> str:
    """
    Retrieve top-k relevant context
    """
    print(f"\n🔍 Searching top-{k} similar docs for: {language}")

    try:
        results = vectorstore.similarity_search(language, k=k)
        
        if not results:
            print("⚠️ No vector results found!")
            return ""

        print(f"✅ Retrieved {len(results)} results from vectorstore:")
        for i, r in enumerate(results):
            print(f"   #{i+1} -> {r.page_content[:80]}...")

        context = "\n".join([r.page_content for r in results])

        print("\n🧠 Final RAG context:")
        print(context[:250] + "..." if len(context) > 250 else context)

        return context

    except Exception as e:
        print(f"❌ Error retrieving context: {str(e)}")
        return f"Error retrieving context: {str(e)}"


def call_gemini(prompt: str) -> str:
    """
    Call Gemini API to generate feedback
    """
    print("\n🚀 Sending request to Gemini API...")
    print("📝 Prompt preview:")
    print(prompt[:250] + "..." if len(prompt) > 250 else prompt)

    body = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        resp = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=body,
            timeout=20,
        )

        print(f"📡 Gemini HTTP Status: {resp.status_code}")

        resp.raise_for_status()
        data = resp.json()

        print("✅ Gemini raw response received:")
        print(data)

        # ✅ Parse Gemini response
        try:
            output = (
                data["candidates"][0]["content"]["parts"][0]["text"]
                or "No response text."
            )
            print("\n✅ Gemini cleaned output:")
            print(output)
            return output

        except Exception as e:
            print("⚠️ Failed parsing Gemini text:", e)
            return "No valid response from Gemini."

    except Exception as e:
        print("❌ Gemini API Error:", str(e))
        return f"Error generating feedback: {str(e)}"
