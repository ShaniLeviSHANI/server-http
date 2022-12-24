const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { successResponse } = require('../utils/successResponse');
const { Profile } = require('../models/profiles');
const { authorize } = require('../middleware/auth');
const { User } = require('../models/users');

// @desc    Get all Profiles
// @route   GET /api/profiles/all
// @access  Public
const getProfiles = asyncHandler(async (req, res, next) => {
  const profiles = await Profile.find();
  return successResponse(req, res, { profiles: profiles });
});

// @desc    Get single profile
// @route   GET /api/profiles/
// @access  Private with token
const getProfile = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(
      new ErrorResponse(
        'you do not have profile, create profile for you before that',
        401
      )
    );
  }
  const profile = await Profile.findById(req.user.profile_id).populate('traineeOf', 'user _id avatar')
  return successResponse(req, res, profile);
});

const getAllTraineesProfile = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`Cannot get friend becuse you are trainee`, 400)
    );
  }
  const profile = await Profile.findById(req.user.profile_id) // .populate('meetings ended_meetings', 'date title activities urlRoom')
  let t = [];
  if (profile.trainerOf?.length != 0) {
    for (const i of profile.trainerOf) {
      let trainee_user = await User.findById(i);
      if (trainee_user?.profile_id) {
        const trainee_profile = await Profile.findById(trainee_user.profile_id) // .populate('meetings ended_meetings', 'date title activities urlRoom')
        t.push({ user: trainee_user, profile: trainee_profile })
      }
    }
    return successResponse(req, res, t);
  }
  else return next(
    new ErrorResponse('no profiles', 401)
  );
});


// @desc    Create new profile
// @route   POST /api/profiles/
// @access  Private with token
const createProfile = asyncHandler(async (req, res, next) => {
  let profile = null;

  if (req.user.profile_id) {
    profile = await Profile.findById(req.user.profile_id);
    if (profile && !req.params.id) {
      return next(
        new ErrorResponse('you have profile, you must not create another', 401)
      );
    }
  }
  profile = await Profile.create(req.body);

  if (req.params.id) {
    return profile;
  } else if (profile) {
    let data = await User.findByIdAndUpdate(req.user._id, {
      profile_id: profile._id
    });
    if (data) {
      successResponse(req, res, profile);
    } else {
      return next(new ErrorResponse('call error', 501));
    }
  }
});

// @desc    Update profile
// @route   PUT /api/profiles/
// @access  Private with token
const updateProfile = asyncHandler(async (req, res, next) => {
  req.body.updateAt = Date.now();
  let profile = await Profile.findById(req.user.profile_id);
  if (profile) {
    let updated = await Profile.updateOne({ _id: profile._id }, req.body);
    if (updated) {
      return successResponse(req, res, req.body);
    } else {
      return next(new ErrorResponse('call error', 501));
    }
  }
});

// @desc    Delete profile
// @route   DELETE /api/profiles/
// @access  Private with token
const deleteProfile = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`you cannot delete yourself, you are trainee`, 401)
    );
  }
  //when user has profile
  if (req.user.profile_id) {
    //clear profile elemet in user modle
    let profile_user = await User.updateOne({ profile_id: req.user.profile_id }, undefined)
    if (!profile_user)
      return next(new ErrorResponse(`set profie_id to undifined failed`, 402));

    // delete profile of user
    await Profile.deleteOne({ _id: req.user.profile_id }, (err, data) => {
      if (err) {
        return next(new ErrorResponse(`delete failed`, 400));
      }
      return successResponse(req, res, data);
    });
  }
  else
    return next(new ErrorResponse(`no profile id conected to this user`, 404));
});

