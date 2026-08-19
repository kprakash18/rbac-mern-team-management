import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true,
        trim : true,
        maxlength : 100,
    },
    description:{
        type : String,
        trim : true,
        maxlength : 500,
        default : "",
    },
    createdBy:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    status:{
        type : String ,
        enum : ["ACTIVE", "ARCHIVED"],
        required : true,
    }, 
},
{
    timestamps : true,
}
);

teamSchema.index({ name : 1}) ;
const Team = mongoose.model("Team", teamSchema) ;

export default Team ;