const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  generationParams: {
    prompt: String,
    duration: Number,
    output_format: String,
    steps: Number,
    cfg_scale: Number,
    strength: Number,
    seed: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Music', musicSchema); 