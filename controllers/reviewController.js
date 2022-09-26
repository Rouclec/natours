const Review = require('../models/reviewModel');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');
const catchAsync = require('../utils/errorHandling');

exports.checkUser = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!req.user._id.equals(review.user._id)) {
    return next(
      res.status(401).json({
        status: 'Unauthorized',
        message: "You cannot edit another user's review",
      })
    );
  }
  next();
});

exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.createReview = createOne(Review);
