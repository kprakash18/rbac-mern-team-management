import mongoose from "mongoose";

const teamTableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model("Team", teamTableSchema);