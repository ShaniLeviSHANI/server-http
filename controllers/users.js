const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { createToken } = require('../utils/tokenResponse');
const { successResponse } = require('../utils/successResponse');
const { User } = require('../models/users');
const { Profile } = require('../models/profiles');
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');
const crypto = require('crypto');
const { authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const s3 = require('../utils/S3');
const { v4: uuid } = require('uuid');

// @desc    Get all users
// @route   GET /api/users/all
// @access  Public
const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  return successResponse(req, res, { users: users });
});

// @desc    Get all user with query
// @route   GET /api/users/search?password[lte]=1000 ,api/users/search?password[lte]=1000&user[gt]=1010 ,/api/users/search?user=shani
// @route   GET /api/users/search?selct=val1,val2,val3, /api/users/search?selct=user,email
// @route   GET /api/users/search?selct=user,email&sort=-user (in sort field minous or not - This reverses the sort order)
// @access  Public
const searchUserByQuery = asyncHandler(async (req, res, next) => {
  let query;
  // Copy req.query
  let reqQuery = { ...req.query };
  //Fielde to exclude
  const removeFields = ['selct', 'sort'];
  // Loop over removeField and delete them from the reqQuery
  removeFields.forEach((pram) => delete reqQuery[pram]);
  // Create query string
  let querStr = JSON.stringify(req.query);
  // Create operators ($gt ,$gte etc)
  querStr = querStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`); //g refrisent glabal

  //Finding resorce
  query = User.find(JSON.parse(querStr));

  //Select Fields
  if (req.query.select) {
    const fieldes = req.query.select.split(',').join(' ');
    query = query.select(fieldes);
  }
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  //Executing
  const data = await query;
  successResponse(req, res, {
    success: true,
    count: data.length,
    data: data
  });
});

// @desc    Get single user
// @route   GET /api/users/
// @access  Privit with token
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req._id);
  return successResponse(req, res, user);
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Pablic
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`user not found by id of: ${req.params.id}`, 404)
    );
  }
  return successResponse(req, res, user);
});

// @desc    Create new user
// @route   POST /api/users/
// @access  Pablic
const createUser = asyncHandler(async (req, res, next) => {
  //Defines the level of encryption
  let salt = await bcrypt.genSalt(Number(process.env.SALT_KEY));
  req.body.password = await bcrypt.hash(req.body.password, salt);
  //Create avater for photo:
  const avatar = gravatar.url(req.body.email, {
    s: '200',
    r: 'pg',
    d: 'mm'
  });
  req.body.avatar = avatar;

  //when logedIn user creating a friemd - it is an trainee friend.
  if (req.user) {
    req.body.role = 'trainee';
  }

  const user = await User.create(req.body);
  if (req.body.role === 'trainee') {
    return user;
  } else {
    successResponse(req, res, user);
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Pablic
const loginUser = asyncHandler(async (req, res, next) => {
  //validation of elements needed for logIn
  if (!req.body.email && !req.body.username) {
    if (!req.body.password)
      return next(
        new ErrorResponse(`Please provid email/username and password`, 401)
      );
    return next(new ErrorResponse(`Please provid an email/username`, 401));
  }
  if (!req.body.password)
    return next(new ErrorResponse(`Please provid a password`, 401));

  // validation if user exists in db
  let user;
  if (req.body.email)
    user = await User.findOne({ email: req.body.email }).select('+password');
  else if (req.body.username)
    user = await User.findOne({ username: req.body.username }).select('+password');

  if (user) {
    // Checks if the password matches the user
    let validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return next(new ErrorResponse(`Password does not match`, 401));
    } else {
      return sendTokenResponse(user, 200, res);
    }
  } else {
    if (req.body.email)
      return next(
        new ErrorResponse(`user not found`, 404)
      );
    else if (req.body.username)
      return next(
        new ErrorResponse(
          `user not found`,
          404
        )
      );
  }
});

// @desc    Update user
// @route   PUT /api/users/
// @access  Private
const updateUser = asyncHandler(async (req, res, next) => {
  req.body.updateAt = Date.now();
  if (req.body.password) {
    //Defines the level of encryption
    let salt = await bcrypt.genSalt(Number(process.env.SALT_KEY));
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }
  if (req.body.img) {
    req.body.img = `https://sync-along-api.herokuapp.com/${req.file.filename}`;
    req.body.avatar = req.body.img;
  }

  let data = await User.updateOne({ _id: req.user.id }, req.body);
  if (!data) return new ErrorResponse(`faild to update`, 401);
  updateAvatar(req, res, next);
  return successResponse(req, res, 'update done!');
});

