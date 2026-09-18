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

teamSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
teamSchema.index({ status: 1, createdAt: -1 });
teamSchema.index({ createdBy: 1, createdAt: -1 });

const Team = mongoose.model("Team", teamSchema);

export default Team;
