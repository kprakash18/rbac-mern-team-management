import mongoose from "mongoose";
import { closeRedis } from "../config/redis.js";

export async function connectDatabase(uri) {
  try {
    const options = {
      maxPoolSize: 100,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4,
    };
    await mongoose.connect(uri, options);

    console.log("MongoDB connected successfully with connection pool (max: 100, min: 10)");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();

  console.log("MongoDB disconnected");
}

export async function gracefulShutdown(server) {

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("Http server closed");
      await disconnectDatabase();
      await closeRedis();
      process.exit(0);
    });
  };


  process.on("SIGINT", ()=> shutdown("SIGINT")) ;
  process.on("SIGTERM", ()=> shutdown("SIGTERM")) ;
}
