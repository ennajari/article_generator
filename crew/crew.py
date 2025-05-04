from agents.agents import (
    ResearcherAgent,
    OutlineSpecialistAgent,
    WriterAgent,
    EditorAgent
)
from tools.vectorstore import CustomVectorStore
from tools.gemini import generate_from_gemini
from crewai import Crew
from typing import List, Optional

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

    def generate_from_gemini(self, prompt: str) -> str:
        """Wrapper around the gemini generation function."""
        return generate_from_gemini(prompt)

    def run(self, query: str, outline: Optional[str] = None, enriched_chunks: Optional[str] = None) -> str:
        """
        Generate an article based on the provided query.
        
        Args:
            query: The user's query/topic for the article
            outline: Pre-generated outline (optional)
            enriched_chunks: Pre-retrieved context chunks (optional)
            
        Returns:
            The final polished article
        """
        # Get relevant chunks if not provided
        if enriched_chunks is None:
            enriched_chunks = self.vectorstore.query(query)
        
        # Generate outline if not provided
        if outline is None:
            outline_prompt = self.outliner.prompt(enriched_chunks)
            outline = generate_from_gemini(outline_prompt)

        # Generate the article
        article_prompt = f"""
        Requête: {query}
        
        Voici le plan:
        {outline}
        
        Contexte supplémentaire:
        {enriched_chunks[:2000]}  # Limiting to prevent token overflow
        
        Écris un article complet en suivant le plan. L'article doit être informatif,
        bien structuré, et adapté au contexte de la requête.
        """
        article = generate_from_gemini(article_prompt)

        # Edit and polish the article
        editor_prompt = f"""
        Voici l'article brut:
        
        {article}
        
        En tant qu'éditeur professionnel, corrige-le pour améliorer:
        1. La qualité de la langue (grammaire, syntaxe, orthographe)
        2. La cohérence et le flux du texte
        3. La clarté des explications
        4. Le style d'écriture pour le rendre plus engageant
        
        Retourne l'article amélioré sans commentaires additionnels.
        """
        final_article = generate_from_gemini(editor_prompt)

        return final_article
    
    def learn_from_feedback(self, feedback_data: List[dict]) -> None:
        """
        Adjust agent parameters based on feedback data.
        This is a simplified version - in a production system, you might use this 
        data to fine-tune your models or adjust prompt templates.
        
        Args:
            feedback_data: List of feedback entries with ratings and improvement suggestions
        """
        # Process feedback to identify common improvement areas
        improvement_counts = {
            "accuracy": 0,
            "structure": 0,
            "style": 0,
            "other": 0
        }
        
        total_ratings = 0
        sum_ratings = 0
        
        for feedback in feedback_data:
            sum_ratings += feedback.get("rating", 0)
            total_ratings += 1
            
            for improvement in feedback.get("improvements", []):
                if "précision" in improvement.lower() or "accuracy" in improvement.lower():
                    improvement_counts["accuracy"] += 1
                elif "structure" in improvement.lower() or "organisation" in improvement.lower():
                    improvement_counts["structure"] += 1
                elif "style" in improvement.lower() or "writing" in improvement.lower():
                    improvement_counts["style"] += 1
                else:
                    improvement_counts["other"] += 1
        
        # Using this information to adjust agent behavior
        # For example, if structure is a common issue, we could modify the outliner's prompts
        if improvement_counts["structure"] > improvement_counts["accuracy"] and improvement_counts["structure"] > improvement_counts["style"]:
            # Adjust outliner to focus more on better structure
            self.outliner.prioritize_structure = True  # This would be a real attribute you'd implement
        
        # Similarly for other improvement areas
        # This is where you'd implement your learning mechanism