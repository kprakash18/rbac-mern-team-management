import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255
    },
    hashedPassword: {
      type: String,
      required: true,
      select: false
    },
    accountStatus: {
      type: String,
      enum: ["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"],
      default: "INVITED",
      index: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
