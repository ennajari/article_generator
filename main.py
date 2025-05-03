from crew.crew import ArticleCrew

def main():
    crew = ArticleCrew(docs_path="data/documents")
    query = input("Entrez votre requête : ")
    print("\n🖋️ Génération en cours…\n")
    article = crew.run(query)
    print("\n✅ Article généré :\n")
    print(article)

if __name__ == "__main__":
    main()
