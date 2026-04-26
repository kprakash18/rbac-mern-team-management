import jwt from "jsonwebtoken";

export const issueToken = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ error: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(
      { userId, email },
      jwtSecret,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
