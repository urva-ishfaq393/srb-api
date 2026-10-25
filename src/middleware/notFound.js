const AppError = require('../utils/AppError');

module.exports = function notFound(req, res, next) {
  next(new AppError(404, 'Route not found'));
};
