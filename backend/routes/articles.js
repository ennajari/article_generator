import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { articleDb } from '../db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/articles/generate
// @desc    Generate a new article
// @access  Private
router.post('/generate', [
  body('query').trim().notEmpty().withMessage('Query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { query } = req.body;
    const startTime = Date.now();

    // Call Python API to generate article
    // For now, we'll create a placeholder since Python API needs to be set up
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

    let articleContent, outline, chunksUsed, pythonArticleId;

    try {
      // This will call your Python FastAPI endpoint
      const response = await axios.post(`${pythonApiUrl}/generate`, {
        query
      }, {
        timeout: 300000 // 5 minutes timeout for first request (model loading)
      });

      articleContent = response.data.content;
      outline = response.data.outline;
      chunksUsed = response.data.chunks_used;
      pythonArticleId = response.data.article_id; // Store Python API article ID for feedback
    } catch (error) {
      console.error('Python API error:', error.message);
      // Fallback for development
      articleContent = `# Article sur: ${query}\n\nCet article a été généré automatiquement.\n\n## Introduction\nDans cet article, nous allons explorer ${query}.\n\n## Développement\nLes points clés à retenir...\n\n## Conclusion\nEn conclusion...`;
      outline = `I. Introduction\nII. Développement\nIII. Conclusion`;
      chunksUsed = [];
      pythonArticleId = null;
    }

    const generationTime = Date.now() - startTime;

    // Save article to database
    const articleId = articleDb.create(
      req.user.id,
      query,
      articleContent,
      outline,
      {
        chunksUsed,
        model: 'gemini-pro',
        generationTime,
        pythonArticleId // Store for feedback submission
      }
    );

    const article = articleDb.findById(articleId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Article generated successfully',
      data: {
        article: {
          id: article.id,
          query: article.query,
          content: article.content,
          outline: article.outline,
          createdAt: article.created_at
        }
      }
    });
  } catch (error) {
    console.error('Generate article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate article'
    });
  }
});

// @route   GET /api/articles
// @desc    Get all articles for logged in user
// @access  Private
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const articles = articleDb.findByUserId(req.user.id, page, limit);
    const total = articleDb.count(req.user.id);

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
});

// @route   GET /api/articles/:id
// @desc    Get single article
// @access  Private
router.get('/:id', (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const article = articleDb.findById(articleId, req.user.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: { article }
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article'
    });
  }
});

// @route   PUT /api/articles/:id/feedback
// @desc    Add feedback to article and send to Data Flywheel
// @access  Private
router.put('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim(),
  body('improvements').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const articleId = parseInt(req.params.id);
    const article = articleDb.findById(articleId, req.user.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Save feedback to local database
    articleDb.addFeedback(
      articleId,
      req.user.id,
      req.body.rating,
      req.body.comments || null,
      req.body.improvements || []
    );

    // Send feedback to Python API Data Flywheel if pythonArticleId exists
    if (article.metadata?.pythonArticleId) {
      try {
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
        await axios.post(`${pythonApiUrl}/feedback`, {
          article_id: article.metadata.pythonArticleId,
          query: article.query,
          rating: req.body.rating,
          feedback_text: req.body.comments || '',
          improvements: req.body.improvements || []
        });
        console.log('✅ Feedback sent to Data Flywheel for learning');
      } catch (error) {
        console.error('❌ Failed to send feedback to Data Flywheel:', error.message);
        // Don't fail the request if Data Flywheel update fails
      }
    }

    const updatedArticle = articleDb.findById(articleId, req.user.id);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { article: updatedArticle }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// @route   DELETE /api/articles/:id
// @desc    Delete article
// @access  Private
router.delete('/:id', (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const deleted = articleDb.delete(articleId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
});

// @route   GET /api/articles/stats/overview
// @desc    Get user's article statistics
// @access  Private
router.get('/stats/overview', (req, res) => {
  try {
    const stats = articleDb.getStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
