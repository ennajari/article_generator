import os
from openai import OpenAI
from dotenv import load_dotenv
import base64

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

def generate_from_gemini(prompt: str) -> str:
    """
    Generate high-quality content using OpenAI API
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Using GPT-4 for better quality
        messages=[
            {
                "role": "system",
                "content": "Tu es un expert rédacteur professionnel spécialisé dans la création d'articles de haute qualité, détaillés et bien structurés. Tu maîtrises parfaitement le format Markdown et tu fournis toujours du contenu approfondi, informatif et engageant."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,  # Slightly higher for more creativity
        max_tokens=4000,  # Increased for longer, more detailed articles
        top_p=0.95,
        frequency_penalty=0.3,  # Reduce repetitions
        presence_penalty=0.2    # Encourage diversity in topics
    )
    return response.choices[0].message.content

def extract_image_content(image_bytes: bytes, content_type: str) -> str:
    """
    Extract text and content from an image using GPT-4 Vision
    """
    # Encode image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # GPT-4 Vision
        messages=[
            {
                "role": "system",
                "content": "Tu es un expert en analyse d'images. Extrait et décris en détail tout le contenu textuel, les informations, les données, les diagrammes, et les concepts présents dans l'image. Fournis une description complète et structurée qui pourrait être utilisée pour générer un article approfondi."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyse cette image en détail et extrait tout le contenu pertinent (texte, données, concepts, informations visuelles). Fournis une description complète et structurée qui servira de base pour rédiger un article complet sur ce sujet."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{content_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=2000,
        temperature=0.3
    )

    return response.choices[0].message.content
