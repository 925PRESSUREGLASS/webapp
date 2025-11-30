/**
 * Shared Types for meta-api
 * Centralized type definitions to ensure consistency across routes
 */

/**
 * JWT Payload structure
 * This is the payload signed by auth.ts and verified by other routes
 */
export interface JwtPayload {
  id: string;           // User ID (primary identifier)
  email: string;        // User email
  role: string;         // User role (e.g., 'user', 'admin')
  organizationId: string | null;  // Organization ID (null for personal accounts)
}

/**
 * Authenticated request user - same as JwtPayload
 * Use this when casting request.user after jwtVerify()
 */
export type AuthenticatedUser = JwtPayload;
