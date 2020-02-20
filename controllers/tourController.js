// TOURS
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   // if (id > tours.length)
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  //127.0.0.1:3000/api/v1/tours?limit=5&sort=-ratingsAverage,price
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // query.sort().select().skip().limit();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      // endpoint : data
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({_id: req.params.id})

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      // endpoint : data
      tour
    }
  });
  // request parameters where all the parameters or variable defined are stored
  // ex: '/api/v1/tours/:id/:x/:y', params are three
  // optional by adding '?', '/api/v1/tours/:id/:x/:y?'
  // console.log(req.params);
  // const id = req.params.id * 1;
  // const tour = tours.find(el => el.id === id);
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    // sending back the updated document

    runValidators: true // setting that runs the validators in our model
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // 204 means no content; data null
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: null
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        // $avg,$min, $max, $sum, $toUpper  -- mongodb operators
        numTours: { $sum: 1 },
        numRatings: { $sum: 'ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } // 1 for ascending
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    // unwinding pipeline
    {
      $unwind: '$startDates'
    },
    {
      // $match is to query
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // $month, will return a number for month, jan is 1, dec is 12
        numTourStarts: { $sum: 1 },
        // counting the tours by month,
        //"_id": 12,
        //"numTourStarts": 1
        tours: { $push: '$name' }
        // result
        // "_id": 12,
        // "numTourStarts": 1,
        // "tours": [
        //     "The Northern Lights"
        // ]
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0 // project will get rid a field by giving each field a 0 or 1; setting by 0 will hide, 1 will show up
      }
    },
    {
      $sort: { numTourStarts: -1 } // descending order / starts with highest number
    }
    // additonal stage is limit
    // {
    //   $limit: 6
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
