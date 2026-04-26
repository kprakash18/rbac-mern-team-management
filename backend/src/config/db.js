import mongoose from "mongoose";

export const DB_connection = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI) ;
        console.log('Mongoose DB successfully connected!');
        
    } catch (error){
        console.log(error);
        process.exit(1) ;
        
    }
};