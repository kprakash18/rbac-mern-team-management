import mongoose from "mongoose";

export async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();

  console.log("MongoDB disconnected");
}
