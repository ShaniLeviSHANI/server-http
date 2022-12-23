const jwt = require("jsonwebtoken");
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const { User } = require('../models/users');

//for privit routes
// Checks whether the token of tha user is valid or not
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized Access denied', 403));
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN);
        req.user = await User.findById(decoded._id);
        req.email = decoded.email;
        req._id = decoded._id
        req.profile_id = decoded.profile_id
        next();
    }
    catch (err) {
        // If the token is incorrect
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});


// Grant access 
exports.authorize = async (friendId, trainerOf) => {
    let isAuthorize = false;
    if (trainerOf.length > 0)
        trainerOf.map(id => {
            if (id.toString() == friendId)
                isAuthorize = true;
        });
    return isAuthorize;
};