//File to video
const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  name: {
    type: String
  },
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'meetings',
  },
  array_sync_time:[{
    type: Date, 
  }],
  url: {
    type: String
  }
});

const Recording = mongoose.model('recordings', recordingSchema);
module.exports = { Recording };
