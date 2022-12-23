const express = require('express');
const { protect } = require('../middleware/auth');

const { getProfiles, getProfile, createProfile, updateProfile, deleteProfile,
      getTraineeProfile, createTraineeProfile, updateTraineeProfile, deleteTraineeProfile,
      getAllTraineesProfile,
} = require('../controllers/profiles');
const router = express.Router();

router
      .route('/all')
      .get(getProfiles);
router
      .route('/')
      .get(protect, getProfile)
      .post(protect, createProfile)
      .put(protect, updateProfile)
      .delete(protect, deleteProfile);
router
      .route('/trinees/all')
      .get(protect, getAllTraineesProfile)
router
      .route('/trainee/:id')
      .get(protect, getTraineeProfile)
      .post(protect, createTraineeProfile)
      .put(protect, updateTraineeProfile)
      .delete(protect, deleteTraineeProfile);

module.exports = router;
