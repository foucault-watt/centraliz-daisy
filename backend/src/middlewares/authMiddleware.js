export const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  // Si req.session.user n'existe pas, req.user restera undefined.
  // Les contrôleurs devront gérer ce cas.
  next();
};

// Middleware pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: "Non authentifié",
    });
  }
};
