const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  checkUser,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });
//POST /tours/tourId/reviews                    Creates a review for a particular tour
//GET  /tours/tourId/reviews                    Gets all the reviews for a particular tour
//GET  /tours/tourId/reviews/reviewId           Gets a particular review for a particular tour

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .delete(protect, restrictTo('user', 'admin'), deleteReview)
  .patch(protect, restrictTo('user'), checkUser, updateReview);

module.exports = router;