const updateAvatar = asyncHandler(async (req, res, next) => {
  // the Recording sent
  let myFile = req.file.originalname.split('.');
  // save the type file in the variable
  const typeMyFile = myFile[myFile.length - 1];
  const buffer = req.file.buffer;
  const key = `Avatars/${uuid()}.${typeMyFile}`;
  const bucket = process.env.AWS_BUCKET_NAME;
  await s3.write(buffer, key, bucket);
  const url = await s3.getSignedURL(process.env.AWS_BUCKET_NAME, key, 60);
  let data = await User.updateOne({ _id: req.user._id }, { avatar: url });
  if (data) return successResponse(req, res, url);
});

const updateAvatarTrainee = asyncHandler(async (req, res, next) => {
  let myFile = req.file.originalname.split('.');
  // save the type file in the variable
  const typeMyFile = myFile[myFile.length - 1];
  const buffer = req.file.buffer;
  const key = `Avatars/${uuid()}.${typeMyFile}`;
  const bucket = process.env.AWS_BUCKET_NAME;
  await s3.write(buffer, key, bucket);
  const url = await s3.getSignedURL(process.env.AWS_BUCKET_NAME, key, 60);
  let data = await User.updateOne({ _id: req.params.id }, { avatar: url });
  if (data) return successResponse(req, res, url);
});


// @desc    Delete single user
// @route   DELET /api/users/
// @access  Private
const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`you cannot delete yourself, you are trainee`, 401)
    );
  } else {
    //TO DO - delete your trainees (if i have any defens if i alrady have profile)
    const profile = await Profile.findById(req.user.profile_id);
    if (profile) {
      const trainerOf = profile.trainerOf;
      if (trainerOf.length > 0) {
        for (var i = 0; i < trainerOf.length; i++) {
          let id = trainerOf[i]; //user trainee
          req.params.id = id;
          //for now, don't do this, maybe has errors
          //await deleteFriend(req, res, next);
        }
      }

    }
    return successResponse(req, res, 'need fixing , not dose anything for now');

    //TO DO - delete all data related to this user._id in all colections in db
    // await User.deleteOne({ _id: req.user._id }, (err, data) => {
    //   if (err) {
    //     return next(new ErrorResponse(`delete failed`, 400));
    //   }
    //   return successResponse(req, res, { data });
    // });
  }
});


// @desc    get all friends
// @route   GET /api/users/trainer/alltrainee
//@access   Private
const getAllTrainees = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(
      new ErrorResponse(
        `Cannot create friend before create profile to your user`,
        400
      )
    );
  }
  if (req.user.role === 'trainee') {
    return next(
      new ErrorResponse(`Cannot get friend becuse you are trainee`, 400)
    );
  }
  let friends = [];
  const profile = await Profile.findById(req.user.profile_id);
  const trainerOf = profile.trainerOf;
  if (trainerOf.length > 0) {
    for (var i = 0; i < trainerOf.length; i++) {
      let id = trainerOf[i];
      console.log('id', id);
      let userTra = await User.findById(id);
      let profileTra = await Profile.findById(userTra.profile_id);
      friends.push({ userTra, profileTra });
    }
  }
  return successResponse(req, res, friends);
});


const getTrainee = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(new ErrorResponse(`Cannot create friend before create profile to your user`, 400));
  }
  else if (req.user.role === 'trainee') {
    return next(new ErrorResponse(`Cannot get friend becuse you are trainee`, 400));
  }
  const profile = await Profile.findById(req.user.profile_id);
  const trainerOf = profile.trainerOf;
  if (trainerOf.length > 0) {
    for (var i = 0; i < trainerOf.length; i++) {
      if (trainerOf[i] == req.params.id) {
        let userTra = await User.findById(req.params.id);
        let profileTra = await Profile.findById(userTra.profile_id);
        return successResponse(req, res, { user: userTra, profile: profileTra });
      }
    }
  }
  return next(new ErrorResponse(`the user don't have trainee with id: ${req.params.id}`, 401));
});

