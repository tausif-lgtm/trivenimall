const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
  });
};

const requireStaff = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Staff or Admin only.' });
    }
    next();
  });
};

const requireCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied. Customers only.' });
    }
    next();
  });
};

// Tenant — retail shop owners
const requireTenant = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!['tenant', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Tenants only.' });
    }
    next();
  });
};

// Security officers
const requireSecurity = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!['security', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Security only.' });
    }
    next();
  });
};

// Help Desk — can create and view all tickets
const requireHelpDesk = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!['helpdesk', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Help Desk only.' });
    }
    next();
  });
};

// Generic multi-role guard: pass an array of allowed roles
const requireAnyOf = (roles) => (req, res, next) => {
  verifyToken(req, res, () => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' / ')}.`,
      });
    }
    next();
  });
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireStaff,
  requireCustomer,
  requireTenant,
  requireSecurity,
  requireHelpDesk,
  requireAnyOf,
};
