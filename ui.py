import streamlit as st
import uuid
from crew.crew import ArticleCrew
from flywheel.data_flywheel import DataFlywheel, Article, UserFeedback

def main():
    st.title("Générateur d'articles")
    
    # Initialize the data flywheel
    flywheel = DataFlywheel()
    
    # Session state to track article generation
    if 'article_generated' not in st.session_state:
        st.session_state.article_generated = False
    
    if 'article_id' not in st.session_state:
        st.session_state.article_id = None
        
    if 'article_content' not in st.session_state:
        st.session_state.article_content = None
        
    if 'query' not in st.session_state:
        st.session_state.query = None
        
    if 'outline' not in st.session_state:
        st.session_state.outline = None
        
    if 'chunks_used' not in st.session_state:
        st.session_state.chunks_used = None
    
    # Entrée de la requête
    query = st.text_input("Entrez votre requête :")
    
    generate_button = st.button("Générer l'article")
    
    if generate_button and query:
        # Affichage du message pendant la génération
        with st.spinner("🖋️ Génération en cours..."):
            # Création de l'objet crew
            crew = ArticleCrew(docs_path="data/documents")
            
            # Récupérer les chunks utilisés avant de générer l'article
            enriched_chunks = crew.vectorstore.query(query)
            
            # Générer le plan
            outline_prompt = crew.outliner.prompt(enriched_chunks)
            outline = crew.generate_from_gemini(outline_prompt)
            
            # Générer l'article
            article = crew.run(query, outline, enriched_chunks)
            
            # Générer un ID unique pour l'article
            article_id = str(uuid.uuid4())
            
            # Sauvegarder l'article dans le data flywheel
            article_data = Article(
                article_id=article_id,
                query=query,
                content=article,
                outline=outline,
                chunks_used=[chunk[:100] + "..." for chunk in enriched_chunks.split("\n")]  # Saving truncated chunks
            )
            flywheel.save_article(article_data)
            
            # Mettre à jour l'état de la session
            st.session_state.article_generated = True
            st.session_state.article_id = article_id
            st.session_state.article_content = article
            st.session_state.query = query
            st.session_state.outline = outline
            st.session_state.chunks_used = enriched_chunks
    
    # Affichage de l'article généré
    if st.session_state.article_generated:
        st.subheader("✅ Article généré :")
        st.write(st.session_state.article_content)
        
        # Afficher la section de feedback
        st.subheader("Votre feedback est important")
        st.write("Aidez-nous à améliorer notre générateur d'articles :")
        
        rating = st.slider("Notez la qualité de l'article (1-5)", 1, 5, 3)
        feedback_text = st.text_area("Commentaires (optionnel)")
        
        # Options d'amélioration spécifiques
        st.write("Quelles améliorations suggéreriez-vous ? (sélectionnez tout ce qui s'applique)")
        col1, col2 = st.columns(2)
        
        with col1:
            improve_accuracy = st.checkbox("Précision des informations")
            improve_structure = st.checkbox("Structure/Organisation")
        
        with col2:
            improve_style = st.checkbox("Style d'écriture")
            improve_other = st.checkbox("Autres améliorations")
        
        other_improvement = ""
        if improve_other:
            other_improvement = st.text_input("Précisez les autres améliorations")
        
        # Bouton de soumission du feedback
        if st.button("Soumettre le feedback"):
            improvements = []
            if improve_accuracy:
                improvements.append("Précision des informations")
            if improve_structure:
                improvements.append("Structure/Organisation")
            if improve_style:
                improvements.append("Style d'écriture")
            if improve_other and other_improvement:
                improvements.append(f"Autre: {other_improvement}")
            
            # Créer et sauvegarder le feedback
            feedback = UserFeedback(
                article_id=st.session_state.article_id,
                query=st.session_state.query,
                rating=rating,
                feedback_text=feedback_text,
                improvements=improvements
            )
            
            flywheel.save_feedback(feedback)
            st.success("Merci pour votre feedback! Il nous aidera à améliorer notre système.")
            
            # Option pour générer un nouvel article
            if st.button("Générer un nouvel article"):
                st.session_state.article_generated = False
                st.session_state.article_id = None
                st.session_state.article_content = None
                st.session_state.query = None
                st.session_state.outline = None
                st.session_state.chunks_used = None
                st.experimental_rerun()
    
    # Section admin (pourrait être protégée par mot de passe dans une application réelle)
    if st.sidebar.checkbox("Afficher les statistiques (Admin)"):
        st.sidebar.subheader("Statistiques du système")
        
        if st.sidebar.button("Générer des analyses"):
            analytics = flywheel.generate_analytics()
            
            st.sidebar.write(f"Total des articles: {analytics['total_articles']}")
            st.sidebar.write(f"Total des feedbacks: {analytics['total_feedback']}")
            st.sidebar.write(f"Note moyenne: {analytics['average_rating']:.2f}/5")
            
            st.sidebar.subheader("Top mots-clés dans les requêtes")
            for word, count in analytics['top_queries'].items():
                st.sidebar.write(f"- {word}: {count}")
            
            st.sidebar.subheader("Catégories d'amélioration")
            for category, count in analytics['improvement_categories'].items():
                st.sidebar.write(f"- {category}: {count}")

if __name__ == "__main__":
    main()