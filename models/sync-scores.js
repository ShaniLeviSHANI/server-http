const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const syncscoreSchema = new mongoose.Schema({
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'meetings',
  },
  result: {
    type: String,
    required: true
  },
  time: {
    type: String,
  },
  activity: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});


const SyncScore = mongoose.model('syncscores', syncscoreSchema);
module.exports = { SyncScore };