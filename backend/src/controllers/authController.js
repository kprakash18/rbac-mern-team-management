import jwt from "jsonwebtoken";

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

    const token = jwt.sign({ userId: email, email }, jwtSecret, {
      expiresIn: "1d"
    });

    return res.status(200).json({ token, email });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
