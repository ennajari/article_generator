import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const dataDir = join(__dirname, '../data');
const usersFile = join(dataDir, 'users.json');
const articlesFile = join(dataDir, 'articles.json');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize JSON files
const initFile = (filepath, defaultData = []) => {
  if (!existsSync(filepath)) {
    writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(usersFile, []);
initFile(articlesFile, []);

// Read/Write helpers
const readJSON = (filepath) => {
  try {
    return JSON.parse(readFileSync(filepath, 'utf8'));
  } catch {
    return [];
  }
};

const writeJSON = (filepath, data) => {
  writeFileSync(filepath, JSON.stringify(data, null, 2));
};

// User operations
export const userDb = {
  create: (username, email, password, fullName = '') => {
    const users = readJSON(usersFile);
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      full_name: fullName,
      role: 'user',
      is_active: 1,
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(usersFile, users);
    return newUser.id;
  },

  findByUsername: (username) => {
    const users = readJSON(usersFile);
    return users.find(u => u.username === username);
  },

  findById: (id) => {
    const users = readJSON(usersFile);
    return users.find(u => u.id === id);
  },

  findByEmail: (email) => {
    const users = readJSON(usersFile);
    return users.find(u => u.email === email);
  },

  updateLastLogin: (id) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === id);
    if (user) {
      user.last_login = new Date().toISOString();
      writeJSON(usersFile, users);
    }
  },

  updateProfile: (id, data) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === id);
    if (user) {
      if (data.fullName !== undefined) user.full_name = data.fullName;
      if (data.email !== undefined) user.email = data.email;
      user.updated_at = new Date().toISOString();
      writeJSON(usersFile, users);
    }
  },

  updatePassword: (id, newPassword) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === id);
    if (user) {
      user.password = bcrypt.hashSync(newPassword, 10);
      user.updated_at = new Date().toISOString();
      writeJSON(usersFile, users);
    }
  },

  comparePassword: (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  },

  findAll: () => {
    const users = readJSON(usersFile);
    // Remove passwords from all users
    return users.map(({ password, ...user }) => user);
  }
};

// Article operations
export const articleDb = {
  create: (userId, query, content, outline, metadata = {}) => {
    const articles = readJSON(articlesFile);

    const newArticle = {
      id: articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1,
      user_id: userId,
      query,
      content,
      outline,
      chunks_used: JSON.stringify(metadata.chunksUsed || []),
      model: metadata.model || 'gemini-pro',
      generation_time: metadata.generationTime || 0,
      metadata: metadata, // Store additional metadata including pythonArticleId
      rating: null,
      feedback_comments: null,
      feedback_improvements: null,
      feedback_submitted_at: null,
      is_public: 0,
      tags: null,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    articles.push(newArticle);
    writeJSON(articlesFile, articles);
    return newArticle.id;
  },

  findById: (id, userId) => {
    const articles = readJSON(articlesFile);
    const article = articles.find(a => a.id === id && a.user_id === userId);
    if (article) {
      article.chunks_used = JSON.parse(article.chunks_used || '[]');
      article.feedback_improvements = JSON.parse(article.feedback_improvements || '[]');
    }
    return article;
  },

  findByUserId: (userId, page = 1, limit = 10) => {
    const articles = readJSON(articlesFile);
    const userArticles = articles
      .filter(a => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const start = (page - 1) * limit;
    return userArticles.slice(start, start + limit).map(a => ({
      id: a.id,
      user_id: a.user_id,
      query: a.query,
      outline: a.outline,
      rating: a.rating,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at
    }));
  },

  count: (userId) => {
    const articles = readJSON(articlesFile);
    return articles.filter(a => a.user_id === userId).length;
  },

  addFeedback: (id, userId, rating, comments, improvements) => {
    const articles = readJSON(articlesFile);
    const article = articles.find(a => a.id === id && a.user_id === userId);
    if (article) {
      article.rating = rating;
      article.feedback_comments = comments;
      article.feedback_improvements = JSON.stringify(improvements);
      article.feedback_submitted_at = new Date().toISOString();
      article.updated_at = new Date().toISOString();
      writeJSON(articlesFile, articles);
    }
  },

  delete: (id, userId) => {
    const articles = readJSON(articlesFile);
    const index = articles.findIndex(a => a.id === id && a.user_id === userId);
    if (index !== -1) {
      articles.splice(index, 1);
      writeJSON(articlesFile, articles);
      return true;
    }
    return false;
  },

  getStats: (userId) => {
    const articles = readJSON(articlesFile);
    const userArticles = articles.filter(a => a.user_id === userId);
    const withFeedback = userArticles.filter(a => a.rating !== null);
    const avgRating = withFeedback.length > 0
      ? withFeedback.reduce((sum, a) => sum + a.rating, 0) / withFeedback.length
      : 0;

    return {
      totalArticles: userArticles.length,
      articlesWithFeedback: withFeedback.length,
      averageRating: avgRating.toFixed(2)
    };
  }
};

export default { userDb, articleDb };
