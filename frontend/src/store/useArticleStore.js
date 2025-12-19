import { create } from 'zustand';
import axios from 'axios';

const useArticleStore = create((set, get) => ({
  articles: [],
  currentArticle: null,
  isLoading: false,
  stats: null,

  fetchArticles: async (page = 1, limit = 10) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`/api/articles?page=${page}&limit=${limit}`);

      if (response.data.success) {
        set({ articles: response.data.data.articles });
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch articles' };
    } finally {
      set({ isLoading: false });
    }
  },

  generateArticle: async (query) => {
    try {
      set({ isLoading: true });
      const response = await axios.post('/api/articles/generate', { query });

      if (response.data.success) {
        set({ currentArticle: response.data.data.article });
        get().fetchArticles(); // Refresh articles list
        return { success: true, data: response.data.data.article };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to generate article' };
    } finally {
      set({ isLoading: false });
    }
  },

  getArticle: async (id) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`/api/articles/${id}`);

      if (response.data.success) {
        set({ currentArticle: response.data.data.article });
        return { success: true, data: response.data.data.article };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch article' };
    } finally {
      set({ isLoading: false });
    }
  },

  submitFeedback: async (articleId, feedback) => {
    try {
      const response = await axios.put(`/api/articles/${articleId}/feedback`, feedback);

      if (response.data.success) {
        set({ currentArticle: response.data.data.article });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to submit feedback' };
    }
  },

  deleteArticle: async (articleId) => {
    try {
      const response = await axios.delete(`/api/articles/${articleId}`);

      if (response.data.success) {
        get().fetchArticles(); // Refresh list
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete article' };
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get('/api/articles/stats/overview');

      if (response.data.success) {
        set({ stats: response.data.data });
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch stats' };
    }
  },
}));

export default useArticleStore;
