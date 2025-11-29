/**
 * Authentication Routes
 * Handles user registration, login, logout, and token refresh
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service';

// JWT verification helper for protected routes
async function verifyJwt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await (request as any).jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  organizationName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

export function registerAuthRoutes(app: FastifyInstance, allowedOrigin: string): void {
  // Helper to set CORS headers
  const setCorsHeaders = (reply: FastifyReply) => {
    reply
      .header('Access-Control-Allow-Origin', allowedOrigin)
      .header('Access-Control-Allow-Credentials', 'true')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  };

  // ==========================================
  // PUBLIC AUTH ROUTES (no JWT required)
  // ==========================================

  /**
   * POST /auth/register
   * Register a new user account
   */
  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.format()
      });
    }

    const result = await authService.register(parsed.data);
    
    if (!result.success) {
      return reply.code(400).send({ error: result.error });
    }

    // Generate JWT token
    const token = app.jwt.sign(
      {
        id: result.user!.id,
        email: result.user!.email,
        role: result.user!.role,
        organizationId: result.user!.organizationId
      } as JWTPayload,
      { expiresIn: '7d' }
    );

    // Log registration
    await authService.logAction(
      'register',
      'user',
      result.user!.id,
      result.user!.id,
      { email: result.user!.email },
      request.ip,
      request.headers['user-agent']
    );

    return reply.code(201).send({
      success: true,
      user: result.user,
      organization: result.organization,
      token
    });
  });

  /**
   * POST /auth/login
   * Login with email and password
   */
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.format()
      });
    }

    const result = await authService.login(parsed.data);
    
    if (!result.success) {
      return reply.code(401).send({ error: result.error });
    }

    // Generate JWT token
    const token = app.jwt.sign(
      {
        id: result.user!.id,
        email: result.user!.email,
        role: result.user!.role,
        organizationId: result.user!.organizationId
      } as JWTPayload,
      { expiresIn: '7d' }
    );

    // Log login
    await authService.logAction(
      'login',
      'user',
      result.user!.id,
      result.user!.id,
      undefined,
      request.ip,
      request.headers['user-agent']
    );

    return reply.send({
      success: true,
      user: result.user,
      organization: result.organization,
      token
    });
  });

  // ==========================================
  // PROTECTED AUTH ROUTES (JWT required)
  // ==========================================

  /**
   * GET /auth/me
   * Get current user profile
   */
  app.get('/auth/me', {
    preHandler: [verifyJwt]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const payload = request.user as JWTPayload;
    const user = await authService.getUserById(payload.id);
    
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({
      success: true,
      user
    });
  });

  /**
   * PUT /auth/profile
   * Update user profile
   */
  app.put('/auth/profile', {
    preHandler: [verifyJwt]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.format()
      });
    }

    const payload = request.user as JWTPayload;
    const result = await authService.updateProfile(payload.id, parsed.data);
    
    if (!result.success) {
      return reply.code(400).send({ error: result.error });
    }

    // Log update
    await authService.logAction(
      'update',
      'user',
      payload.id,
      payload.id,
      parsed.data,
      request.ip,
      request.headers['user-agent']
    );

    return reply.send({
      success: true,
      user: result.user
    });
  });

  /**
   * POST /auth/change-password
   * Change user password
   */
  app.post('/auth/change-password', {
    preHandler: [verifyJwt]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.format()
      });
    }

    const payload = request.user as JWTPayload;
    const result = await authService.changePassword(
      payload.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    
    if (!result.success) {
      return reply.code(400).send({ error: result.error });
    }

    // Log password change
    await authService.logAction(
      'change_password',
      'user',
      payload.id,
      payload.id,
      undefined,
      request.ip,
      request.headers['user-agent']
    );

    return reply.send({ success: true, message: 'Password changed successfully' });
  });

  /**
   * POST /auth/refresh
   * Refresh JWT token
   */
  app.post('/auth/refresh', {
    preHandler: [verifyJwt]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    setCorsHeaders(reply);
    
    const payload = request.user as JWTPayload;
    
    // Verify user still exists and is active
    const user = await authService.getUserById(payload.id);
    if (!user || !user.isActive) {
      return reply.code(401).send({ error: 'Token invalid' });
    }

    // Generate new token
    const token = app.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      } as JWTPayload,
      { expiresIn: '7d' }
    );

    return reply.send({
      success: true,
      token
    });
  });

  console.log('[AUTH] Auth routes registered');
}
