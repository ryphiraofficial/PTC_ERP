import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Also support demo/mock role header for rapid role switching in development
  const roleHeader = req.headers['x-demo-role'];

  if (!token && roleHeader) {
    // Find or create default user for that role
    const mockUser = await User.findOne({ role: roleHeader });
    if (mockUser) {
      req.user = mockUser;
      return next();
    }
  }

  if (!token) {
    // If no token, fall back to owner user for seamless demo if available
    const defaultUser = await User.findOne({ role: 'owner' });
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ledgerly_gst_secret_jwt_key_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user?.role || 'Guest'}) is not permitted to perform this action. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
};
