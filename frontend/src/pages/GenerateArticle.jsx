import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Loader2, Sparkles, Image as ImageIcon, X } from 'lucide-react';

export default function GenerateArticle() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      toast.success('Image uploaded! Click Generate to extract content.');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!query.trim() && !uploadedImage) {
      toast.error('Please enter a topic or upload an image');
      return;
    }

    setLoading(true);
    setArticle(null);

    try {
      let finalQuery = query;

      // If image is uploaded, extract text from it first
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('image', uploadedImage);
        if (query.trim()) {
          formData.append('additional_context', query);
        }

        const extractResponse = await articlesAPI.extractImageContent(formData);
        finalQuery = extractResponse.data.extracted_text;
        toast.success('Image content extracted!');
      }

      const response = await articlesAPI.generate(finalQuery);
      setArticle(response.data.data.article);
      toast.success('Article generated successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate article';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    toast.success('Article saved to your library');
    navigate('/articles');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Article</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a topic and let AI generate a comprehensive article for you
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Article Topic
              </label>
              <textarea
                id="query"
                rows="3"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="e.g., The impact of artificial intelligence on healthcare..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Image Upload Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Upload an Image
              </label>

              {!imagePreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload an image</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={loading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-sm text-center text-gray-600">
                    Content will be extracted from this image
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (!query.trim() && !uploadedImage)}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadedImage ? 'Extracting & generating...' : 'Generating article...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Article
                </>
              )}
            </button>
          </form>
        </div>

        {/* Generated Article */}
        {article && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{article.query}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Generated on {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View in Library
              </button>
            </div>

            {/* Outline */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Outline</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {article.outline}
              </pre>
            </div>

            {/* Content */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Content</h3>
              <div className="prose max-w-none">
                <div
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {!article && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for better results:</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Be specific about your topic</li>
              <li>Include key points you want covered</li>
              <li>Mention the target audience if relevant</li>
              <li>Specify the desired tone (formal, casual, technical, etc.)</li>
              <li>Upload images containing text, diagrams, or infographics to extract content</li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
