const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    },
    settings: {
      elephantAliasingEnabled: { type: Boolean, default: true },
      ribbonEnabled: { type: Boolean, default: true },
      ribbonPosition: { type: String, enum: ['left', 'right'], default: 'right' },
      characterHighlightEnabled: { type: Boolean, default: true },
      dialogueTrackingEnabled: { type: Boolean, default: true },
      searchHighlightEnabled: { type: Boolean, default: true },
      timelineMarkersEnabled: { type: Boolean, default: true },
      timelineFeaturesEnabled: { type: Boolean, default: true },
      editorTheme: { type: String, default: 'light' },
      fontSize: { type: Number, default: 16 },
      fontFamily: { type: String, default: 'Georgia' },
    },
  },
  {
    timestamps: true,
  }
);

// Note: email index is automatically created by unique: true
// No need for additional index definition

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Don't return password hash in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

