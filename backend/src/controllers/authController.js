import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ error: "JWT_SECRET is not configured" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $setOnInsert: {
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0] || normalizedEmail
        }
      },
      { new: true, upsert: true }
    );

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, jwtSecret, {
      expiresIn: "1d"
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
