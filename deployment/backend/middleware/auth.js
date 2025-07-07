const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur invalide ou désactivé' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }

  next();
};

// Middleware to check if user is admin or the resource owner
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  // For non-admin users, check if they're accessing their own resource
  const resourceUserId = parseInt(req.params.userId || req.body.userId);
  if (req.user.id !== resourceUserId) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  next();
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ error: 'Permission insuffisante' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrOwner,
  requirePermission,
  JWT_SECRET,
}; 