// @desc    Create a frind - trainee user with logIn-user account
// @route   POST /api/users/trainer/trainee
// @access  Private
const createTrainee = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(new ErrorResponse(`Cannot create friend before create profile to your user`, 402));
  }
  let userFriend = await createUser(req, res, next);
  const data = await Profile.findByIdAndUpdate(req.user.profile_id, { $addToSet: { trainerOf: userFriend._id } });
  if (userFriend) {
    return successResponse(req, res, userFriend);
  } else return next(new ErrorResponse(`failed to craete trainee user`, 400));
});

// @desc    Update trainee Friend
// @route   PUT /api/users/trainer/trainee/:id
// @access  Private
const updateTrainee = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(new ErrorResponse(`Cannot create friend before create profile to your user`, 400));
  }
  const profile = await Profile.findById(req.user.profile_id);
  const trainerOf = profile.trainerOf;
  let isAuthorize = await authorize(req.params.id, trainerOf);
  if (!isAuthorize)
    return next(new ErrorResponse(`User is not authorize`, 403));

  req.body.updateAt = Date.now();
  let data = await User.updateOne({ _id: req.params.id }, req.body);
  return successResponse(req, res, 'update done!');
});

// @desc    Delete trainee Friend from list
// @route   DELETE /api/users/trainer/trainee/:id
// @access  Private
// ****not tested****
const deleteTrainee = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(new ErrorResponse(`Cannot delete friend before create profile to your user`, 400));
  }
  const profile = await Profile.findById(req.user.profile_id);
  const trainerOf = profile.trainerOf;
  let isAuthorize = await authorize(req.params.id, trainerOf);
  if (!isAuthorize)
    return next(new ErrorResponse(`User is not authorize`, 403));

  //delete from the array of user thet crared
  //!!!!Remeber!!!!! in client-side need a pop-up saying to the user all documents,video and activity with this user._id will be deleted.
  //If they will not be deleted the server may call a non-existent _id and throw an Error while trying to get simple data from db
  const objId = new ObjectId(req.params.id);
  let data = await Profile.findOneAndUpdate(
    { _id: req.user.profile_id },
    { $pull: { trainerOf: objId } }
  );
  if (data) {
    const user = await User.findById(objId);
    await User.deleteOne({ _id: user._id });
    await Profile.deleteOne({ _id: user.profile_id });
  }

  return successResponse(req, res, `delete all data for user with id: ${req.params.id}`);
});


// @desc    get my trainer
// @route   GET /api/users/trainee/mytrainer
//@access   Private
const getMyTrainer = asyncHandler(async (req, res, next) => {
  if (!req.user.profile_id) {
    return next(
      new ErrorResponse(`Cannot get you trainer before create profile to yourseif`, 400));
  } else if (req.user.role === 'trainer') {
    return next(new ErrorResponse(`you are not trainee, you do not have trainer`, 400));
  }
  const profile = await Profile.findById(req.user.profile_id);
  const traineeOf = profile.traineeOf;
  const traineeUser = await User.findById(traineeOf);
  const traineeProfile = await Profile.findById(traineeUser.profile_id);
  successResponse(req, res, {
    user: traineeUser,
    profile: traineeProfile
  });
});

/*******************************************************************************************/
// @desc    forgat password
// @route   PUT /api/users/forgatPassword
// @access  Pablic
const forgatPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new ErrorResponse('There is no user with that email', 404));

  const resetToken = user.getResetPasswordToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });
    successResponse(req, res, {
      success: true,
      data: 'Email sent'
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc      Reset password
// @route     PUT /api/users/resetpassword/:resettoken
// @access    Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  let salt = await bcrypt.genSalt(Number(process.env.SALT_KEY));
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});


module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateAvatar,
  deleteUser,
  getUserById,
  loginUser,
  searchUserByQuery,
  forgatPassword,
  resetPassword,
  getTrainee,
  getAllTrainees,
  getMyTrainer,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  updateAvatarTrainee
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  let token = createToken(user._id, user.email, user.user, user.username, user.role, user.profile_id, user.avatar);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  // await User.findByIdAndUpdate(
  //   user._id,
  //   {$addToSet: {status: true}}
  //   );
  //res.status(200).json({ token: token });
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token: token
  });
};
