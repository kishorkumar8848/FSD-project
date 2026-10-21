import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.cloudguard_token) {
      token = req.cookies.cloudguard_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No authorization token provided.' },
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId).populate('organization');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or deactivated user account.' },
      });
    }

    req.user = user;
    req.organizationId = user.organization._id;
    req.organization = user.organization;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired session token.', details: err.message },
    });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user?.role}'.`,
        },
      });
    }
    next();
  };
}
