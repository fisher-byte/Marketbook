function notFound(res, message = 'Not found') {
  return res.status(404).json({ error: message });
}

function badRequest(res, message = 'Bad request') {
  return res.status(400).json({ error: message });
}

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

module.exports = { notFound, badRequest, BadRequestError, NotFoundError, ConflictError };
