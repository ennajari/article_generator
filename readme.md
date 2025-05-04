# Architecture Détaillée du Générateur d'Articles avec Data Flywheel

## Structure du Projet

```
C:\Users\Abdel\Downloads\article_generator\
├── .env                    # Variables d'environnement (clés API)
├── main.py                 # Point d'entrée et gestionnaire d'arguments CLI
├── ui.py                   # Interface utilisateur Streamlit
├── readme.md               # Documentation du projet
├── requirements.txt        # Dépendances du projet
│
├── agents/                 # Agents spécialisés dans la chaîne de création d'articles
│   ├── __init__.py         # Initialisation du module
│   ├── agents.py           # Définition des agents spécifiques et leurs responsabilités
│
├── crew/                   # Orchestration et gestion des agents
│   ├── __init__.py         # Initialisation du module
│   ├── crew.py             # Classe ArticleCrew pour coordonner le processus de génération
│
├── data/                   # Stockage des données
│   ├── documents/          # Documents sources pour la recherche contextuelle
│   │   └── exemple.txt     # Exemple de document
│   ├── flywheel/           # Stockage des données du flywheel
│   │   ├── articles/       # Articles générés (format JSON)
│   │   ├── feedback/       # Feedbacks utilisateurs (format JSON)
│   │   └── analytics/      # Rapports d'analyse (format JSON)
│
├── flywheel/               # Module pour le Data Flywheel
│   ├── __init__.py         # Initialisation du module
│   ├── data_flywheel.py    # Implémentation du mécanisme de Data Flywheel
│
├── llm/                    # Intégration avec les modèles de langage (LLMs)
│   ├── __init__.py         # Initialisation du module
│   ├── gemini.py           # Interface avec l'API Google Gemini
│
├── tools/                  # Outils utilitaires
│   ├── __init__.py         # Initialisation du module
│   ├── embedder.py         # Génération d'embeddings pour les documents
│   ├── gemini.py           # Fonctions d'aide pour l'API Gemini
│   ├── loader.py           # Chargement de documents (texte, PDF)
│   ├── vectorstore.py      # Stockage vectoriel pour la recherche sémantique
```

## Composants Principaux et Flux de Données

### 1. Entrée et Orchestration

#### `main.py`
- **Rôle**: Point d'entrée principal de l'application
- **Fonctionnalités**:
  - Analyse des arguments en ligne de commande
  - Initialisation des répertoires nécessaires
  - Lancement de l'interface CLI ou UI selon les options
  - Génération des rapports d'analyse sur demande
- **Interactions**:
  - Instancie `ArticleCrew` et `DataFlywheel`
  - Coordonne le flux de travail en mode CLI

#### `ui.py`
- **Rôle**: Interface utilisateur graphique avec Streamlit
- **Fonctionnalités**:
  - Formulaire de saisie pour la requête utilisateur
  - Affichage de l'article généré
  - Collecte structurée du feedback utilisateur
  - Tableau de bord administratif pour les analyses
- **Interactions**:
  - Instancie `ArticleCrew` pour la génération d'articles
  - Utilise `DataFlywheel` pour stocker les articles et feedbacks
  - Affiche les analyses générées par le flywheel

### 2. Génération et Orchestration

#### `crew/crew.py`
- **Rôle**: Orchestration du processus de génération d'articles
- **Classe principale**: `ArticleCrew`
- **Fonctionnalités**:
  - Initialisation des agents spécialisés
  - Coordination du workflow de génération d'articles
  - Intégration avec le système de vectorisation
  - Adaptation basée sur les feedbacks antérieurs
- **Méthodes clés**:
  - `run()`: Génère un article complet en coordonnant les agents
  - `learn_from_feedback()`: Ajuste les paramètres en fonction des retours

#### `agents/agents.py`
- **Rôle**: Définition des agents spécialisés
- **Classes principales**:
  - `ResearcherAgent`: Recherche d'informations pertinentes
  - `OutlineSpecialistAgent`: Création de plans d'articles structurés
  - `WriterAgent`: Rédaction du contenu brut
  - `EditorAgent`: Révision et amélioration de la qualité
- **Fonctionnalités**:
  - Compétences spécialisées pour chaque étape du processus
  - Prompts optimisés pour chaque tâche
  - Adaptabilité basée sur les feedbacks

### 3. Recherche et Contexte

#### `tools/vectorstore.py`
- **Rôle**: Stockage et recherche sémantique
- **Classe principale**: `CustomVectorStore`
- **Fonctionnalités**:
  - Indexation vectorielle des documents
  - Recherche par similarité sémantique
  - Récupération de contexte pertinent pour les requêtes
- **Méthodes clés**:
  - `load()`: Charge et indexe les documents
  - `query()`: Recherche les passages les plus pertinents

#### `tools/loader.py`
- **Rôle**: Chargement et prétraitement des documents
- **Fonctionnalités**:
  - Support de multiples formats (texte, PDF)
  - Segmentation des documents en chunks
  - Prétraitement du texte pour l'indexation
