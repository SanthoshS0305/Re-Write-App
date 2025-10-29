const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const modularSectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  startOffset: {
    type: Number,
    required: true,
  },
  endOffset: {
    type: Number,
    required: true,
  },
  variants: [variantSchema],
});

const dateTagSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  startOffset: {
    type: Number,
    required: true,
  },
  endOffset: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timelineId: String,
  note: String,
});

const characterOccurrenceSchema = new mongoose.Schema({
  characterId: String,
  positions: [Number],
});

const dialogueBlockSchema = new mongoose.Schema({
  startOffset: Number,
  endOffset: Number,
  characterId: String,
  confidence: Number,
});

const chapterSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    currentContent: {
      type: String,
      default: '',
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    revisions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Revision',
      },
    ],
    modularSections: [modularSectionSchema],
    dateTags: [dateTagSchema],
    characterOccurrences: [characterOccurrenceSchema],
    dialogueBlocks: [dialogueBlockSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster story chapter lookups
chapterSchema.index({ storyId: 1, position: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;

