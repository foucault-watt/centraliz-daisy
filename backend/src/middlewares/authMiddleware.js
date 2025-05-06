import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const token =
    req.cookies?.auth_token ||
    req.cookies?.["sb-access-token"] ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
