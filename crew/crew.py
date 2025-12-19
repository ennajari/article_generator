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

    def run(self, query: str, outline: Optional[str] = None, enriched_chunks: Optional[str] = None) -> dict:
        """
        Generate an article based on the provided query.

        Args:
            query: The user's query/topic for the article
            outline: Pre-generated outline (optional)
            enriched_chunks: Pre-retrieved context chunks (optional)

        Returns:
            Dictionary containing content, outline, and chunks_used
        """
        # Get relevant chunks if not provided
        chunks_list = []
        if enriched_chunks is None:
            enriched_chunks = self.vectorstore.query(query)
            chunks_list = [enriched_chunks]

        # Generate the article directly with enhanced prompt
        article_prompt = f"""
Tu es un expert rédacteur d'articles professionnels. Écris un article complet et de haute qualité sur le sujet suivant: "{query}"

INSTRUCTIONS IMPORTANTES:
1. Rédige un article long et détaillé (minimum 1500 mots)
2. Utilise un format Markdown avec des titres hiérarchiques (# ## ###)
3. Structure l'article avec:
   - Une introduction captivante qui présente le sujet
   - Plusieurs sections principales bien développées avec sous-sections
   - Des exemples concrets et actuels
   - Des données, statistiques ou faits vérifiables quand c'est pertinent
   - Une conclusion qui résume les points clés et ouvre des perspectives

4. Style d'écriture:
   - Professionnel mais accessible
   - Paragraphes bien développés (5-7 phrases minimum)
   - Transitions fluides entre les sections
   - Évite les répétitions
   - Utilise des termes techniques appropriés avec des explications claires

5. Contenu:
   - Approfondi chaque point avec des détails significatifs
   - Fournis des insights et analyses pertinentes
   - Ajoute des exemples réels, cas d'usage ou applications pratiques
   - Mentionne les tendances récentes ou développements actuels

6. Format Markdown:
   - Utilise # pour le titre principal
   - ## pour les sections principales
   - ### pour les sous-sections
   - **gras** pour les points importants
   - Listes à puces ou numérotées pour les énumérations
   - > pour les citations importantes si nécessaire

NE GÉNÈRE PAS DE PLAN SÉPARÉ. Rédige directement l'article complet en Markdown.

Commence maintenant à rédiger l'article:
"""

        # Generate high-quality article
        article = generate_from_gemini(article_prompt)

        # Polish and enhance the article
        editor_prompt = f"""
En tant qu'éditeur professionnel expert, améliore cet article pour le rendre encore plus professionnel et engageant:

{article}

Améliore:
1. QUALITÉ DU CONTENU:
   - Développe davantage les sections trop courtes (chaque section principale devrait avoir au moins 200 mots)
   - Ajoute plus d'exemples concrets et de détails pertinents
   - Enrichis avec des faits, données ou statistiques quand approprié
   - Assure que chaque paragraphe apporte une vraie valeur ajoutée

2. STRUCTURE ET COHÉRENCE:
   - Vérifie que la progression logique est fluide
   - Améliore les transitions entre sections
   - Assure une hiérarchie claire des titres en Markdown
   - Équilibre la longueur des différentes sections

3. STYLE ET CLARTÉ:
   - Perfectionne la grammaire, syntaxe et orthographe
   - Rends le texte plus engageant tout en restant professionnel
   - Élimine les répétitions et formulations faibles
   - Utilise un vocabulaire riche et précis

4. FORMAT MARKDOWN:
   - Assure un formatage Markdown impeccable
   - Vérifie la hiérarchie des titres (# ## ###)
   - Utilise le gras (**texte**) pour mettre en valeur les points clés
   - Ajoute des listes à puces ou numérotées où approprié

RETOURNE UNIQUEMENT L'ARTICLE AMÉLIORÉ EN MARKDOWN, sans commentaires additionnels.
"""
        final_article = generate_from_gemini(editor_prompt)

        # Generate a simple outline for storage (not displayed)
        outline = "Article généré avec IA"

        return {
            'content': final_article,
            'outline': outline,
            'chunks_used': chunks_list
        }
    
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
        
        if improvement_counts["structure"] > improvement_counts["accuracy"] and improvement_counts["structure"] > improvement_counts["style"]:
            # Adjust outliner to focus more on better structure
            self.outliner.prioritize_structure = True  # This would be a real attribute you'd implement
    