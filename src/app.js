const path = require('path');
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { health } = require('./controllers/healthController');
const createGraphqlMiddleware = require('./graphql');

// Async because Apollo Server must be started before it can be mounted.
async function createApp() {
  const app = express();

  app.use(requestLogger);
  app.use(express.static(path.join(__dirname, '..', 'public'))); // board.html, admin.html

  app.get('/health', health);

  app.use('/api/v1', express.json(), require('./routes'));
  app.use('/graphql', ...(await createGraphqlMiddleware()));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
