const Tour = require('./../models/tourModel');
const sharp = require('sharp');
const catchAsync = require('../utils/errorHandling');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

//multer for file uploads
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cbFxn) => {
//     cbFxn(null, 'public/img/users');
//   },
//   filename: (req, file, cbFxn) => {
//     //user-userId-timestamp.extension
//     const extension = file.mimetype.split('/')[1];
//     cbFxn(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cbFxn) => {
  if (file.mimetype.startsWith('image')) {
    cbFxn(null, true);
  } else {
    cbFxn('Error: Not an image! Please upload only images', false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, //input for the image cover
  { name: 'images', maxCount: 3 }, //input for the tour images
]);
// upload.array('images', 5) // for single input which accepts multiple images

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // 1) Proccess cover image
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //reizes the image to 500x500
    .toFormat('jpeg') //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/tours/${imageCoverFilename}`);
  req.body.imageCover = imageCoverFilename;

  // 2) process other images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) //reizes the image to 500x500
        .toFormat('jpeg') //converts the image to a jpeg format
        .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

//MIDDLEWARES
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.page = '1';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//CALLBACK FUNCTIONS (ROUTE HANDLERS)
exports.getAllTours = getAll(Tour);

exports.getTour = getOne(Tour, 'reviews', '-__v');

exports.createTour = createOne(Tour);

exports.updateTour = updateOne(Tour);

exports.deleteTour = deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, //match all tours with ratingsAverage gte 4.5 (which is all the tours)
    },
    {
      $group: {
        _id: '$difficulty', //group tours with similar difficulty
        numTours: { $sum: 1 }, //add one for each element in the group
        numRatings: { $sum: '$ratingsAverage' }, //add the ratingsAverage of all elements in the group
        averageRating: { $avg: '$ratingsAverage' }, //gets the average of the sum above
        averagePrice: { $avg: '$price' }, //gets the average of all the prices
        minPrice: { $min: '$price' }, //gets the min price
        maxPrice: { $max: '$price' }, //gets the max price
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  let { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const earthRadius = unit === 'mi' ? 3963.2 : 6378.1;

  const radius = distance / earthRadius;

  if (!(lat && lng)) {
    return next(
      res.status(400).json({
        status: 'Bad request',
        message:
          'Please provide a latitude and longitude in the format lat,lng',
      })
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'Succcess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  let { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!(lat && lng)) {
    return next(
      res.status(400).json({
        status: 'Bad request',
        message:
          'Please provide a latitude and longitude in the format lat,lng',
      })
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Succcess',
    data: {
      data: distances,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    //mongoDB aggregators
    {
      $unwind: '$startDates', //Spreads the date array into elements of each date
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`).toISOString(), //Checks if each date matches  1st January /year/ <= date <= 31st december /year/
          $lte: new Date(`${year}-12-31`).toISOString(),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: {
            $dateFromString: {
              dateString: '$startDates', //groups the results with similar month (id) from startDates
            },
          },
        },
        numTourStarts: { $sum: 1 }, //increments 1 for each result in the group
        tours: { $push: '$name' }, //includes the name element in the result query
      },
    },
    {
      $addFields: {
        month: {
          //adds a field called month
          $let: {
            vars: {
              monthsInString: [
                ,
                'January',
                'February',
                'March',
                'April',
                'May',
                'June', //Creates a variable array of all the months
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ],
            },
            in: {
              $arrayElemAt: ['$$monthsInString', '$_id'], //matches the id to the element with index matching the id and returns this as the value of month
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0, //removes the id field from the result (project(1) includes the field, project(0) remove the field)
      },
    },
    {
      $sort: { numTourStarts: -1 }, //sorts the results by the number of tours in descending order
    },
  ]);

  res.status(200).json({
    status: 'Success',
    length: plan.length,
    data: {
      plan,
    },
  });
});
