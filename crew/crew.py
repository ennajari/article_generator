from agents.agents import (
    ResearcherAgent,
    OutlineSpecialistAgent,
    WriterAgent,
    EditorAgent
)
from tools.vectorstore import CustomVectorStore
from tools.gemini import generate_from_gemini
from crewai import Crew

class ArticleCrew:
    def __init__(self, docs_path: str):
        self.vectorstore = CustomVectorStore()
        self.vectorstore.load(docs_path)

        self.researcher = ResearcherAgent()
        self.outliner = OutlineSpecialistAgent()
        self.writer = WriterAgent()
        self.editor = EditorAgent()

        self.crew = Crew(
            agents=[
                self.researcher,
                self.outliner,
                self.writer,
                self.editor
            ]
        )

    def run(self, query: str) -> str:
        enriched_chunks = self.vectorstore.query(query)
        outline_prompt = self.outliner.prompt(enriched_chunks)
        outline = generate_from_gemini(outline_prompt)

        article_prompt = f"Voici le plan :\n\n{outline}\n\nÉcris un article complet."
        article = generate_from_gemini(article_prompt)

        editor_prompt = f"Voici l'article brut :\n\n{article}\n\nCorrige-le pour améliorer la qualité de la langue."
        final_article = generate_from_gemini(editor_prompt)

        return final_article
