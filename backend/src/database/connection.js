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


export async function gracefulShutdown(signal){
  const shutdown = async(signal) =>{
    console.log(`\nReceived ${signal}.Shutting down gracefully...`);
    httpServer.close(async() =>{
      console.log("Http server closed");
      await disconnectDatabase() ;
      process.exit(0) ;
      
    });
  };

  process.on("SIGINT", ()=> shutdown("SIGINT")) ;
  process.on("SIGTERM", ()=> shutdown("SIGTERM")) ;
}