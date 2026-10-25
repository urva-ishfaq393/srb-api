const http = require('http');
const mongoose = require('mongoose');
const config = require('./config/env');
const createApp = require('./app');
const initSockets = require('./sockets');

async function main() {
  if (!config.mongoUrl) {
    console.error('MONGODB_URL is missing. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUrl);
  console.log('MongoDB connected');
  await mongoose.syncIndexes(); // make sure the unique indexes exist

  const app = await createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(config.port, () => {
    console.log(`srb-api running on http://localhost:${config.port}`);
    console.log(`  REST     http://localhost:${config.port}/api/v1`);
    console.log(`  GraphQL  http://localhost:${config.port}/graphql`);
    console.log(`  Board    http://localhost:${config.port}/board.html?room=ROOM-01`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
