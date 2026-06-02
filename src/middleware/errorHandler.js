function errorHandler(error, _req, res, _next) {
  if (error.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      details: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate resource',
      fields: Object.keys(error.keyPattern || {}),
    });
  }

  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error',
  });
}

module.exports = errorHandler;
