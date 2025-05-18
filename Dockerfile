# 1. Image de base légère Python
FROM python:3.11-slim

# 2. Variables d'environnement pour éviter les interactions avec pip
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Installer les dépendances système nécessaires pour certains packages Python
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Définir le répertoire de travail dans le container
WORKDIR /app

# 5. Copier requirements.txt et installer les dépendances Python
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 6. Copier le reste du projet dans le container
COPY . /app/

# 7. Exposer le port utilisé par Streamlit
EXPOSE 8501

# 8. Définir la commande par défaut pour démarrer Streamlit
CMD ["streamlit", "run", "ui.py", "--server.port=8501", "--server.address=0.0.0.0"]
