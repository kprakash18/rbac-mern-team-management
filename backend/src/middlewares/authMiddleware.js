import jwt from "jsonwebtoken";

export const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id: userId, ...payload };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
