import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function signToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email address already exists.' },
      });
    }

    // Find default org or create one
    let org = null;
    if (data.organizationName) {
      const slug = data.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      org = await Organization.findOne({ slug });
      if (!org) {
        org = await Organization.create({ name: data.organizationName, slug });
      }
    } else {
      org = await Organization.findOne() || await Organization.create({
        name: 'CloudGuard Security Ops',
        slug: 'cloudguard-secops',
      });
    }

    // Least privilege role by default
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'analyst';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role,
      organization: org._id,
      isActive: true,
      lastLogin: new Date(),
    });

    const token = signToken(user._id);

    res.cookie('cloudguard_token', token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await AuditLog.create({
      organization: org._id,
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_REGISTER',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email.toLowerCase() }).populate('organization');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password credentials.' },
      });
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password credentials.' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account has been deactivated. Please contact your administrator.' },
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);

    res.cookie('cloudguard_token', token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await AuditLog.create({
      organization: user.organization._id,
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_LOGIN',
      targetType: 'user',
      targetId: user._id.toString(),
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await AuditLog.create({
        organization: req.organizationId,
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'AUTH_LOGOUT',
        targetType: 'user',
        targetId: req.user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.clearCookie('cloudguard_token');
    res.json({ success: true, message: 'Successfully logged out.' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeJSON(),
        organization: req.organization,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    // Prevent email enumeration
    res.json({
      success: true,
      message:
        'If an account exists for this email, password reset instructions have been dispatched. (Note: Development environment active - email transmission simulated).',
    });
  } catch (err) {
    next(err);
  }
}
