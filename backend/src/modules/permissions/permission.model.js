import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    resource: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "USER_MANAGEMENT",
        "TEAM_MANAGEMENT",
        "AUTHORIZATION",
        "ACCESS_CONTROL",
        "NOTIFICATION",
        "SECURITY",
        "TASK_MANAGEMENT",
      ],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    isSystemPermission: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;
