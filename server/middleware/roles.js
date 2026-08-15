/**
 * Role-based access control middleware
 */

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const requireWorker = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!['admin', 'worker'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

const requireSelf = (userIdParam = 'id') => (req, res, next) => {
  const targetId = req.params[userIdParam];
  if (req.user.role === 'admin' || req.user.id === targetId) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
};

module.exports = { requireAdmin, requireWorker, requireSelf };