// @desc    Delete profile
// @route   DELETE /api/profiles/trainee/:id
// @access  Private with token
const deleteTraineeProfile = asyncHandler(async (req, res, next) => {
  //chack me -if im valid 
  const profile = await Profile.findById(req.user.profile_id);
  //chack the the user-trainee has a profile to delete 
  const trainee_profile = await User.findById(req.params.id);
  if (trainee_profile?.profile_id && profile) {
    let isAuthorize = await authorize(req.params.id, profile.trainerOf);
    if (!isAuthorize) return next(new ErrorResponse(`User is not authorize for chang deffrant user`, 403));

    let profile_user = await User.updateOne({ profile_id: trainee_profile._id }, undefined)
    if (!profile_user)
      return next(new ErrorResponse(`set profie_id to undifined failed`, 402));

    //when ok- delete user from db
    await Profile.deleteOne({ _id: trainee_profile.profile_id }, (err, data) => {
      if (err) {
        return next(new ErrorResponse(`delete failed`, 400));
      }
      return successResponse(req, res, data);
    });
  }
  else
    return next(new ErrorResponse(`no profile id conected to this user`, 404));
});

// @desc    Get profile
// @route   GET /api/profiles/trainee/:id
// @access  Private with token
const getTraineeProfile = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(
      new ErrorResponse(`Cannot get friend before create your trainees`, 400)
    );
  }
  else if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`Cannot get friend becuse you are trainee`, 400)
    );
  }
  const profile = await Profile.findById(req.user.profile_id);

  const trainee_user = await User.findById(req.params.id);
  if (trainee_user?.profile_id) {
    const trainee_profile = await Profile.findById(trainee_user.profile_id);
    if (trainee_profile) {
      let isAuthorize = await authorize(req.params.id, profile.trainerOf);
      if (!isAuthorize) return next(new ErrorResponse(`User is not authorize for chang deffrant user`, 403));
      else return successResponse(req, res, trainee_profile);
    }
  }
  else return new ErrorResponse(`must has a profile before!`, 404)
});

// @desc Create trainee profile
// @route POST /api/profiles/trainee/:id (id user)
// @access Private with token
const createTraineeProfile = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`Cannot create friend becuse you are trainee`, 400)
    );
  }
  let testExistUser = await User.findById(req.params.id);
  if (!testExistUser) {
    return next(
      new ErrorResponse(`The user not exist`, 404));
  }
  req.body.traineeOf = req.user._id;
  let profileFriend = await Profile.create(req.body);
  if (profileFriend) {
    try {
      let data = await User.findByIdAndUpdate(req.params.id, { profile_id: profileFriend._id });
      if (data) {
        data = await Profile.findByIdAndUpdate(req.user.profile_id, { $addToSet: { trainerOf: req.params._id } });
        if (data) {
          successResponse(req, res, profileFriend);
        }
        else return next(new ErrorResponse(`filed update trainer`), 402);
      }
      else return next(new ErrorResponse(`filed update trainee`), 402);
    }
    catch (e) {
      return next(new ErrorResponse(`error catch`, 402))
    }
  }
});

// @desc Update trainee profile
// @route PUT /api/profiles/trainee/:id (id user)
// @access Private with token
const updateTraineeProfile = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`Cannot update friend becuse you are trainee`, 400)
    );
  }
  let testExistUser = await User.findById(req.params.id);
  if (!testExistUser) {
    return next(new ErrorResponse(`The user with id: ${req.params.id} does not exist`, 404));
  }
  const myProfile = await Profile.findById(req.user.profile_id);
  const trainerOf = myProfile.trainerOf;
  let isAuthorize = await authorize(req.params.id, trainerOf);
  if (!isAuthorize)
    return next(new ErrorResponse(`User is not authorize`, 403));

  req.body.updateAt = Date.now();

  if (testExistUser?.profile_id) {
    let updated = await Profile.findByIdAndUpdate(testExistUser.profile_id, req.body);
    if (updated) return successResponse(req, res, req.body);
    else return next(new ErrorResponse('call error', 501));
  }
  else return next(new ErrorResponse('profile not found', 40));

});

module.exports = {
  getProfiles,
  getAllTraineesProfile,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  deleteTraineeProfile,
  getTraineeProfile,
  createTraineeProfile,
  updateTraineeProfile,
};
