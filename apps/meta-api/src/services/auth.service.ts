/**
 * Authentication Service
 * Handles user registration, login, token generation and validation
 */

import bcrypt from 'bcryptjs';
import { getPrismaClient } from '../db/client';
import type { User, Organization, UserRole, Prisma, PrismaClient } from '@prisma/client';

const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  organizationName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  organization?: Organization | null;
  error?: string;
}

interface UserWithOrg extends Omit<User, 'passwordHash'> {
  organization?: Organization | null;
}

export const authService = {
  /**
   * Register a new user
   * If organizationName is provided, creates a new organization
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const prisma = getPrismaClient();
    
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() }
      });
      
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      
      // Create user (and optionally organization) in a transaction
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        let organization: Organization | null = null;
        
        // Create organization if name provided
        if (input.organizationName) {
          const slug = input.organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          organization = await tx.organization.create({
            data: {
              name: input.organizationName,
              slug: slug,
              email: input.email.toLowerCase()
            }
          });
        }
        
        // Create user
        const user = await tx.user.create({
          data: {
            email: input.email.toLowerCase(),
            passwordHash,
            name: input.name,
            phone: input.phone,
            role: organization ? 'admin' : 'user',
            organizationId: organization?.id
          },
          include: {
            organization: true
          }
        });
        
        return { user, organization };
      });
      
      // Remove passwordHash from response
      const { passwordHash: _, ...userWithoutHash } = result.user as User & { organization: Organization | null };
      
      return {
        success: true,
        user: userWithoutHash,
        organization: result.organization
      };
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  },
  
  /**
   * Login user with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const prisma = getPrismaClient();
    
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        include: { organization: true }
      });
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }
      
      // Verify password
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Remove passwordHash from response
      const { passwordHash: _, ...userWithoutHash } = user;
      
      return {
        success: true,
        user: userWithoutHash,
        organization: user.organization
      };
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  },
  
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithOrg | null> {
    const prisma = getPrismaClient();
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      });
      
      if (!user) return null;
      
      const { passwordHash: _, ...userWithoutHash } = user;
      return userWithoutHash;
    } catch (error) {
      console.error('[AUTH] Get user error:', error);
      return null;
    }
  },
  
  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<AuthResult> {
    const prisma = getPrismaClient();
    
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone
        },
        include: { organization: true }
      });
      
      const { passwordHash: _, ...userWithoutHash } = user;
      
      return {
        success: true,
        user: userWithoutHash,
        organization: user.organization
      };
    } catch (error) {
      console.error('[AUTH] Update profile error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  },
  
  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const prisma = getPrismaClient();
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });
      
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Change password error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password change failed' 
      };
    }
  },
  
  /**
   * Create audit log entry
   */
  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    changes?: object,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const prisma = getPrismaClient();
    
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId,
          changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('[AUTH] Audit log error:', error);
    }
  }
};
