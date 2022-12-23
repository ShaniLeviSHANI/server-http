const mongoose = require('mongoose');
const body_areas = ['arms', 'abdomen', 'legs_knees', 'lower_back', 'upper_back', 'none']

const profileSchema = new mongoose.Schema({
  name: { type: String, },
  relation: { type: String },
  address: { type: String },
  phone: { type: String },
  city: { type: String },
  contry: { type: String },
  age: { type: String },
  gender: { type: String },
  about: { type: String },
  hobbies: { type: String },
  trainerOf: [
    {
      //Indicates of the user-manager of trainee user who craeted by this.user._id (i can open user to my grama & naibar)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }
  ],
  traineeOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  limitations: [{
    type: String,
    enum: body_areas,
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updateAt: {
    type: Date,
    default: Date.now
  }
});

const Profile = mongoose.model('profiles', profileSchema);
module.exports = { Profile };
