"""
FastAPI server for article generation
Connects CrewAI article generator with Node.js backend
"""
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from crew.crew import ArticleCrew
from flywheel.data_flywheel import DataFlywheel, Article as FlywheelArticle, UserFeedback
import uuid
from datetime import datetime
from tools.gemini import extract_image_content
from typing import Optional

app = FastAPI(title="Article Generator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ArticleRequest(BaseModel):
    query: str

class ArticleResponse(BaseModel):
    article_id: str
    content: str
    outline: str
    chunks_used: list = []

class FeedbackRequest(BaseModel):
    article_id: str
    query: str
    rating: int  # 1-5
    feedback_text: str = ""
    improvements: list = []

# Initialize Data Flywheel (lightweight)
data_flywheel = DataFlywheel(storage_path="data/flywheel")

# ArticleCrew will be initialized on first request (lazy loading to avoid startup delay)
article_crew = None
DOCS_PATH = "data/documents"

def get_article_crew():
    """Lazy initialization of ArticleCrew to avoid slow startup"""
    global article_crew
    if article_crew is None:
        print(" Initializing ArticleCrew (first request)...")
        article_crew = ArticleCrew(docs_path=DOCS_PATH)
        print(" ArticleCrew initialized")
    return article_crew

@app.get("/")
async def root():
    return {"message": "Article Generator API is running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/generate", response_model=ArticleResponse)
async def generate_article(request: ArticleRequest):
    """
    Generate an article based on the query with Data Flywheel tracking
    """
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        print(f" Generating article for query: {request.query}")

        # Run the crew to generate the article (lazy load crew)
        crew = get_article_crew()
        result = crew.run(request.query)

        # Extract content and outline from result
        content = result.get('content', '')
        outline = result.get('outline', '')
        chunks_used = result.get('chunks_used', [])

        # Generate unique article ID
        article_id = str(uuid.uuid4())

        # Save to Data Flywheel for learning
        flywheel_article = FlywheelArticle(
            article_id=article_id,
            query=request.query,
            content=content,
            outline=outline,
            chunks_used=chunks_used,
            timestamp=datetime.now().isoformat()
        )
        data_flywheel.save_article(flywheel_article)
        print(f" Article saved to Data Flywheel: {article_id}")

        return ArticleResponse(
            article_id=article_id,
            content=content,
            outline=outline,
            chunks_used=chunks_used
        )

    except Exception as e:
        print(f" Error generating article: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate article: {str(e)}")

@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit user feedback for an article to improve the Data Flywheel
    """
    try:
        print(f" Receiving feedback for article: {request.article_id}")

        # Create feedback object
        feedback = UserFeedback(
            article_id=request.article_id,
            query=request.query,
            rating=request.rating,
            feedback_text=request.feedback_text,
            improvements=request.improvements,
            timestamp=datetime.now().isoformat()
        )

        # Save feedback to Data Flywheel
        data_flywheel.save_feedback(feedback)
        print(f" Feedback saved. Rating: {request.rating}/5")

        # Trigger learning from feedback (every 10 feedback items)
        all_feedback = data_flywheel.get_all_feedback()
        if len(all_feedback) % 10 == 0:
            print(f" Learning from {len(all_feedback)} feedback items...")
            crew = get_article_crew()
            crew.learn_from_feedback([f.dict() for f in all_feedback])

            # Generate analytics
            analytics = data_flywheel.generate_analytics()
            print(f" Analytics updated: Avg rating {analytics['average_rating']:.2f}/5")

        return {
            "success": True,
            "message": "Feedback received and processed",
            "total_feedback": len(all_feedback)
        }

    except Exception as e:
        print(f"Error processing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")

@app.get("/analytics")
async def get_analytics():
    """
    Get analytics from the Data Flywheel
    """
    try:
        analytics = data_flywheel.generate_analytics()
        return analytics
    except Exception as e:
        print(f" Error generating analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")

@app.post("/extract-image")
async def extract_from_image(
    image: UploadFile = File(...),
    additional_context: Optional[str] = Form(None)
):
    """
    Extract text content from an uploaded image using Gemini Vision
    """
    try:
        print(f" Extracting content from image: {image.filename}")

        # Read image bytes
        image_bytes = await image.read()

        # Extract content using Gemini Vision
        extracted_text = extract_image_content(image_bytes, image.content_type)

        # Combine with additional context if provided
        if additional_context and additional_context.strip():
            final_text = f"{additional_context}\n\nContenu extrait de l'image:\n{extracted_text}"
        else:
            final_text = extracted_text

        print(f" Successfully extracted {len(extracted_text)} characters")

        return {
            "success": True,
            "extracted_text": final_text,
            "image_name": image.filename
        }

    except Exception as e:
        print(f" Error extracting image content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract image content: {str(e)}")

if __name__ == "__main__":
    print("Starting Article Generator API on http://localhost:8000")
    print(" Data Flywheel enabled for continuous learning")
    print(" Image content extraction enabled (Gemini Vision)")
    uvicorn.run(app, host="0.0.0.0", port=8000)