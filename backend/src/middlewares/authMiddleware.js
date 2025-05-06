const jwt = require("jsonwebtoken");

export function authMiddleware(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).send("Non authentifié.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(403).send("Token invalide.");
  }
}

