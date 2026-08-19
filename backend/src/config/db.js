import mongoose from "mongoose";
import "dotenv/config";

const DB_URI = process.env.MONGO_URI ;


const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;