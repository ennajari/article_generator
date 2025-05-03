import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from tqdm import tqdm

class CustomVectorStore:
    def __init__(self):
        self.embedding_function = HuggingFaceEmbeddings()
        self.db = None

    def load(self, docs_path: str):
        documents = []
        for filename in os.listdir(docs_path):
            if filename.endswith(".txt"):
                loader = TextLoader(os.path.join(docs_path, filename))
                documents.extend(loader.load())

        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        docs = splitter.split_documents(documents)

        self.db = Chroma.from_documents(docs, self.embedding_function)

    def query(self, query: str, k: int = 5) -> str:
        results = self.db.similarity_search(query, k=k)
        return "\n".join([r.page_content for r in results])
