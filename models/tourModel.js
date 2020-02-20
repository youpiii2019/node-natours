const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');
// Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // required is one of built in validator
      unique: true, // unique is not a validator
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'], // maxlength and minlength, built in validators spcifically for String type
      minlength: [10, 'A tour name must have more or equal than 10 characters'] // maxlength and minlength, built in validators
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
      // we dont call it here; we just spicfy it here
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'], // shorthand notation for { values: [], message: ''}
      enum: {
        // enum is only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'], // validators for numbers and Dates
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        // to create custom validator use the validate property
        validator: function(val) {
          return val < this.price; // 100 < 200; if false it will trigger a validation error
          // caveat: the 'this' will only point to the current document on new doc; validator will not work with Update
          // this only points to current doc on NEW document creation
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true, // remove the spaces in the beginning and end of the string
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image cover']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // hiding the selected field, say createdAt
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'] // enumeration, the possible option the arry can be
      },
      coordinates: [Number], // latitude, longitude
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: Array
  },
  {
    toJSON: { virtuals: true }, // each time the data is outputed as json or object, virtuals is true
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
  // we need the this keyword whihc is pointing to the current document
  // es6 arrow function dont have this keyword
});

//
// DOCUMENT MIDDLEWARE : runs before .save() and .create() but will not run say in .insertMany(), find and update
// 'save' hook

tourSchema.pre('save', function(next) {
  // Slug a string that we can put to the url
  // slugify package
  // 'this' is the currently processed/saved document
  // 'this' points to the current document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});

// // POST middleware or hooks
// // post middleware has access not only to hte next function but also to the document that was saved to the database
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//
// QUERY MIDDLEWARE will run before and after any QUERY
// 'find' hook
// 'this' keyword will point to the current query and not at the current document

// regular expression /^find/ means everything that starts with FIND
tourSchema.pre(/^find/, function(next) {
  // 'this' is now a query object pointing to the current query, e.g find/findone/findmany,
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// will run after the query exectured
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(docs);

  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // 'this' points to the aggregation object
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline()); // the this.pipleine() is aggregation pipeline, pipeline that was defined in our gettourstats model
  next();
});

//model names
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
