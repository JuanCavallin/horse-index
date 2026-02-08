import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

// Extend Express Request type to include user info
export interface AuthRequest extends Request {
  user?: {
    id: number; // Database user ID for audit logging
    authId: string; // Auth UUID
    email?: string;
    role?: 'viewer' | 'editor' | 'administrator';
  };
}

/**
 * Middleware to verify Supabase JWT token from Authorization header
 * Attaches user info to request object
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Missing authentication token' });
    return;
  }

  try {
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch user role from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      // User authenticated but no profile exists - they might be a new user
      res.status(403).json({ 
        error: 'User profile not found. Please complete registration.' 
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: userData.id as number,
      authId: user.id,
      email: user.email,
      role: userData.role as 'viewer' | 'editor' | 'administrator',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticateToken middleware
 */
export function requireRole(...roles: Array<'viewer' | 'editor' | 'administrator'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role 
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require editor or administrator role
 * Convenient shorthand for common use case
 */
export const requireEditor = requireRole('editor', 'administrator');

/**
 * Middleware to require administrator role only
 */
export const requireAdmin = requireRole('administrator');

/**
 * Optional authentication - doesn't fail if no token provided
 * but attaches user info if valid token is present
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData) {
        req.user = {
          id: userData.id as number,
          authId: user.id,
          email: user.email,
          role: userData.role as 'viewer' | 'editor' | 'administrator',
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.error('Optional auth error:', error);
  }

  next();
}
