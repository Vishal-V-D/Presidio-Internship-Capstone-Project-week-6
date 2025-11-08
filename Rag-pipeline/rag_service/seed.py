import os
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.utils import load_pdfs, load_webpage

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY missing in .env")

# ✅ Set as environment variable
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

PDF_FOLDER = os.path.join("data", "best_practices")
VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", "embeddings")

# ✅ Load PDFs
pdf_docs = load_pdfs(PDF_FOLDER)
print(f"Loaded {len(pdf_docs)} PDF chunks.")

# ✅ Load webpages
websites = [
    {"url": "https://www.python.org/dev/peps/pep-0008/", "language": "python"},
    {"url": "https://google.github.io/styleguide/cppguide.html", "language": "cpp"},
    {"url": "https://www.oracle.com/java/technologies/javase/codeconventions-contents.html", "language": "java"},
]

web_docs = []
for site in websites:
    web_docs.extend(load_webpage(site["url"], site["language"]))

print(f"Loaded {len(web_docs)} webpage chunks.")

# ✅ Combine all docs
all_docs = pdf_docs + web_docs
print(f"Total documents to index: {len(all_docs)}")

if not all_docs:
    print("Nothing to embed. Exiting.")
    exit()

# ✅ Initialize embeddings with REST transport
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",  # ✅ Add "models/" prefix
    transport="rest"                    # ✅ Use REST instead of gRPC
)

# ✅ Build vectorstore
vectorstore = Chroma.from_documents(
    all_docs,
    embedding=embeddings,
    collection_name="best_practices_pdf",
    persist_directory=VECTORSTORE_DIR
)

# Note: persist() is deprecated in newer Chroma versions
# The data is auto-saved when persist_directory is specified
print(f"✅ Vector store saved in: {VECTORSTORE_DIR}")
print(f"✅ Total docs stored: {len(all_docs)}")



# import os
# from dotenv import load_dotenv
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_chroma import Chroma
# from app.utils import load_pdfs, load_webpage

# # ------------------- Load environment -------------------
# load_dotenv()

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# if not GEMINI_API_KEY:
#     raise ValueError("❌ GEMINI_API_KEY missing in .env")

# # Set as environment variable
# os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

# PDF_FOLDER = os.path.join("data", "best_practices")
# VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", "embeddings")

# # ------------------- Load PDFs -------------------
# print(f"📄 Loading PDFs from folder: {PDF_FOLDER}")
# pdf_docs = load_pdfs(PDF_FOLDER)
# print(f"✅ Loaded {len(pdf_docs)} PDF chunks.")

# # Add metadata mapping and remove duplicates
# unique_paths = set()
# filtered_pdf_docs = []
# for doc in pdf_docs:
#     file_path = doc.metadata.get("source", "unknown")
#     if file_path not in unique_paths:
#         unique_paths.add(file_path)
#         filtered_pdf_docs.append(doc)
#     else:
#         print(f"⚠️ Skipping duplicate PDF chunk: {file_path}")

# pdf_docs = filtered_pdf_docs
# print(f"📄 Total unique PDF chunks: {len(pdf_docs)}")

# # ------------------- Load Web Pages -------------------
# websites = [
#     {"url": "https://www.python.org/dev/peps/pep-0008/", "language": "python"},
#     {"url": "https://google.github.io/styleguide/cppguide.html", "language": "cpp"},
#     {"url": "https://www.oracle.com/java/technologies/javase/codeconventions-contents.html", "language": "java"},
# ]

# web_docs = []
# for site in websites:
#     chunks = load_webpage(site["url"], site["language"])
#     for c in chunks:
#         # Avoid duplicates by URL
#         if not any(d.metadata.get("source") == site["url"] for d in web_docs):
#             c.metadata["source"] = site["url"]
#             web_docs.append(c)
#         else:
#             print(f"⚠️ Duplicate webpage chunk skipped: {site['url']}")

# print(f"🌐 Loaded {len(web_docs)} webpage chunks.")

# # ------------------- Combine all docs -------------------
# all_docs = pdf_docs + web_docs
# print(f"📚 Total documents to index: {len(all_docs)}")

# if not all_docs:
#     print("❌ Nothing to embed. Exiting.")
#     exit()

# # ------------------- Initialize Embeddings -------------------
# embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/text-embedding-004",  # REST model
#     transport="rest"
# )
# print("🤖 Embeddings initialized using Google Gemini REST API.")

# # ------------------- Build Vectorstore -------------------
# vectorstore = Chroma.from_documents(
#     all_docs,
#     embedding=embeddings,
#     collection_name="best_practices_pdf",
#     persist_directory=VECTORSTORE_DIR
# )

# print(f"✅ Vector store saved in: {VECTORSTORE_DIR}")
# print(f"✅ Total documents stored: {len(all_docs)}")
# print("📝 Document sources indexed:")
# for doc in all_docs:
#     print(f" - {doc.metadata.get('source', 'unknown')}")
