import streamlit as st
from crew.crew import ArticleCrew

def main():
    st.title("Générateur d'articles")
    
    # Entrée de la requête
    query = st.text_input("Entrez votre requête :")
    
    if query:
        # Affichage du message pendant la génération
        st.write("🖋️ Génération en cours…")
        
        # Création de l'objet crew
        crew = ArticleCrew(docs_path="data/documents")
        
        # Génération de l'article
        article = crew.run(query)
        
        # Affichage de l'article généré
        st.write("✅ Article généré :")
        st.write(article)
    else:
        st.write("Veuillez entrer une requête pour générer un article.")

if __name__ == "__main__":
    main()
