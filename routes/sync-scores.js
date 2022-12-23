const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
    getAllSyncScores,
    getSyncScores,
    getSyncScore,
    createSyncScore,
    updateSyncScore,
    deleteSyncScore,
} = require('../controllers/sync-scores');

router
    .route('/All')
    .get(getAllSyncScores)
router
    .route('/')
    .put(protect, createSyncScore);
router
    .route('/:id') //id of meeting
    .get(getSyncScores)
    .put(protect, updateSyncScore)
    .delete(protect, deleteSyncScore);

module.exports = router;
