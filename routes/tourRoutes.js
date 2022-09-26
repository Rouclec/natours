const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  createReview,
  getAllReviews,
  getReview,
} = require('../controllers/reviewController');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');

const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter); //Use the review router for paths like this

router.route('/tour-stats').get(protect, restrictTo('admin'), getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin'), getMonthlyPlan);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
