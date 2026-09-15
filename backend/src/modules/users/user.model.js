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
    },
    lastLogoutAt: {
      type: Date,
      default: null
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ accountStatus: 1, createdAt: -1 });
userSchema.index({ name: 1, email: 1 });

const User = mongoose.model("User", userSchema);

export default User;
