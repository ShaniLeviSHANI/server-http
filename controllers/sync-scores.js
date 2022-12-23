const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { successResponse } = require('../utils/successResponse');
const { SyncScore } = require('../models/sync-scores');

// @desc    Get all syncscore
// @route   GET /api/syncscores/All
// @access  Public
const getAllSyncScores = asyncHandler(async (req, res, next) => {
  const syncscores = await SyncScore.find();
  return successResponse(req, res, { syncscores });
});

// @desc    Get all syncscore
// @route   GET /api/syncscores/
// @access  Public
const getSyncScores = asyncHandler(async (req, res, next) => {
  const syncscores = await SyncScore.find({ meeting_id: req.params.id })
    .populate('meeting_id', 'title tariner trainee date activities')
    .sort({ time: 1 });
  return successResponse(req, res, syncscores);
});

// @desc    Get single syncscore
// @route   GET /api/syncscores/:id
// @access  Private with token
const getSyncScore = asyncHandler(async (req, res, next) => {
  const syncscore = await SyncScore.findOne({ id: req.params.id });
  return successResponse(req, res, { syncscore });
});

// @desc    Create new syncscore
// @route   POST /api/syncscores/
// @access  Private with token
const createSyncScore = asyncHandler(async (req, res, next) => {
  const syncscore = await SyncScore.create(req.body);
  return successResponse(req, res, syncscore);
});

// @desc    Update syncscore
// @route   PUT /api/syncscores/:id
// @access  Private with token
const updateSyncScore = asyncHandler(async (req, res, next) => {
  let data = await SyncScore.updateOne({ id: req.params.id }, req.body);
  return successResponse(req, res, { data });
});

// @desc    Delete syncscore
// @route   DELETE /api/syncscores/:id
// @access  Private with token
const deleteSyncScore = asyncHandler(async (req, res, next) => {
  SyncScore.deleteOne({ id: req.params.id }, (err, data) => {
    if (err) {
      return next(new ErrorResponse(`delete failed`, 400));
    }
    return successResponse(req, res, { data });
  });
});

module.exports = {
  getAllSyncScores,
  getSyncScores,
  getSyncScore,
  createSyncScore,
  updateSyncScore,
  deleteSyncScore
};
