const mongoose = require('mongoose');

// Base variant schema
const variantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

// For text sections: variants have content
const textVariantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  content: {
    type: String,
    required: true,
  },
});

// Recursive section schema - defined as Schema.Types.Mixed initially, then enhanced
const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'container'],
    required: true,
  },
  isModular: {
    type: Boolean,
    default: false,
  },
  // For text sections
  content: { type: String },
  textVariants: [textVariantSchema],
  // For container sections
  children: [mongoose.Schema.Types.Mixed],
  containerVariants: [mongoose.Schema.Types.Mixed],
});

// Enable recursive reference
sectionSchema.add({ children: [sectionSchema] });

// For container variants: each has its own children array
const containerVariantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  children: [mongoose.Schema.Types.Mixed],
});

containerVariantSchema.add({ children: [sectionSchema] });

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
    modularSections: [sectionSchema], // Keep for backward compatibility during migration
    sections: [sectionSchema], // New sections array
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

