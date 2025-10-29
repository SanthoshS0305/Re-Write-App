const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: 'Auto-saved revision',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    // Snapshot of chapter metadata
    characterOccurrences: [
      {
        characterId: String,
        positions: [Number],
      },
    ],
    dialogueBlocks: [
      {
        startOffset: Number,
        endOffset: Number,
        characterId: String,
        confidence: Number,
      },
    ],
    dateTags: [
      {
        id: String,
        startOffset: Number,
        endOffset: Number,
        date: Date,
        timelineId: String,
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster chapter revision lookups
revisionSchema.index({ chapterId: 1, timestamp: -1 });

// Calculate word count before saving
revisionSchema.pre('save', function (next) {
  if (this.content) {
    this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  }
  next();
});

const Revision = mongoose.model('Revision', revisionSchema);

module.exports = Revision;

