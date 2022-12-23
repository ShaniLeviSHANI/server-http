const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
    getAllSyncs,
    createMeetingSync,
    getMySyncs,
    getTopSyncs,
    getTraineesSync,
} = require('../controllers/sync-info');

router
    .route('/all')
    .get(getAllSyncs)
router
    .route('/')
    .post(protect, createMeetingSync)
    .get(protect, getMySyncs)
router
    .route('/topSync/:level') //level = high/low
    .get(protect, getTopSyncs)
router
    .route('/trainess') //id of trainee
    .get(protect, getTraineesSync);

module.exports = router;
