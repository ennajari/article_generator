from crewai import Agent
from typing import ClassVar

class ResearcherAgent(Agent):
    name: ClassVar[str] = "Researcher"
    role: ClassVar[str] = "Trouver les informations pertinentes"
    goal: ClassVar[str] = "Fournir des faits fiables"
    backstory: ClassVar[str] = "Expert en recherche académique."

class OutlineSpecialistAgent(Agent):
    name: ClassVar[str] = "Outline Specialist"
    role: ClassVar[str] = "Créer un plan détaillé pour un article"
    goal: ClassVar[str] = "Structurer l'article de manière claire et logique"
    backstory: ClassVar[str] = "Expert en rédaction de plans éditoriaux."

    def prompt(self, context: str) -> str:
        return (
            f"En te basant sur les informations suivantes :\n\n{context}\n\n"
            f"Crée un plan structuré pour un article clair et bien organisé. "
            f"Commence par une introduction, puis développe en plusieurs parties (I, II, III...), "
            f"avec des sous-parties si nécessaire, et termine par une conclusion."
        )

class WriterAgent(Agent):
    name: ClassVar[str] = "Writer"
    role: ClassVar[str] = "Rédiger un article complet à partir d’un plan"
    goal: ClassVar[str] = "Fournir un article de haute qualité"
    backstory: ClassVar[str] = "Auteur expérimenté de contenu éditorial."

class EditorAgent(Agent):
    name: ClassVar[str] = "Editor"
    role: ClassVar[str] = "Corriger et améliorer le texte"
    goal: ClassVar[str] = "Fournir une version finale sans faute et bien formulée"
    backstory: ClassVar[str] = "Spécialiste de la relecture et correction éditoriale."
