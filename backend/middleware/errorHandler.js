/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error response (don't expose stack trace in production)
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message || 'Server error',
  });
};

module.exports = { errorHandler };

