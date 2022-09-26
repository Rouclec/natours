// review /rating/createdAt/ref to tour/ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please enter a review'],
      minLength: [20, 'A review should be atleast 20 characters long'],
    },
    rating: {
      type: Number,
      min: [1, 'Give atleast a 1 star'],
      max: [5, "You can't rate above 5 stars"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      requied: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'tour', select: 'name' });
  this.populate({ path: 'user', select: 'username photo' });
  next();
});

reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', //group all reviews with thesame tour,
        nRating: { $sum: 1 }, //add 1 for each review document which matches
        avgRating: { $avg: '$rating' }, //get the average rating of all the docs that match
      },
    },
  ]);

  if (stats.length > 0) {
    console.log(Tour.findById(tourId));
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function (next) {
  this.constructor.calculateAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.query = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.query.constructor.calculateAverageRatings(this.query.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
