const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION! Shutting down..');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

const DB = process.env.DATABASE.replace('A', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));

// process core module of express
// available everywhere autmatically
// express does not define env; env var is the environment  we can define
//console.log(process.env);

// 4) START THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// NODE_ENV
// prepend the special variable
// NODE_ENV=development X=23 nodemon server.js
// TEST

// Unhandled promise rejection
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down..');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); // 0 is success; 1 is exception; process.exit does not shut down gracefully so we have to close the server first
  });
});
