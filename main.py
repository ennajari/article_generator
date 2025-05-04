"""
Article Generator - Main Script
This script serves as the entry point for the Article Generator application.
It supports both CLI and UI modes.
"""

import argparse
import os
from crew.crew import ArticleCrew
from flywheel.data_flywheel import DataFlywheel
import uuid

def setup_directories():
    """Create necessary directories if they don't exist."""
    os.makedirs("data/documents", exist_ok=True)
    os.makedirs("data/flywheel/articles", exist_ok=True)
    os.makedirs("data/flywheel/feedback", exist_ok=True)
    os.makedirs("data/flywheel/analytics", exist_ok=True)

def cli_interface():
    """Command line interface for the article generator."""
    crew = ArticleCrew(docs_path="data/documents")
    flywheel = DataFlywheel()
    
    query = input("Entrez votre requête : ")
    print("\n🖋️ Génération en cours…\n")
    
    # Retrieve chunks and generate outline
    enriched_chunks = crew.vectorstore.query(query)
    outline_prompt = crew.outliner.prompt(enriched_chunks)
    outline = crew.generate_from_gemini(outline_prompt)
    
    # Generate article
    article = crew.run(query, outline, enriched_chunks)
    
    print("\n✅ Article généré :\n")
    print(article)
    
    # Save to data flywheel
    article_id = str(uuid.uuid4())
    from flywheel.data_flywheel import Article
    
    article_data = Article(
        article_id=article_id,
        query=query,
        content=article,
        outline=outline,
        chunks_used=[chunk[:100] + "..." for chunk in enriched_chunks.split("\n")]
    )
    flywheel.save_article(article_data)
    
    # Collect feedback
    print("\nVotre feedback est important pour améliorer notre système.")
    try:
        rating = int(input("Notez la qualité de l'article (1-5) : "))
        if rating < 1 or rating > 5:
            rating = 3  # Default to middle value if invalid
            
        feedback_text = input("Commentaires (optionnel) : ")
        
        print("\nQuelles améliorations suggéreriez-vous ? (séparées par des virgules)")
        print("Exemples: précision, structure, style, etc.")
        improvements_text = input("Améliorations : ")
        improvements = [imp.strip() for imp in improvements_text.split(",") if imp.strip()]
        
        from flywheel.data_flywheel import UserFeedback
        feedback = UserFeedback(
            article_id=article_id,
            query=query,
            rating=rating,
            feedback_text=feedback_text,
            improvements=improvements
        )
        
        flywheel.save_feedback(feedback)
        print("Merci pour votre feedback!")
        
    except Exception as e:
        print(f"Erreur lors de la collecte du feedback: {e}")

def main():
    """Main entry point."""
    setup_directories()
    
    parser = argparse.ArgumentParser(description="Article Generator")
    parser.add_argument("--ui", action="store_true", help="Lancer l'interface utilisateur Streamlit")
    parser.add_argument("--analytics", action="store_true", help="Générer des analyses sur les données collectées")
    
    args = parser.parse_args()
    
    if args.ui:
        print("Lancement de l'interface Streamlit...")
        import os
        os.system("streamlit run ui.py")
    elif args.analytics:
        flywheel = DataFlywheel()
        analytics = flywheel.generate_analytics()
        
        print("\n=== ANALYTICS ===")
        print(f"Total des articles: {analytics['total_articles']}")
        print(f"Total des feedbacks: {analytics['total_feedback']}")
        print(f"Note moyenne: {analytics['average_rating']:.2f}/5")
        
        print("\nTop mots-clés dans les requêtes:")
        for word, count in analytics['top_queries'].items():
            print(f"- {word}: {count}")
        
        print("\nCatégories d'amélioration:")
        for category, count in analytics['improvement_categories'].items():
            print(f"- {category}: {count}")
    else:
        cli_interface()

if __name__ == "__main__":
    main()