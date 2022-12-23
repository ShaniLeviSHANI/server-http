const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { successResponse } = require('../utils/successResponse');
const { SyncPerformance } = require('../models/sync-info');
const { Meeting } = require('../models/meetings');
const { User } = require('../models/users');
const { Profile } = require('../models/profiles');


// @desc    Get all syncs
// @route   GET /api/syncperformance/all
// @access  Public
const getAllSyncs = asyncHandler(async (req, res, next) => {
    const syncPerformance = await SyncPerformance.find().sort({ dateEnd: -1 })
    if (syncPerformance) return successResponse(req, res, syncPerformance);
    else return next(new ErrorResponse(`Not found results`, 404));
});

// @desc    Create new syncperformance
// @route   POST /api/syncperformance/
// @access  Private with token && only trainee
const createMeetingSync = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return next(
            new ErrorResponse('only trainer can create', 401)
        );
    }

    const meeting = await Meeting.findById(req.body.meeting_id);
    if (meeting) {
        req.body.dateEnd = meeting.dateEnd ? meeting.dateEnd : nulll;
        req.body.trainee = meeting.trainee;
        req.body.trainer = req.user._id;
    }

    const syncscore = await SyncPerformance.create(req.body);
    return successResponse(req, res, syncscore);
});


const getMySyncs = asyncHandler(async (req, res, next) => {
    let syncPerformance = null;
    if (req.user.role === 'trainer') syncPerformance = await SyncPerformance.find({ trainer: req.user._id }).sort({ dateEnd: -1 });
    else syncPerformance = await SyncPerformance.find({ trainee: req.user._id }).sort({ dateEnd: -1 })
    if (syncPerformance.length !== 0) return successResponse(req, res, syncPerformance);
    else return next(new ErrorResponse(`Not found results`, 404));
});

const getTopSyncs = asyncHandler(async (req, res, next) => {
    let syncPerformance = null;
    if (req.params.level === 'high')
        syncPerformance = await SyncPerformance.find().sort({ totalAvg: -1 });
    else if (req.params.level === 'low')
        syncPerformance = await SyncPerformance.find().sort({ totalAvg: 1 });

    if (syncPerformance) return successResponse(req, res, syncPerformance);
    else return next(new ErrorResponse(`Not found results`, 404));
});

const getTraineesSync = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'trainer' || !req.user.profile_id) {
        return next(
            new ErrorResponse('only trainer can create', 401)
        );
    }

    let friends = [];
    const profile = await Profile.findById(req.user.profile_id);
    const trainerOf = profile.trainerOf;
    if (trainerOf.length > 0) {
        for (var i = 0; i < trainerOf.length; i++) {
            let id = trainerOf[i];
            let user = await User.findById(id);
            let syncs = await SyncPerformance.find({ trainee: id });
            friends.push({ user, syncs });
        }
    }
    return successResponse(req, res, friends);
});

module.exports = {
    getAllSyncs,
    getMySyncs,
    getTopSyncs,
    createMeetingSync,
    getTraineesSync,
};
