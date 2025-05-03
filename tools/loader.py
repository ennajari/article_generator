import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader

def load_text_files(folder_path: str) -> list[dict]:
    docs = []
    for fn in os.listdir(folder_path):
        path = os.path.join(folder_path, fn)
        if fn.lower().endswith(".pdf"):
            reader = PdfReader(path)
            text = "".join(page.extract_text() or "" for page in reader.pages)
        else:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        docs.append({"id": fn, "text": text})
    return docs

def split_into_chunks(docs: list[dict], chunk_size=1000, chunk_overlap=200) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    all_chunks = []
    for doc in docs:
        chunks = splitter.split_text(doc["text"])
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "doc_id": doc["id"],
                "chunk_id": f"{doc['id']}_chunk{i}",
                "text": chunk
            })
    return all_chunks
