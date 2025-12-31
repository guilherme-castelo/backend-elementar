const { AppError } = require('../errors/AppError');

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    // Log all errors in development/production (except maybe 404s if too noisy)
    console.error(err);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails = {};

  if (err instanceof AppError) {
    statusCode = err.status;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle Prisma or Joi validation errors if any bubble up generically
    statusCode = 400;
    message = err.message;
  } else if (err.code === 'P2002') {
    // Prisma Unique Constraint Violation
    statusCode = 409;
    message = 'Unique constraint violation';
    errorDetails = err.meta;
  } else if (err.code === 'P2025') {
    // Prisma Not Found
    statusCode = 404;
    message = 'Record not found';
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: errorDetails }),
  });
};

module.exports = errorHandler;

