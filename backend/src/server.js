import express from "express";
import { env } from "./config/env.js";
import { connectDatabase } from "./database/connection.js";

const app = express();

async function startServer() {
  await connectDatabase(env.mongoUri);

  app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
}

startServer();
