import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  outline: {
    type: String
  },
  metadata: {
    chunksUsed: [String],
    model: String,
    generationTime: Number
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    improvements: [String],
    submittedAt: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
articleSchema.index({ userId: 1, createdAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ isPublic: 1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
