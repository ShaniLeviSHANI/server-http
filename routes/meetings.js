const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getCustomActivities,
  getFutureMeetings,
  getActiveMeeting,
  getComplitedMeetings
} = require('../controllers/meetings');

router
  .route('/future')
  .get(protect, getFutureMeetings);
router
  .route('/')
  .get(protect, getMeetings)
  .post(protect, createMeeting);
router
  .route('/:id')
  .get(protect, getMeeting)
  .put(protect, updateMeeting)
  .delete(protect, deleteMeeting);
router
  .route('/ouractivities/:id') //traniee id
  .get(protect, getCustomActivities)
router
  .route('/meeting/active')
  .get(protect, getActiveMeeting)
router
  .route('/complited/not-active')
  .get(protect, getComplitedMeetings)

module.exports = router;
