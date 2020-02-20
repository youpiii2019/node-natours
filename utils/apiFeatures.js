class APIFeatures {
  constructor(query, queryString) {
    // query is the query in mogoose; querystring is the route passed
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    // remove the fields from our query obejcts
    excludeFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      //req.query.sort is the query param in the postman??, say price
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // mongoose request say a string with fields name to be separated by spaces
      // selecting certain field name is called projecting
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
      // -__v is excluding, or except that field
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // trick to convert into a number
    const limit = this.queryString.limit * 1 || 100;

    // calculating the skip value
    const skip = (page - 1) * limit;
    //127.0.0.1:3000/api/v1/tours?page=2&limit=10
    // 1-10 page 1, 11-20 page 2
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;

//console.log(req.query);
// BUILD QUERY
// 1A) Filtering
// building a hard copy of req.query object
// // using {...}  -- trick structuring?, 3 dots take out the fileds out of the object; curly braces, create a new object
// const queryObj = { ...req.query };
// const excludeFields = ['page', 'sort', 'limit', 'fields'];
// // remove the fields from our query obejcts
// excludeFields.forEach(el => delete queryObj[el]);

// console.log(req.query, queryObj);

// QUERY FORMAT #1 -- filtering the mongodb way
// const query = Tour.find({'difficulty': 'easy'});

// 1B) Advanced filtering
// convert object into a string
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
// console.log(JSON.parse(queryStr));
// 127.0.0.1:3000/api/v1/tours/?difficulty=easy&duration[gte]=5
// { difficulty: 'easy', duration: { gte: '5' } }
// { difficulty: 'easy', duration: { '$gte': '5' } }
// let query = Tour.find(JSON.parse(queryStr));

// 2) Sorting
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   //req.query.sort is the query param in the postman??, say price
//   // console.log(sortBy);
//   query = query.sort(sortBy);
//   // query.sort is  method to sort the parameters (that is the req.query.sort) passed accordingly, say by price
//   // descending order : 127.0.0.1:3000/api/v1/tours/?sort=-price

//   // sort by second criteria
//   //127.0.0.1:3000/api/v1/tours/?sort=price,ratingsAverage
//   // sort('price ratingsAverage')
// } else {
//   query = query.sort('-createdAt');
// }

// 3) Field Limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   // mongoose request say a string with fields name to be separated by spaces
//   // selecting certin field name is called projecting
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
//   // -__v is excluding, or except that field
// }

// 4) Pagination
// default if the user did not specify the page and limit
// const page = req.query.page * 1 || 1; // trick to convert into a number
// const limit = req.query.limit * 1 || 100;

// // calculating the skip value
// const skip = (page - 1) * limit;
// //127.0.0.1:3000/api/v1/tours?page=2&limit=10
// // 1-10 page 1, 11-20 page 2
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This page does not exist');
// }
// console.log(req.requestTime);
// QUERY FORMAT #2 -- using mongoose methods; chaining moongse methods
// const tours =  Tour.find()
//   .where('duration')
//   .equals(5)
//   .where('difficulty')
//   .equals('easy');
