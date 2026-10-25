// One error class for the whole project. The error handler turns it into
// { "error": { "status", "message", "code"?, "details"? } }
class AppError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
