/*
* Principle Dont Repeat Yourself
* A function used to avoid readings of try-catch in async-awiat calls
*/

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;