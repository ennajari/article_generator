import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import { FileText, PlusCircle, Star, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        articlesAPI.getStats(),
        articlesAPI.getAll(1, 5)
      ]);

      setStats(statsRes.data.data);
      setRecentArticles(articlesRes.data.data.articles);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link
            to="/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Generate Article
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Articles</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.totalArticles || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Rating</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.averageRating || '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">With Feedback</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.articlesWithFeedback || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Articles</h3>

            {recentArticles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No articles yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by generating your first article.
                </p>
                <div className="mt-6">
                  <Link
                    to="/generate"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Generate Article
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.id}`}
                    className="block hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{article.query}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {article.rating && (
                        <div className="flex items-center ml-4">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">{article.rating}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}

                <div className="text-center pt-4">
                  <Link
                    to="/articles"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View all articles →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
