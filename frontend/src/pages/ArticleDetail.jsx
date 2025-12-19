import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { exportToPDF, exportToDOCX } from '../services/export';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Trash2, Star, MessageSquare } from 'lucide-react';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 5,
    comments: '',
    improvements: []
  });

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await articlesAPI.getById(parseInt(id));
      setArticle(response.data.data.article);

      // Check if feedback already exists
      if (response.data.data.article.rating) {
        setShowFeedback(false);
      }
    } catch (error) {
      toast.error('Failed to load article');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await articlesAPI.delete(parseInt(id));
      toast.success('Article deleted successfully');
      navigate('/articles');
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        exportToPDF(article);
        toast.success('PDF exported successfully!');
      } else if (format === 'docx') {
        await exportToDOCX(article);
        toast.success('DOCX exported successfully!');
      }
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    try {
      await articlesAPI.addFeedback(parseInt(id), feedback);
      toast.success('Feedback submitted successfully!');
      setShowFeedback(false);
      fetchArticle();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const improvementOptions = [
    'Accuracy',
    'Depth',
    'Structure',
    'Clarity',
    'Examples',
    'Citations'
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Article not found</h2>
          <Link to="/articles" className="text-indigo-600 hover:text-indigo-500 mt-4 inline-block">
            Back to Articles
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/articles"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export DOCX
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white shadow rounded-lg p-8">
          {/* Title & Meta */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{article.query}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Created: {new Date(article.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Model: {article.model}</span>
              {article.generation_time && (
                <>
                  <span>•</span>
                  <span>Generated in {(article.generation_time / 1000).toFixed(2)}s</span>
                </>
              )}
            </div>
            {article.rating && (
              <div className="flex items-center mt-3">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1 text-lg font-semibold text-gray-900">{article.rating}/5</span>
              </div>
            )}
          </div>

          {/* Content with Markdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content</h2>
            <div className="prose prose-indigo max-w-none">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </div>

          {/* Existing Feedback Display */}
          {article.feedback_comments && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Your Feedback
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{article.feedback_comments}</p>
                {article.feedback_improvements && article.feedback_improvements.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested improvements:</p>
                    <div className="flex flex-wrap gap-2">
                      {article.feedback_improvements.map((imp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {imp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Form */}
        {!article.rating && !showFeedback && (
          <div className="bg-white shadow rounded-lg p-6">
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Star className="w-5 h-5 mr-2" />
              Rate This Article
            </button>
          </div>
        )}

        {showFeedback && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rate This Article</h3>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, rating })}
                      className={`p-2 rounded-lg transition-colors ${
                        feedback.rating >= rating
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  rows="4"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Share your thoughts about this article..."
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Improvements (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {improvementOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const improvements = feedback.improvements.includes(option)
                          ? feedback.improvements.filter((i) => i !== option)
                          : [...feedback.improvements, option];
                        setFeedback({ ...feedback, improvements });
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        feedback.improvements.includes(option)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}