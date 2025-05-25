const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot be more than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  musicLibrary: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  musicIntro: {
    type: String,
    default: ''
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    default: []
  }]
});

module.exports = mongoose.model('User', UserSchema); 