const AppError = require('../utils/AppError');
const { nodeEnv } = require('../config/env');

// Last middleware. Every error leaves the API in the same JSON shape.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Internal server error';
  let code;
  let details;

  if (err instanceof AppError) {
    ({ status, message, code, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 422;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = fields ? `Duplicate value for: ${fields}` : 'Duplicate value';
    code = 'DUPLICATE';
  } else if (nodeEnv !== 'production') {
    message = err.message || message;
  }

  if (status >= 500) console.error(err);

  const body = { status, message };
  if (code) body.code = code;
  if (details) body.details = details;
  res.status(status).json({ error: body });
};