- **Fonctions principales**:
  - `load_text_files()`: Charge les documents textuels
  - `split_into_chunks()`: Segmente les documents en portions gérables

#### `tools/embedder.py`
- **Rôle**: Génération d'embeddings vectoriels
- **Classe principale**: `Embedder`
- **Fonctionnalités**:
  - Conversion de texte en représentations vectorielles
  - Interface avec le modèle Sentence Transformer
- **Méthodes clés**:
  - `embed()`: Transforme du texte en vecteurs numériques

### 4. Intégration LLM

#### `llm/gemini.py`
- **Rôle**: Interface avec l'API Google Gemini
- **Fonctionnalités**:
  - Configuration du client API
  - Gestion des clés d'API
  - Paramètres de génération
- **Fonction principale**:
  - `generate_from_gemini()`: Envoie des prompts et récupère les réponses

#### `tools/gemini.py`
- **Rôle**: Fonctions d'aide pour l'utilisation de Gemini
- **Fonctionnalités**:
  - Réplication de la fonction de génération pour utilisation dans les outils
  - Configuration identique à `llm/gemini.py`

### 5. Data Flywheel

#### `flywheel/data_flywheel.py`
- **Rôle**: Implémentation du mécanisme de Data Flywheel
- **Classes principales**:
  - `DataFlywheel`: Gestionnaire principal du flywheel
  - `Article`: Modèle de données pour les articles
  - `UserFeedback`: Modèle de données pour les feedbacks
- **Fonctionnalités**:
  - Stockage persistant des articles générés
  - Collecte et organisation des feedbacks utilisateurs
  - Génération d'analyses et métriques
  - Extraction de données d'entraînement
- **Méthodes clés**:
  - `save_article()`: Enregistre un article généré
  - `save_feedback()`: Stocke le feedback utilisateur
  - `generate_analytics()`: Crée des rapports d'analyse
  - `get_training_data()`: Extrait des données pour amélioration

## Flux de Travail Principal

1. **Entrée de la requête**
   - L'utilisateur entre une requête via UI ou CLI
   - Le système initialise le processus de génération

2. **Recherche contextuelle**
   - `CustomVectorStore` recherche les passages les plus pertinents
   - Les chunks sélectionnés forment le contexte initial

3. **Génération du plan**
   - `OutlineSpecialistAgent` crée une structure pour l'article
   - Le plan est validé et optimisé

4. **Rédaction du contenu**
   - `WriterAgent` rédige l'article brut selon le plan
   - Le contenu est généré avec le contexte enrichi

5. **Révision et amélioration**
   - `EditorAgent` révise et améliore la qualité linguistique
   - Le contenu est raffiné pour la cohérence et la fluidité

6. **Présentation**
   - L'article final est présenté à l'utilisateur
   - Le système enregistre l'article dans le flywheel

7. **Collecte de feedback**
   - L'utilisateur évalue l'article et fournit des suggestions
   - Le feedback est structuré et enregistré

8. **Analyse et amélioration**
   - Les données collectées sont analysées périodiquement
   - Les insights sont utilisés pour améliorer le système

## Mécanisme du Data Flywheel

### Collecte de Données
- **Articles générés**: Structure, contenu, métriques
- **Feedback utilisateurs**: Notes, commentaires, suggestions d'amélioration
- **Métadonnées**: Requêtes, contextes utilisés, horodatages

### Analyse
- **Patterns de qualité**: Identification des caractéristiques des articles bien notés
- **Points d'amélioration**: Catégorisation des problèmes récurrents
- **Analyse lexicale**: Termes fréquents dans les requêtes

### Boucle d'Amélioration
- **Ajustement des prompts**: Modification des instructions aux agents
- **Priorisation des améliorations**: Focus sur les aspects les plus critiqués
- **Enrichissement des contextes**: Amélioration des recherches contextuelles

### Métriques d'Évaluation
- **Note moyenne**: Évaluation globale de la qualité
- **Catégories d'amélioration**: Distribution des suggestions par type
- **Mots-clés populaires**: Termes fréquents dans les requêtes

## Technologies Utilisées

- **Frameworks**:
  - CrewAI pour l'orchestration des agents
  - Streamlit pour l'interface utilisateur
  - LangChain pour les chaînes de traitement NLP

- **Modèles de langage**:
  - Google Gemini pour la génération de contenu

- **Traitement vectoriel**:
  - Sentence Transformers pour les embeddings
  - Chroma pour la base de données vectorielle

- **Stockage**:
  - Système de fichiers JSON pour la persistance
  - Structure orientée document pour les données

- **Utilitaires**:
  - Pydantic pour la validation des modèles de données
  - Python-dotenv pour la gestion des configurations
  - UUID pour la génération d'identifiants uniques

## Extensibilité et Améliorations Futures

- **Intégration multimodale**: Support d'images et autres médias
- **API REST**: Exposition des fonctionnalités via API
- **Feedback avancé**: Annotations in-line et suggestions spécifiques
- **Apprentissage automatique**: Modèles prédictifs pour la qualité des articles
- **Personnalisation utilisateur**: Profils et préférences personnalisés