const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  primaryName: {
    type: String,
    required: true,
  },
  aliases: [String],
  shortcuts: [
    {
      type: { type: String, enum: ['key', 'text'] },
      trigger: String,
      replacesWithAlias: String,
    },
  ],
  color: {
    type: String,
    default: '#3b82f6',
  },
});

const timelineSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
});

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Story title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    characters: [characterSchema],
    timelines: [timelineSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster user story lookups
storySchema.index({ userId: 1, createdAt: -1 });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;

