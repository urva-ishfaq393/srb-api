const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

// Returns an Express middleware for POST /graphql
async function createGraphqlMiddleware() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  return [express.json(), expressMiddleware(server)];
}

module.exports = createGraphqlMiddleware;
