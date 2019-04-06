import http from "http";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { importSchema } from "graphql-import";
import mongoose from "mongoose";
import resolvers from "./resolvers";
import { findOrCreateUser } from "./controllers/userController";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected!"))
  .catch(err => console.error(err));

const app = express();

app.set("port", process.env.PORT || "4000");

const typeDefs = importSchema("schema.graphql");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    let authToken = null;
    let currentUser = null;
    try {
      authToken = req.headers.authorization;
      if (authToken) {
        currentUser = await findOrCreateUser(authToken);
      }
    } catch (err) {
      console.error(`Unable to authenticate user with token ${authToken}`);
    }
    return { currentUser };
  },
});

server.applyMiddleware({ app });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}/graphql`);
});
