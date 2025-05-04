from pydantic import BaseModel
from typing import List, Optional, Dict
import json
import os
from datetime import datetime

class UserFeedback(BaseModel):
    article_id: str
    query: str
    rating: int  # 1-5 rating
    feedback_text: Optional[str] = None
    improvements: List[str] = []
    timestamp: str = datetime.now().isoformat()

class Article(BaseModel):
    article_id: str
    query: str
    content: str
    outline: str
    chunks_used: List[str]
    timestamp: str = datetime.now().isoformat()
    feedback: Optional[UserFeedback] = None

class DataFlywheel:
    def __init__(self, storage_path: str = "data/flywheel"):
        self.storage_path = storage_path
        self.articles_path = f"{storage_path}/articles"
        self.feedback_path = f"{storage_path}/feedback"
        self.analytics_path = f"{storage_path}/analytics"
        self.ensure_directories()
        
    def ensure_directories(self):
        """Create necessary directories if they don't exist."""
        for path in [self.storage_path, self.articles_path, self.feedback_path, self.analytics_path]:
            os.makedirs(path, exist_ok=True)
    
    def save_article(self, article: Article):
        """Save generated article data for future analysis."""
        file_path = f"{self.articles_path}/{article.article_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(article.json())
        return article.article_id
    
    def save_feedback(self, feedback: UserFeedback):
        """Save user feedback for a generated article."""
        file_path = f"{self.feedback_path}/{feedback.article_id}.json"
        
        # Also update the article with this feedback
        article_path = f"{self.articles_path}/{feedback.article_id}.json"
        if os.path.exists(article_path):
            with open(article_path, "r", encoding="utf-8") as f:
                article_data = json.load(f)
            
            article_data["feedback"] = json.loads(feedback.json())
            
            with open(article_path, "w", encoding="utf-8") as f:
                json.dump(article_data, f, ensure_ascii=False, indent=2)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(feedback.json())
    
    def get_all_feedback(self) -> List[UserFeedback]:
        """Retrieve all saved feedback for analysis."""
        feedbacks = []
        for filename in os.listdir(self.feedback_path):
            if filename.endswith(".json"):
                with open(f"{self.feedback_path}/{filename}", "r", encoding="utf-8") as f:
                    feedback_data = json.load(f)
                    feedbacks.append(UserFeedback(**feedback_data))
        return feedbacks
    
    def get_all_articles(self) -> List[Article]:
        """Retrieve all saved articles for analysis."""
        articles = []
        for filename in os.listdir(self.articles_path):
            if filename.endswith(".json"):
                with open(f"{self.articles_path}/{filename}", "r", encoding="utf-8") as f:
                    article_data = json.load(f)
                    articles.append(Article(**article_data))
        return articles
    
    def generate_analytics(self):
        """Generate analytics based on collected data."""
        feedbacks = self.get_all_feedback()
        articles = self.get_all_articles()
        
        # Basic analytics
        analytics = {
            "total_articles": len(articles),
            "total_feedback": len(feedbacks),
            "average_rating": sum(f.rating for f in feedbacks) / len(feedbacks) if feedbacks else 0,
            "top_queries": self._get_top_queries(articles),
            "improvement_categories": self._categorize_improvements(feedbacks),
            "timestamp": datetime.now().isoformat()
        }
        
        # Save analytics
        file_path = f"{self.analytics_path}/analytics_{datetime.now().strftime('%Y%m%d')}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(analytics, f, ensure_ascii=False, indent=2)
        
        return analytics
    
    def _get_top_queries(self, articles: List[Article]) -> Dict[str, int]:
        """Identify most common query themes."""
        query_count = {}
        for article in articles:
            # Simplified approach - in a real system, you might use NLP to categorize queries
            words = article.query.lower().split()
            for word in words:
                if len(word) > 3:  # Skip short words
                    query_count[word] = query_count.get(word, 0) + 1
        
        # Return top 10 query words
        return dict(sorted(query_count.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _categorize_improvements(self, feedbacks: List[UserFeedback]) -> Dict[str, int]:
        """Categorize improvement suggestions."""
        categories = {}
        for feedback in feedbacks:
            for improvement in feedback.improvements:
                # Simple categorization - in a real system, use more sophisticated NLP
                if "accuracy" in improvement.lower():
                    categories["accuracy"] = categories.get("accuracy", 0) + 1
                elif "style" in improvement.lower() or "writing" in improvement.lower():
                    categories["style"] = categories.get("style", 0) + 1
                elif "structure" in improvement.lower() or "organization" in improvement.lower():
                    categories["structure"] = categories.get("structure", 0) + 1
                else:
                    categories["other"] = categories.get("other", 0) + 1
        
        return categories
    
    def get_training_data(self) -> List[Dict]:
        """Extract data suitable for fine-tuning or improving the models."""
        articles = self.get_all_articles()
        training_data = []
        
        for article in articles:
            if hasattr(article, 'feedback') and article.feedback:
                # Only include articles with high ratings for fine-tuning
                if article.feedback.rating >= 4:
                    training_data.append({
                        "query": article.query,
                        "outline": article.outline,
                        "content": article.content,
                        "chunks_used": article.chunks_used
                    })
        
        return training_data