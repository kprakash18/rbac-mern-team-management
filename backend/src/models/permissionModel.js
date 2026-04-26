import mongoose from "mongoose";
const permissionTableSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
        unique : true
    }
},
{
    timestamps: true 

}) ; 

export default mongoose.model('Permission', permissionTableSchema) ;
