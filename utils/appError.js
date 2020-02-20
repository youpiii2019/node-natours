class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'err';
    this.isOperational = true;
    // err.stack gives us where the error happened

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
