import os
from pypdf import PdfReader
from typing import List
import requests
from bs4 import BeautifulSoup

# ✅ Latest text-splitter package
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ✅ Latest Document class
from langchain_core.documents import Document


def load_pdfs(pdf_folder: str) -> List[Document]:
    """
    Load all PDFs in a folder and return Documents with language metadata
    """
    docs: List[Document] = []

    for filename in os.listdir(pdf_folder):
        if filename.lower().endswith(".pdf"):
            filepath = os.path.join(pdf_folder, filename)

            # Detect language prefix → e.g. python_pep8.pdf → 'python'
            language = filename.split("_")[0].lower()

            reader = PdfReader(filepath)
            text = "\n".join(
                [(page.extract_text() or "") for page in reader.pages]
            )

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=500, chunk_overlap=50
            )

            chunks = splitter.create_documents(
                [text],
                metadatas=[{"language": language, "source": filepath}]
            )

            docs.extend(chunks)

    return docs


def load_webpage(url: str, language: str) -> List[Document]:
    """
    Load webpage content and return Documents with metadata
    """
    res = requests.get(url, timeout=10)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    # Remove scripts + styles
    for tag in soup(["script", "style"]):
        tag.decompose()

    text = soup.get_text(separator="\n")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    docs = splitter.create_documents(
        [text],
        metadatas=[{"language": language, "source": url}]
    )

    return docs
