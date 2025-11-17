# TicTacStick Backend API Design Document
## Phase 3 - Multi-Device Sync, Team Collaboration & GoHighLevel Integration

**Version:** 1.0.0
**Date:** 2025-11-17
**Status:** Design Phase
**Target:** Production-ready REST API for Phase 3 backend implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core Resource Endpoints](#core-resource-endpoints)
5. [Real-Time Sync API](#real-time-sync-api)
6. [GoHighLevel Integration](#gohighlevel-integration)
7. [File Upload & Management](#file-upload--management)
8. [Analytics & Reporting](#analytics--reporting)
9. [Error Handling](#error-handling)
10. [Rate Limiting & Quotas](#rate-limiting--quotas)
11. [API Versioning](#api-versioning)
12. [Database Schema](#database-schema)
13. [Security Checklist](#security-checklist)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Guide](#deployment-guide)

---

## Executive Summary

### Current State
- **Architecture:** 100% client-side JavaScript (ES5)
- **Storage:** localStorage only
- **Limitations:** Single device, no collaboration, no cloud backup

### Phase 3 Goals
- **Backend:** Node.js/Express API + PostgreSQL/Supabase
- **Features:** Multi-device sync, team collaboration, GoHighLevel integration
- **Clients:** Web app (ES5), future mobile apps (React Native)
- **Scale:** 10-100 users in year 1, white-label SaaS potential

### Key Requirements
- ✅ RESTful API with JSON responses
- ✅ JWT authentication with refresh tokens
- ✅ Offline-first client support with conflict resolution
- ✅ Real-time sync via WebSocket
- ✅ GoHighLevel bidirectional integration
- ✅ File uploads (photos, PDFs)
- ✅ Comprehensive audit trails
- ✅ Rate limiting & quotas
- ✅ <100ms response time (P95)
- ✅ 99.9% uptime SLA

---

## Technology Stack

### Backend Framework
```javascript
{
  "runtime": "Node.js 18+ LTS",
  "framework": "Express.js 4.x",
  "language": "JavaScript (ES6+) or TypeScript",
  "validation": "Joi or Zod",
  "logging": "Winston or Pino"
}
```

### Database
```javascript
{
  "primary": "PostgreSQL 14+",
  "alternative": "Supabase (PostgreSQL + Auth + Storage)",
  "orm": "Prisma or Sequelize",
  "migrations": "Knex.js or Prisma Migrate",
  "caching": "Redis 7+",
  "search": "PostgreSQL Full-Text Search"
}
```

### Authentication
```javascript
{
  "tokens": "JWT (jsonwebtoken)",
  "hashing": "bcrypt or argon2",
  "strategy": "Access token (1h) + Refresh token (30d)",
  "storage": "Redis (token blacklist)"
}
```

### File Storage
```javascript
{
  "provider": "AWS S3 / Cloudflare R2 / Supabase Storage",
  "processing": "Sharp (image optimization)",
  "pdf": "Puppeteer or PDFKit",
  "cdn": "CloudFront or Cloudflare CDN"
}
```

### Real-Time Communication
```javascript
{
  "websocket": "Socket.io or native WebSocket (ws)",
  "fallback": "Server-Sent Events (SSE)",
  "pubsub": "Redis Pub/Sub"
}
```

### Background Jobs
```javascript
{
  "queue": "Bull or BullMQ",
  "scheduler": "node-cron",
  "tasks": [
    "Email sending",
    "PDF generation",
    "GHL sync",
    "Cleanup jobs"
  ]
}
```

### Monitoring & Observability
```javascript
{
  "errors": "Sentry",
  "apm": "New Relic / Datadog / Prometheus",
  "logging": "CloudWatch / Papertrail",
  "uptime": "UptimeRobot / Pingdom",
  "metrics": "PostgreSQL pg_stat_statements"
}
```

### Deployment
```javascript
{
  "containerization": "Docker + Docker Compose",
  "platforms": "AWS ECS / Railway / Render / Fly.io",
  "ci_cd": "GitHub Actions",
  "database": "AWS RDS / Supabase",
  "reverse_proxy": "Nginx or Caddy"
}
```

---

## Authentication & Authorization

### Base URL
```
Production:  https://api.tictacstick.com/v1
Staging:     https://staging-api.tictacstick.com/v1
Development: http://localhost:3000/api/v1
```

### 1.1 Authentication Endpoints

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecureP@ssw0rd123",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+61412345678",
  "organizationName": "Smith Glass & Pressure Cleaning"
}

Response: 201 Created
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001",
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "owner",
    "organizationId": "550e8400-e29b-41d4-a716-446655440002",
    "createdAt": "2025-11-17T10:00:00Z"
  }
}

Errors:
400 - Email already exists
400 - Password too weak (min 8 chars, 1 upper, 1 lower, 1 number)
422 - Invalid email format
429 - Too many registration attempts
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecureP@ssw0rd123",
  "deviceId": "device_abc123" // Optional for sync tracking
}

Response: 200 OK
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001",
  "expiresIn": 3600,
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "owner",
    "organizationId": "550e8400-e29b-41d4-a716-446655440002",
    "permissions": ["*"],
    "preferences": {
      "theme": "dark",
      "timezone": "Australia/Sydney",
      "currency": "AUD"
    }
  }
}

Errors:
401 - Invalid credentials
423 - Account locked (too many failed attempts)
429 - Rate limit exceeded (max 5 attempts per minute)
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001"
}

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440003",
  "expiresIn": 3600
}

Errors:
401 - Invalid or expired refresh token
403 - Refresh token has been revoked
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent if account exists"
}

Note: Always returns 200 to prevent email enumeration
Rate limit: 3 requests per hour per email
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "NewSecureP@ssw0rd456"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successfully"
}

Errors:
400 - Invalid or expired reset token
400 - Password does not meet requirements
429 - Too many reset attempts
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldP@ssw0rd123",
  "newPassword": "NewP@ssw0rd456"
}

Response: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}

Errors:
401 - Current password incorrect
400 - New password does not meet requirements
```

### 1.2 Authorization System

#### JWT Payload Structure
```javascript
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "owner", // owner, admin, technician, viewer
  "organizationId": "550e8400-e29b-41d4-a716-446655440002",
  "permissions": [
    "quotes:read",
    "quotes:write",
    "quotes:delete",
    "invoices:*",
    "clients:*",
    "team:manage",
    "settings:manage"
  ],
  "iat": 1700222400, // Issued at
  "exp": 1700226000, // Expires (1 hour)
  "jti": "jwt_unique_id" // JWT ID for revocation
}
```

#### Permission System
```javascript
const Permissions = {
  // Quotes
  QUOTES_READ: 'quotes:read',
  QUOTES_WRITE: 'quotes:write',
  QUOTES_DELETE: 'quotes:delete',
  QUOTES_SEND: 'quotes:send',

  // Invoices
  INVOICES_READ: 'invoices:read',
  INVOICES_WRITE: 'invoices:write',
  INVOICES_DELETE: 'invoices:delete',
  INVOICES_SEND: 'invoices:send',
  INVOICES_PAYMENT: 'invoices:payment',

  // Clients
  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',
  CLIENTS_DELETE: 'clients:delete',

  // Team Management
  TEAM_READ: 'team:read',
  TEAM_MANAGE: 'team:manage',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  // Integrations
  INTEGRATIONS_MANAGE: 'integrations:manage',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Files
  FILES_UPLOAD: 'files:upload',
  FILES_DELETE: 'files:delete'
};
```

#### Role Definitions
```javascript
const Roles = {
  OWNER: {
    name: 'Owner',
    description: 'Full system access',
    permissions: ['*'], // Wildcard = all permissions
    color: '#8B5CF6'
  },

  ADMIN: {
    name: 'Admin',
    description: 'Manage quotes, invoices, clients, and team',
    permissions: [
      'quotes:*',
      'invoices:*',
      'clients:*',
      'team:read',
      'team:manage',
      'reports:view',
      'reports:export',
      'files:upload',
      'files:delete'
    ],
    color: '#3B82F6'
  },

  TECHNICIAN: {
    name: 'Technician',
    description: 'Create quotes, view invoices, manage clients',
    permissions: [
      'quotes:read',
      'quotes:write',
      'quotes:send',
      'clients:read',
      'clients:write',
      'invoices:read',
      'reports:view',
      'files:upload'
    ],
    color: '#10B981'
  },

  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to quotes and invoices',
    permissions: [
      'quotes:read',
      'invoices:read',
      'clients:read',
      'reports:view'
    ],
    color: '#6B7280'
  }
};
```

#### Middleware Implementation
```javascript
// Authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (logout)
    const isBlacklisted = await redis.get('blacklist:' + decoded.jti);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }
}

// Permission middleware
function requirePermission(permission) {
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check for wildcard permission (owner)
    if (req.user.permissions.includes('*')) {
      return next();
    }

    // Check for exact permission match
    if (req.user.permissions.includes(permission)) {
      return next();
    }

    // Check for wildcard in permission category (e.g., 'quotes:*')
    const [category] = permission.split(':');
    if (req.user.permissions.includes(category + ':*')) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission: ' + permission,
      code: 'PERMISSION_DENIED',
      requiredPermission: permission
    });
  };
}

// Resource ownership middleware
function requireResourceOwnership(resourceType) {
  return async function(req, res, next) {
    const resourceId = req.params.id;
    const organizationId = req.user.organizationId;

    try {
      const resource = await db[resourceType].findOne({
        where: { uuid: resourceId }
      });

      if (!resource) {
        return res.status(404).json({
          error: 'Not Found',
          message: resourceType + ' not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resource.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking resource ownership',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
}

// Usage examples
app.delete('/api/quotes/:id',
  authenticateJWT,
  requirePermission('quotes:delete'),
  requireResourceOwnership('quotes'),
  deleteQuote
);

app.post('/api/invoices/:id/payments',
  authenticateJWT,
  requirePermission('invoices:payment'),
  requireResourceOwnership('invoices'),
  addPayment
);
```

---

## Core Resource Endpoints

### 2.1 Quotes API

#### List Quotes
```http
GET /api/quotes
Authorization: Bearer <token>
Query Parameters:
  - status: draft|sent|accepted|rejected|expired
  - clientId: UUID
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - search: string (searches client name, quote number)
  - page: number (default: 1)
  - limit: number (default: 50, max: 100)
  - sort: field (prefix with - for desc, e.g., -createdAt)

Response: 200 OK
{
  "quotes": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "quoteNumber": "Q-2025-000123",
      "clientId": "550e8400-e29b-41d4-a716-446655440010",
      "client": {
        "uuid": "550e8400-e29b-41d4-a716-446655440010",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com",
        "phone": "+61412345678"
      },
      "status": "sent",
      "quoteTitle": "Driveway & House Windows",
      "jobType": "residential",
      "subtotal": 1000.00,
      "gst": 100.00,
      "total": 1100.00,
      "validUntil": "2025-12-17T10:00:00Z",
      "createdAt": "2025-11-17T10:00:00Z",
      "updatedAt": "2025-11-17T10:30:00Z",
      "createdBy": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "Admin",
        "lastName": "User"
      },
      "lineItemCount": 5,
      "version": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Single Quote
```http
GET /api/quotes/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "quote": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "quoteNumber": "Q-2025-000123",
    "clientId": "550e8400-e29b-41d4-a716-446655440010",
    "client": {
      "uuid": "550e8400-e29b-41d4-a716-446655440010",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+61412345678",
      "addresses": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440020",
          "type": "service",
          "street": "123 Main St",
          "suburb": "Sydney",
          "state": "NSW",
          "postcode": "2000"
        }
      ]
    },
    "status": "sent",
    "quoteTitle": "Driveway & House Windows",
    "jobType": "residential",
    "clientLocation": "123 Main St, Sydney NSW 2000",
    "lineItems": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440030",
        "type": "window",
        "description": "Standard window 1.5m x 1.2m",
        "quantity": 10,
        "unitPrice": 25.00,
        "subtotal": 250.00,
        "location": "outside",
        "height": "standard"
      },
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440031",
        "type": "pressure",
        "description": "Driveway pressure cleaning",
        "area": 50,
        "unitPrice": 15.00,
        "subtotal": 750.00,
        "surface": "concrete"
      }
    ],
    "subtotal": 1000.00,
    "gst": 100.00,
    "total": 1100.00,
    "internalNotes": "Customer prefers morning appointments",
    "clientNotes": "Professional service with 12-month warranty",
    "photos": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440040",
        "url": "https://cdn.tictacstick.com/photos/abc123.jpg",
        "thumbnail": "https://cdn.tictacstick.com/photos/abc123_thumb.jpg",
        "caption": "Before photo - driveway",
        "uploadedAt": "2025-11-17T09:00:00Z"
      }
    ],
    "validUntil": "2025-12-17T10:00:00Z",
    "sentAt": "2025-11-17T10:30:00Z",
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T10:30:00Z",
    "createdBy": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Admin",
      "lastName": "User"
    },
    "version": 3,
    "ghlOpportunityId": "ghl_opp_456",
    "metadata": {
      "source": "web",
      "deviceId": "device_abc123"
    }
  }
}

Errors:
404 - Quote not found
403 - Access denied (not in your organization)
```

#### Create Quote
```http
POST /api/quotes
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "550e8400-e29b-41d4-a716-446655440010",
  "quoteTitle": "Driveway & House Windows",
  "jobType": "residential",
  "clientLocation": "123 Main St, Sydney NSW 2000",
  "lineItems": [
    {
      "type": "window",
      "description": "Standard window 1.5m x 1.2m",
      "quantity": 10,
      "unitPrice": 25.00,
      "subtotal": 250.00,
      "location": "outside",
      "height": "standard"
    },
    {
      "type": "pressure",
      "description": "Driveway pressure cleaning",
      "area": 50,
      "unitPrice": 15.00,
      "subtotal": 750.00,
      "surface": "concrete"
    }
  ],
  "subtotal": 1000.00,
  "gst": 100.00,
  "total": 1100.00,
  "internalNotes": "Customer prefers morning appointments",
  "clientNotes": "Professional service with 12-month warranty",
  "validUntil": "2025-12-17T10:00:00Z",
  "photoIds": ["550e8400-e29b-41d4-a716-446655440040"]
}

Response: 201 Created
{
  "quote": { /* full quote object */ },
  "quoteNumber": "Q-2025-000123"
}

Errors:
400 - Validation error (missing required fields, invalid data)
404 - Client not found
422 - Business logic error (e.g., subtotal doesn't match line items)
```

#### Update Quote
```http
PUT /api/quotes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "sent",
  "lineItems": [/* updated line items */],
  "subtotal": 1100.00,
  "gst": 110.00,
  "total": 1210.00,
  "version": 3 // Optimistic locking
}

Response: 200 OK
{
  "quote": { /* full updated quote */ },
  "version": 4
}

Errors:
404 - Quote not found
409 - Version conflict (quote was modified by another user)
422 - Cannot modify quote in status 'accepted'
```

#### Partial Update Quote
```http
PATCH /api/quotes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "accepted",
  "version": 3
}

Response: 200 OK
{
  "quote": { /* full updated quote */ },
  "version": 4
}
```

#### Delete Quote (Soft Delete)
```http
DELETE /api/quotes/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "deletedAt": "2025-11-17T10:00:00Z",
  "message": "Quote Q-2025-000123 deleted successfully"
}

Errors:
422 - Cannot delete quote that has been accepted
422 - Cannot delete quote with associated invoice
```

#### Duplicate Quote
```http
POST /api/quotes/:id/duplicate
Authorization: Bearer <token>

Response: 201 Created
{
  "quote": { /* new quote with copied data */ },
  "quoteNumber": "Q-2025-000124",
  "originalQuoteId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Convert Quote to Invoice
```http
POST /api/quotes/:id/convert-to-invoice
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceDate": "2025-11-17",
  "dueDate": "2025-12-17",
  "notes": "Payment due within 30 days"
}

Response: 201 Created
{
  "invoice": { /* full invoice object */ },
  "invoiceNumber": "INV-2025-000045",
  "quoteId": "550e8400-e29b-41d4-a716-446655440000"
}

Errors:
422 - Quote must be in 'accepted' status
422 - Invoice already exists for this quote
```

#### Get Quote History (Audit Trail)
```http
GET /api/quotes/:id/history
Authorization: Bearer <token>

Response: 200 OK
{
  "changes": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440050",
      "timestamp": "2025-11-17T10:30:00Z",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "user": {
        "firstName": "Admin",
        "lastName": "User"
      },
      "action": "update",
      "field": "status",
      "oldValue": "draft",
      "newValue": "sent",
      "version": 3,
      "deviceId": "device_abc123",
      "ipAddress": "203.0.113.42"
    },
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440051",
      "timestamp": "2025-11-17T10:00:00Z",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "user": {
        "firstName": "Admin",
        "lastName": "User"
      },
      "action": "create",
      "field": null,
      "oldValue": null,
      "newValue": null,
      "version": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2
  }
}
```

#### Send Quote via Email
```http
POST /api/quotes/:id/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "john@example.com",
  "cc": ["manager@example.com"],
  "subject": "Quote Q-2025-000123 - Driveway & House Windows",
  "message": "Please find attached your quote. Valid for 30 days.",
  "sendPdf": true
}

Response: 200 OK
{
  "success": true,
  "sentAt": "2025-11-17T10:30:00Z",
  "messageId": "email_msg_123",
  "recipients": ["john@example.com", "manager@example.com"]
}

Errors:
422 - Quote must have status 'draft' or 'sent'
400 - Invalid email address
```

### 2.2 Invoices API

#### List Invoices
```http
GET /api/invoices
Authorization: Bearer <token>
Query Parameters:
  - status: draft|sent|partial|paid|overdue|void
  - clientId: UUID
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - search: string
  - page: number
  - limit: number
  - sort: field

Response: 200 OK
{
  "invoices": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440100",
      "invoiceNumber": "INV-2025-000045",
      "quoteId": "550e8400-e29b-41d4-a716-446655440000",
      "clientId": "550e8400-e29b-41d4-a716-446655440010",
      "client": {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com"
      },
      "status": "sent",
      "total": 1100.00,
      "amountPaid": 0.00,
      "amountDue": 1100.00,
      "invoiceDate": "2025-11-17",
      "dueDate": "2025-12-17",
      "sentAt": "2025-11-17T11:00:00Z",
      "createdAt": "2025-11-17T10:45:00Z",
      "version": 1
    }
  ],
  "pagination": { /* same as quotes */ }
}
```

#### Get Single Invoice
```http
GET /api/invoices/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "invoice": {
    "uuid": "550e8400-e29b-41d4-a716-446655440100",
    "invoiceNumber": "INV-2025-000045",
    "quoteId": "550e8400-e29b-41d4-a716-446655440000",
    "quote": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "quoteNumber": "Q-2025-000123"
    },
    "clientId": "550e8400-e29b-41d4-a716-446655440010",
    "client": { /* full client details */ },
    "status": "sent",
    "lineItems": [/* same structure as quote */],
    "subtotal": 1000.00,
    "gst": 100.00,
    "total": 1100.00,
    "amountPaid": 0.00,
    "amountDue": 1100.00,
    "invoiceDate": "2025-11-17",
    "dueDate": "2025-12-17",
    "notes": "Payment due within 30 days",
    "paymentTerms": "Net 30",
    "paymentMethods": ["Bank transfer", "Credit card", "Cash"],
    "bankDetails": {
      "accountName": "Smith Glass Pty Ltd",
      "bsb": "123-456",
      "accountNumber": "12345678"
    },
    "payments": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440110",
        "amount": 500.00,
        "method": "bank_transfer",
        "reference": "TXN123456",
        "date": "2025-11-20",
        "notes": "Partial payment",
        "createdAt": "2025-11-20T14:30:00Z",
        "createdBy": { /* user details */ }
      }
    ],
    "sentAt": "2025-11-17T11:00:00Z",
    "paidAt": null,
    "createdAt": "2025-11-17T10:45:00Z",
    "updatedAt": "2025-11-20T14:30:00Z",
    "version": 2,
    "ghlInvoiceId": "ghl_inv_789"
  }
}
```

#### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "quoteId": "550e8400-e29b-41d4-a716-446655440000", // Optional
  "clientId": "550e8400-e29b-41d4-a716-446655440010",
  "lineItems": [/* line items */],
  "subtotal": 1000.00,
  "gst": 100.00,
  "total": 1100.00,
  "invoiceDate": "2025-11-17",
  "dueDate": "2025-12-17",
  "notes": "Payment due within 30 days",
  "paymentTerms": "Net 30"
}

Response: 201 Created
{
  "invoice": { /* full invoice object */ },
  "invoiceNumber": "INV-2025-000045"
}
```

#### Update Invoice
```http
PUT /api/invoices/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "sent",
  "dueDate": "2025-12-31",
  "notes": "Extended payment terms",
  "version": 1
}

Response: 200 OK
{
  "invoice": { /* updated invoice */ },
  "version": 2
}

Errors:
422 - Cannot modify paid invoice
422 - Cannot modify void invoice
```

#### Add Payment to Invoice
```http
POST /api/invoices/:id/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00,
  "method": "bank_transfer", // bank_transfer, card, cash, cheque, other
  "reference": "TXN123456",
  "date": "2025-11-20",
  "notes": "Partial payment received"
}

Response: 201 Created
{
  "invoice": { /* updated invoice with new status */ },
  "payment": {
    "uuid": "550e8400-e29b-41d4-a716-446655440110",
    "amount": 500.00,
    "method": "bank_transfer",
    "reference": "TXN123456",
    "date": "2025-11-20",
    "notes": "Partial payment received",
    "createdAt": "2025-11-20T14:30:00Z"
  },
  "newStatus": "partial", // or 'paid' if fully paid
  "amountPaid": 500.00,
  "amountDue": 600.00
}

Errors:
400 - Payment amount exceeds outstanding balance
422 - Cannot add payment to void invoice
422 - Payment amount must be positive
```

#### List Payments for Invoice
```http
GET /api/invoices/:id/payments
Authorization: Bearer <token>

Response: 200 OK
{
  "payments": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440110",
      "amount": 500.00,
      "method": "bank_transfer",
      "reference": "TXN123456",
      "date": "2025-11-20",
      "notes": "Partial payment received",
      "createdAt": "2025-11-20T14:30:00Z",
      "createdBy": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ],
  "totalPaid": 500.00,
  "totalDue": 600.00
}
```

#### Delete Payment
```http
DELETE /api/invoices/:id/payments/:paymentId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "invoice": { /* updated invoice with recalculated status */ },
  "deletedAt": "2025-11-21T09:00:00Z"
}

Errors:
404 - Payment not found
422 - Cannot delete payment from void invoice
```

#### Get Invoice PDF
```http
GET /api/invoices/:id/pdf
Authorization: Bearer <token>
Query Parameters:
  - template: standard|detailed|minimal (default: standard)
  - download: true|false (default: false, if true forces download)

Response: 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="INV-2025-000045.pdf"

[PDF Binary Data]

Or for async generation:
Response: 202 Accepted
{
  "jobId": "job_abc123",
  "status": "processing",
  "estimatedTime": 5000, // ms
  "pollUrl": "/api/jobs/job_abc123"
}
```

#### Send Invoice via Email
```http
POST /api/invoices/:id/send-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "john@example.com",
  "cc": [],
  "subject": "Invoice INV-2025-000045 - Payment Due",
  "message": "Please find attached your invoice. Payment is due by 2025-12-17.",
  "attachPdf": true
}

Response: 200 OK
{
  "success": true,
  "sentAt": "2025-11-17T11:00:00Z",
  "messageId": "email_msg_456",
  "recipients": ["john@example.com"]
}
```

#### Void Invoice
```http
POST /api/invoices/:id/void
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Duplicate invoice created in error"
}

Response: 200 OK
{
  "invoice": { /* invoice with status 'void' */ },
  "voidedAt": "2025-11-21T10:00:00Z",
  "voidedBy": { /* user details */ }
}

Errors:
422 - Cannot void invoice with payments (refund payments first)
422 - Invoice is already void
```

### 2.3 Clients API

#### List Clients
```http
GET /api/clients
Authorization: Bearer <token>
Query Parameters:
  - search: string (searches name, email, phone)
  - segment: residential|commercial|industrial
  - status: active|inactive
  - page: number
  - limit: number
  - sort: field

Response: 200 OK
{
  "clients": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440010",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "phone": "+61412345678",
      "segment": "residential",
      "status": "active",
      "addresses": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440020",
          "type": "service",
          "street": "123 Main St",
          "suburb": "Sydney",
          "state": "NSW",
          "postcode": "2000",
          "isPrimary": true
        }
      ],
      "totalQuotes": 5,
      "totalInvoiced": 5500.00,
      "totalPaid": 5000.00,
      "outstanding": 500.00,
      "lastJobDate": "2025-11-15",
      "createdAt": "2025-01-15T10:00:00Z",
      "ghlContactId": "ghl_contact_123"
    }
  ],
  "pagination": { /* standard pagination */ }
}
```

#### Get Single Client
```http
GET /api/clients/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "client": {
    "uuid": "550e8400-e29b-41d4-a716-446655440010",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "+61412345678",
    "alternatePhone": "+61298765432",
    "segment": "residential",
    "status": "active",
    "companyName": null,
    "abn": null,
    "addresses": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440020",
        "type": "service",
        "street": "123 Main St",
        "suburb": "Sydney",
        "state": "NSW",
        "postcode": "2000",
        "isPrimary": true,
        "notes": "Access via side gate"
      },
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440021",
        "type": "billing",
        "street": "456 Other St",
        "suburb": "Sydney",
        "state": "NSW",
        "postcode": "2001",
        "isPrimary": false
      }
    ],
    "preferences": {
      "preferredContact": "email",
      "marketingConsent": true,
      "preferredDays": ["Monday", "Tuesday"],
      "preferredTime": "morning"
    },
    "notes": "Prefers morning appointments. Has 2 dogs.",
    "tags": ["vip", "referral"],
    "customFields": {
      "propertyType": "house",
      "gateCode": "1234#"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-11-17T09:00:00Z",
    "ghlContactId": "ghl_contact_123"
  }
}
```

#### Create Client
```http
POST /api/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+61412345678",
  "segment": "residential",
  "addresses": [
    {
      "type": "service",
      "street": "123 Main St",
      "suburb": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "isPrimary": true
    }
  ],
  "notes": "Prefers morning appointments",
  "preferences": {
    "preferredContact": "email"
  }
}

Response: 201 Created
{
  "client": { /* full client object */ }
}

Errors:
400 - Email already exists
400 - Invalid phone number format
422 - At least one address required
```

#### Update Client
```http
PUT /api/clients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "+61412345679",
  "addresses": [/* updated addresses */],
  "notes": "Updated notes"
}

Response: 200 OK
{
  "client": { /* updated client */ }
}
```

#### Delete Client (Soft Delete)
```http
DELETE /api/clients/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "deletedAt": "2025-11-17T10:00:00Z"
}

Errors:
422 - Cannot delete client with active invoices
422 - Cannot delete client with outstanding balance
```

#### Get Client Quotes
```http
GET /api/clients/:id/quotes
Authorization: Bearer <token>
Query Parameters:
  - status: draft|sent|accepted|rejected
  - page: number
  - limit: number

Response: 200 OK
{
  "quotes": [/* array of quote objects */],
  "pagination": { /* standard pagination */ }
}
```

#### Get Client Invoices
```http
GET /api/clients/:id/invoices
Authorization: Bearer <token>
Query Parameters:
  - status: draft|sent|partial|paid|overdue|void
  - page: number
  - limit: number

Response: 200 OK
{
  "invoices": [/* array of invoice objects */],
  "pagination": { /* standard pagination */ }
}
```

#### Get Client Statistics
```http
GET /api/clients/:id/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "totalQuotes": 15,
  "acceptedQuotes": 12,
  "conversionRate": 0.80,
  "totalInvoiced": 12500.00,
  "totalPaid": 10000.00,
  "outstanding": 2500.00,
  "overdue": 500.00,
  "lifetimeValue": 12500.00,
  "averageQuoteValue": 833.33,
  "averageInvoiceValue": 1041.67,
  "firstJobDate": "2025-01-20",
  "lastJobDate": "2025-10-15",
  "totalJobs": 12,
  "paymentHistory": {
    "onTime": 10,
    "late": 2,
    "averageDaysToPayment": 15
  }
}
```

### 2.4 Users & Teams API

#### Get Current User Profile
```http
GET /api/users/me
Authorization: Bearer <token>

Response: 200 OK
{
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+61412345678",
    "role": "owner",
    "permissions": ["*"],
    "organizationId": "550e8400-e29b-41d4-a716-446655440002",
    "organization": {
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Smith Glass & Pressure Cleaning",
      "abn": "12 345 678 901",
      "phone": "+61298765432",
      "email": "info@smithglass.com.au",
      "address": "789 Business St, Sydney NSW 2000",
      "logo": "https://cdn.tictacstick.com/logos/org_logo.png",
      "subscription": {
        "plan": "pro",
        "status": "active",
        "expiresAt": "2026-11-17T00:00:00Z"
      }
    },
    "preferences": {
      "theme": "dark",
      "timezone": "Australia/Sydney",
      "currency": "AUD",
      "dateFormat": "DD/MM/YYYY",
      "notifications": {
        "email": true,
        "push": true,
        "quoteAccepted": true,
        "invoicePaid": true,
        "paymentOverdue": true
      }
    },
    "lastLoginAt": "2025-11-17T09:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Update Current User Profile
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+61412345678",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}

Response: 200 OK
{
  "user": { /* updated user profile */ }
}
```

#### List Organization Users
```http
GET /api/organizations/:id/users
Authorization: Bearer <token>

Response: 200 OK
{
  "users": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "owner",
      "permissions": ["*"],
      "status": "active",
      "lastLoginAt": "2025-11-17T09:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440001",
      "email": "tech@example.com",
      "firstName": "Tech",
      "lastName": "User",
      "role": "technician",
      "permissions": ["quotes:read", "quotes:write", "clients:read"],
      "status": "active",
      "lastLoginAt": "2025-11-16T14:30:00Z",
      "createdAt": "2025-02-15T00:00:00Z"
    }
  ]
}
```

#### Invite User to Organization
```http
POST /api/organizations/:id/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "role": "technician",
  "permissions": ["quotes:read", "quotes:write", "clients:read"]
}

Response: 201 Created
{
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440003",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "technician",
    "status": "invited",
    "invitedAt": "2025-11-17T10:00:00Z"
  },
  "inviteLink": "https://app.tictacstick.com/accept-invite?token=invite_abc123",
  "inviteExpiresAt": "2025-11-24T10:00:00Z"
}

Errors:
400 - User with this email already exists in organization
422 - Invalid role or permissions
```

#### Update User Role/Permissions
```http
PUT /api/organizations/:id/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "permissions": ["quotes:*", "invoices:*", "clients:*"]
}

Response: 200 OK
{
  "user": { /* updated user */ }
}

Errors:
403 - Only owners can modify owner roles
422 - Cannot remove last owner from organization
```

#### Remove User from Organization
```http
DELETE /api/organizations/:id/users/:userId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "removedAt": "2025-11-17T10:00:00Z"
}

Errors:
422 - Cannot remove last owner from organization
422 - Cannot remove yourself (use different account)
```

---

## Real-Time Sync API

### 3.1 Sync Protocol Overview

The sync protocol enables offline-first operation with:
- **Optimistic locking** via version numbers
- **Conflict resolution** when multiple devices edit the same resource
- **Incremental sync** - only changed entities since last sync
- **Push/Pull model** - clients push changes, pull updates
- **WebSocket notifications** - real-time updates to connected clients

### 3.2 Push Changes to Server

```http
POST /api/sync/push
Authorization: Bearer <token>
Headers:
  X-Device-Id: device_abc123
  X-Last-Sync: 2025-11-17T10:00:00Z
Content-Type: application/json

{
  "changes": [
    {
      "entity": "quote",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "action": "update", // insert, update, delete
      "version": 5,
      "data": {
        "status": "sent",
        "subtotal": 1100.00,
        "gst": 110.00,
        "total": 1210.00,
        "updatedAt": "2025-11-17T10:30:00Z"
      },
      "timestamp": "2025-11-17T10:30:00Z"
    },
    {
      "entity": "client",
      "uuid": "550e8400-e29b-41d4-a716-446655440010",
      "action": "insert",
      "version": 1,
      "data": {
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "createdAt": "2025-11-17T10:25:00Z"
      },
      "timestamp": "2025-11-17T10:25:00Z"
    },
    {
      "entity": "invoice",
      "uuid": "550e8400-e29b-41d4-a716-446655440100",
      "action": "delete",
      "version": 3,
      "timestamp": "2025-11-17T10:28:00Z"
    }
  ]
}

Response: 200 OK
{
  "accepted": [
    "550e8400-e29b-41d4-a716-446655440010"
  ],
  "conflicts": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "entity": "quote",
      "conflict": "version_mismatch",
      "localVersion": 5,
      "serverVersion": 6,
      "serverData": {
        "status": "accepted",
        "subtotal": 1200.00,
        "updatedAt": "2025-11-17T10:29:00Z",
        "updatedBy": {
          "uuid": "550e8400-e29b-41d4-a716-446655440001",
          "firstName": "Other",
          "lastName": "User"
        }
      },
      "resolutionStrategies": [
        "server_wins",
        "client_wins",
        "manual_merge"
      ]
    }
  ],
  "errors": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440100",
      "entity": "invoice",
      "error": "validation_failed",
      "message": "Cannot delete paid invoice",
      "code": "INVOICE_PAID"
    }
  ],
  "serverTimestamp": "2025-11-17T10:31:00Z"
}
```

### 3.3 Pull Changes from Server

```http
GET /api/sync/pull
Authorization: Bearer <token>
Query Parameters:
  - since: ISO timestamp (e.g., 2025-11-17T10:00:00Z)
  - entities: comma-separated list (e.g., quotes,invoices,clients)
  - limit: number (default: 100, max: 500)

Response: 200 OK
{
  "changes": [
    {
      "entity": "quote",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "action": "update",
      "version": 6,
      "data": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "status": "accepted",
        "subtotal": 1200.00,
        "gst": 120.00,
        "total": 1320.00,
        "updatedAt": "2025-11-17T10:29:00Z",
        "updatedBy": "550e8400-e29b-41d4-a716-446655440001"
      },
      "timestamp": "2025-11-17T10:29:00Z",
      "deviceId": "device_xyz789",
      "userId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "entity": "invoice",
      "uuid": "550e8400-e29b-41d4-a716-446655440100",
      "action": "delete",
      "version": 4,
      "deletedAt": "2025-11-17T10:32:00Z",
      "timestamp": "2025-11-17T10:32:00Z"
    },
    {
      "entity": "client",
      "uuid": "550e8400-e29b-41d4-a716-446655440011",
      "action": "insert",
      "version": 1,
      "data": { /* full client object */ },
      "timestamp": "2025-11-17T10:35:00Z"
    }
  ],
  "timestamp": "2025-11-17T10:35:00Z",
  "hasMore": false
}
```

### 3.4 Get Sync Status

```http
GET /api/sync/status
Authorization: Bearer <token>
Headers:
  X-Device-Id: device_abc123

Response: 200 OK
{
  "device": {
    "deviceId": "device_abc123",
    "deviceName": "iPad Pro",
    "lastSync": "2025-11-17T10:30:00Z",
    "syncStatus": "synced", // syncing, synced, error, offline
    "pendingChanges": 0
  },
  "organization": {
    "lastChange": "2025-11-17T10:35:00Z",
    "activeDevices": 3,
    "devices": [
      {
        "deviceId": "device_abc123",
        "deviceName": "iPad Pro",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "lastSync": "2025-11-17T10:30:00Z",
        "status": "synced"
      },
      {
        "deviceId": "device_xyz789",
        "deviceName": "iPhone 13",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "lastSync": "2025-11-17T10:35:00Z",
        "status": "synced"
      }
    ]
  },
  "conflicts": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "entity": "quote",
      "detectedAt": "2025-11-17T10:31:00Z"
    }
  ]
}
```

### 3.5 Resolve Sync Conflict

```http
POST /api/sync/resolve-conflict
Authorization: Bearer <token>
Content-Type: application/json

{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "entity": "quote",
  "resolution": "server_wins", // server_wins, client_wins, merged
  "mergedData": {
    // Only required if resolution = "merged"
    "status": "accepted",
    "subtotal": 1200.00,
    "gst": 120.00,
    "total": 1320.00
  }
}

Response: 200 OK
{
  "success": true,
  "resolvedData": { /* final resolved data */ },
  "version": 7,
  "resolvedAt": "2025-11-17T10:40:00Z"
}
```

### 3.6 WebSocket for Real-Time Updates

#### Connection
```javascript
// Client connects
const ws = new WebSocket('wss://api.tictacstick.com/ws?token=' + jwtToken);

ws.onopen = function() {
  // Subscribe to entity updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    entities: ['quotes', 'invoices', 'clients'],
    deviceId: 'device_abc123'
  }));
};

// Server responds
{
  "type": "subscribed",
  "entities": ["quotes", "invoices", "clients"],
  "timestamp": "2025-11-17T10:00:00Z"
}
```

#### Receiving Updates
```javascript
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);

  switch(message.type) {
    case 'update':
      handleEntityUpdate(message);
      break;
    case 'delete':
      handleEntityDelete(message);
      break;
    case 'conflict':
      handleConflict(message);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
};

// Update message format
{
  "type": "update",
  "entity": "quote",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "action": "update",
  "version": 6,
  "data": { /* updated quote data */ },
  "timestamp": "2025-11-17T10:35:00Z",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "deviceId": "device_xyz789",
  "messageId": "msg_abc123"
}

// Client acknowledges
ws.send(JSON.stringify({
  type: 'ack',
  messageId: 'msg_abc123'
}));
```

#### Heartbeat
```javascript
// Server sends ping every 30 seconds
{
  "type": "ping",
  "timestamp": "2025-11-17T10:35:30Z"
}

// Client responds
{
  "type": "pong",
  "timestamp": "2025-11-17T10:35:30Z"
}
```

#### Unsubscribe
```javascript
// Client unsubscribes
ws.send(JSON.stringify({
  type: 'unsubscribe',
  entities: ['invoices']
}));

// Server confirms
{
  "type": "unsubscribed",
  "entities": ["invoices"],
  "timestamp": "2025-11-17T10:40:00Z"
}
```

### 3.7 Conflict Resolution Strategies

#### Server Wins (Default for most cases)
```javascript
{
  "strategy": "server_wins",
  "rationale": "Server data is authoritative",
  "action": "Overwrite local changes with server data",
  "use_cases": [
    "Status changes (draft → sent → accepted)",
    "Financial data (amounts, totals)",
    "Deletion actions"
  ]
}
```

#### Client Wins (User preference)
```javascript
{
  "strategy": "client_wins",
  "rationale": "Trust local user's changes",
  "action": "Push local changes to server, increment version",
  "use_cases": [
    "User explicitly chooses to keep their changes",
    "Minor field updates (notes, internal comments)",
    "Field-level merging not possible"
  ]
}
```

#### Automatic Field-Level Merge
```javascript
{
  "strategy": "auto_merge",
  "rationale": "Different fields were modified",
  "action": "Merge non-conflicting field changes",
  "example": {
    "server": {
      "status": "sent", // changed by user A
      "clientNotes": "Original notes"
    },
    "client": {
      "status": "draft",
      "clientNotes": "Updated notes" // changed by user B
    },
    "merged": {
      "status": "sent", // from server
      "clientNotes": "Updated notes" // from client
    }
  },
  "use_cases": [
    "Non-overlapping field modifications",
    "Metadata vs content changes"
  ]
}
```

#### Manual Resolution Required
```javascript
{
  "strategy": "manual",
  "rationale": "Same field modified by multiple users",
  "action": "Present both versions to user for decision",
  "example": {
    "field": "subtotal",
    "serverValue": 1200.00,
    "clientValue": 1100.00,
    "modifiedBy": {
      "server": "User A",
      "client": "User B (you)"
    }
  }
}
```

---

## GoHighLevel Integration

### 4.1 Overview

TicTacStick integrates bidirectionally with GoHighLevel CRM:

**Push to GHL:**
- New clients → GHL Contacts
- Quotes → GHL Opportunities
- Invoices → GHL Invoices
- Payment status updates

**Pull from GHL:**
- Contact updates → Update clients
- Opportunity status → Update quotes
- Invoice payments → Record payments

### 4.2 GHL Configuration

#### Connect to GoHighLevel
```http
POST /api/integrations/ghl/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "apiKey": "ghl_api_key_here",
  "locationId": "ghl_loc_123456",
  "webhookSecret": "webhook_secret_here" // For verifying webhooks
}

Response: 200 OK
{
  "connected": true,
  "locationId": "ghl_loc_123456",
  "locationName": "Smith Glass & Pressure Cleaning",
  "connectedAt": "2025-11-17T10:00:00Z",
  "features": {
    "contacts": true,
    "opportunities": true,
    "invoices": true,
    "webhooks": true
  }
}

Errors:
400 - Invalid API key
403 - Insufficient permissions
422 - Location not found
```

#### Get GHL Connection Status
```http
GET /api/integrations/ghl/status
Authorization: Bearer <token>

Response: 200 OK
{
  "connected": true,
  "locationId": "ghl_loc_123456",
  "locationName": "Smith Glass & Pressure Cleaning",
  "lastSync": "2025-11-17T10:00:00Z",
  "syncStatus": "healthy", // healthy, degraded, error, disconnected
  "health": {
    "apiStatus": "operational",
    "lastSuccessfulCall": "2025-11-17T10:00:00Z",
    "failedCallsLast24h": 0,
    "rateLimitStatus": "ok"
  },
  "quota": {
    "used": 1250,
    "limit": 5000,
    "resetAt": "2025-11-18T00:00:00Z"
  },
  "sync Stats": {
    "contactsSynced": 45,
    "opportunitiesSynced": 85,
    "invoicesSynced": 60,
    "lastSyncDuration": 3500 // ms
  }
}
```

#### Disconnect from GoHighLevel
```http
DELETE /api/integrations/ghl/disconnect
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "disconnectedAt": "2025-11-17T11:00:00Z",
  "message": "GoHighLevel integration disconnected"
}
```

### 4.3 Push Data to GoHighLevel

#### Push Client to GHL Contact
```http
POST /api/integrations/ghl/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "550e8400-e29b-41d4-a716-446655440010",
  "customFields": {
    "customer_segment": "residential",
    "preferred_day": "Monday"
  }
}

Response: 201 Created
{
  "success": true,
  "ghlContactId": "ghl_contact_123",
  "ghlUrl": "https://app.gohighlevel.com/location/ghl_loc_123456/contacts/ghl_contact_123",
  "syncedAt": "2025-11-17T10:30:00Z",
  "fieldssynced": [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "customFields"
  ]
}

Errors:
404 - Client not found
409 - Contact already exists in GHL (returns existing ghlContactId)
422 - GHL API error (rate limit, invalid data, etc.)
```

#### Push Quote to GHL Opportunity
```http
POST /api/integrations/ghl/opportunities
Authorization: Bearer <token>
Content-Type: application/json

{
  "quoteId": "550e8400-e29b-41d4-a716-446655440000",
  "pipelineId": "ghl_pipeline_123", // Optional, uses default if not specified
  "stageId": "ghl_stage_456", // Optional, maps from quote status
  "assignedTo": "ghl_user_789" // Optional, GHL user ID
}

Response: 201 Created
{
  "success": true,
  "ghlOpportunityId": "ghl_opp_456",
  "ghlUrl": "https://app.gohighlevel.com/location/ghl_loc_123456/opportunities/ghl_opp_456",
  "syncedAt": "2025-11-17T10:35:00Z",
  "mappings": {
    "quote_status_draft": "ghl_stage_new",
    "quote_status_sent": "ghl_stage_proposal_sent",
    "quote_status_accepted": "ghl_stage_won",
    "quote_status_rejected": "ghl_stage_lost"
  }
}
```

#### Push Invoice to GHL
```http
POST /api/integrations/ghl/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": "550e8400-e29b-41d4-a716-446655440100"
}

Response: 201 Created
{
  "success": true,
  "ghlInvoiceId": "ghl_inv_789",
  "ghlUrl": "https://app.gohighlevel.com/location/ghl_loc_123456/invoices/ghl_inv_789",
  "syncedAt": "2025-11-17T10:40:00Z"
}

Errors:
404 - Invoice not found
409 - Invoice already exists in GHL
422 - Client must be synced to GHL first
```

#### Update GHL Invoice Payment Status
```http
POST /api/integrations/ghl/invoices/:ghlInvoiceId/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "paid", // paid, partial, overdue
  "amountPaid": 1100.00,
  "paidAt": "2025-11-20T14:30:00Z"
}

Response: 200 OK
{
  "success": true,
  "updatedAt": "2025-11-20T14:30:00Z"
}
```

### 4.4 Receive Webhooks from GoHighLevel

#### GHL Contact Created/Updated
```http
POST /api/webhooks/ghl/contact
Headers:
  X-GHL-Signature: sha256_hmac_signature
  Content-Type: application/json

{
  "type": "contact.created", // or contact.updated
  "locationId": "ghl_loc_123456",
  "contactId": "ghl_contact_123",
  "data": {
    "id": "ghl_contact_123",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "+61412345678",
    "address1": "123 Main St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "customFields": {
      "customer_segment": "residential",
      "property_type": "house"
    },
    "tags": ["vip", "referral"],
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T10:30:00Z"
  }
}

Response: 200 OK
{
  "success": true,
  "clientId": "550e8400-e29b-41d4-a716-446655440010",
  "action": "created", // created, updated, skipped
  "message": "Client created from GHL contact"
}

Webhook Signature Verification:
const signature = req.headers['x-ghl-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

#### GHL Opportunity Updated
```http
POST /api/webhooks/ghl/opportunity
Headers:
  X-GHL-Signature: sha256_hmac_signature
  Content-Type: application/json

{
  "type": "opportunity.updated",
  "locationId": "ghl_loc_123456",
  "opportunityId": "ghl_opp_456",
  "data": {
    "id": "ghl_opp_456",
    "contactId": "ghl_contact_123",
    "pipelineId": "ghl_pipeline_123",
    "pipelineStageId": "ghl_stage_won",
    "status": "won", // won, lost, abandoned, open
    "monetaryValue": 1100.00,
    "name": "Driveway & House Windows",
    "customFields": {
      "quote_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "updatedAt": "2025-11-17T11:00:00Z"
  }
}

Response: 200 OK
{
  "success": true,
  "quoteId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "updated",
  "updatedFields": ["status"],
  "message": "Quote status updated from GHL opportunity"
}

Status Mapping:
- GHL "won" → Quote "accepted"
- GHL "lost" → Quote "rejected"
- GHL "open" → Quote "sent"
```

#### GHL Invoice Paid
```http
POST /api/webhooks/ghl/invoice-paid
Headers:
  X-GHL-Signature: sha256_hmac_signature
  Content-Type: application/json

{
  "type": "invoice.paid",
  "locationId": "ghl_loc_123456",
  "invoiceId": "ghl_inv_789",
  "data": {
    "id": "ghl_inv_789",
    "contactId": "ghl_contact_123",
    "status": "paid",
    "totalAmount": 1100.00,
    "paidAmount": 1100.00,
    "paymentMethod": "card",
    "paidAt": "2025-11-20T14:30:00Z",
    "transactionId": "ghl_txn_abc123"
  }
}

Response: 200 OK
{
  "success": true,
  "invoiceId": "550e8400-e29b-41d4-a716-446655440100",
  "paymentId": "550e8400-e29b-41d4-a716-446655440110",
  "action": "payment_recorded",
  "message": "Payment recorded from GHL invoice"
}
```

### 4.5 Field Mapping Configuration

```http
GET /api/integrations/ghl/field-mappings
Authorization: Bearer <token>

Response: 200 OK
{
  "contacts": {
    "firstName": "firstName",
    "lastName": "lastName",
    "email": "email",
    "phone": "phone",
    "address": {
      "tts_field": "addresses[0].street",
      "ghl_field": "address1"
    },
    "customFields": {
      "customer_segment": "segment",
      "property_type": "customFields.propertyType",
      "gate_code": "customFields.gateCode"
    }
  },
  "opportunities": {
    "name": "quoteTitle",
    "monetaryValue": "total",
    "status_mapping": {
      "draft": "open",
      "sent": "open",
      "accepted": "won",
      "rejected": "lost",
      "expired": "abandoned"
    },
    "customFields": {
      "quote_id": "uuid",
      "quote_number": "quoteNumber",
      "job_type": "jobType"
    }
  },
  "invoices": {
    "amount": "total",
    "dueDate": "dueDate",
    "status_mapping": {
      "draft": "draft",
      "sent": "sent",
      "partial": "partially_paid",
      "paid": "paid",
      "overdue": "overdue",
      "void": "void"
    }
  }
}

PUT /api/integrations/ghl/field-mappings
Authorization: Bearer <token>
Content-Type: application/json

{
  "contacts": {
    "customFields": {
      "preferred_contact_method": "preferences.preferredContact",
      "marketing_consent": "preferences.marketingConsent"
    }
  }
}

Response: 200 OK
{
  "success": true,
  "updatedAt": "2025-11-17T11:00:00Z"
}
```

### 4.6 Manual Sync Operations

#### Sync All Clients to GHL
```http
POST /api/integrations/ghl/sync/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "mode": "incremental", // incremental (only new/updated) or full
  "updatedSince": "2025-11-01T00:00:00Z" // Optional, for incremental
}

Response: 202 Accepted
{
  "jobId": "sync_job_abc123",
  "status": "processing",
  "estimatedDuration": 30000, // ms
  "totalClients": 45,
  "pollUrl": "/api/jobs/sync_job_abc123"
}

// Poll for status
GET /api/jobs/sync_job_abc123
Authorization: Bearer <token>

Response: 200 OK
{
  "jobId": "sync_job_abc123",
  "status": "completed", // processing, completed, failed, partial
  "progress": {
    "total": 45,
    "processed": 45,
    "successful": 43,
    "failed": 2,
    "skipped": 0
  },
  "results": {
    "created": 10,
    "updated": 33,
    "failed": 2,
    "errors": [
      {
        "clientId": "550e8400-e29b-41d4-a716-446655440015",
        "error": "Invalid email format in GHL",
        "ghlError": "Email validation failed"
      }
    ]
  },
  "startedAt": "2025-11-17T11:00:00Z",
  "completedAt": "2025-11-17T11:00:35Z",
  "duration": 35000 // ms
}
```

#### Sync Single Quote to GHL
```http
POST /api/integrations/ghl/sync/quote/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "ghlOpportunityId": "ghl_opp_456",
  "syncedAt": "2025-11-17T11:05:00Z"
}
```

---

## File Upload & Management

### 5.1 Photo Upload

#### Upload Photo
```http
POST /api/uploads/photos
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - file: (binary photo data)
  - caption: "Before photo - driveway" (optional)
  - tags: ["before", "driveway"] (optional)

Response: 201 Created
{
  "photo": {
    "uuid": "550e8400-e29b-41d4-a716-446655440040",
    "url": "https://cdn.tictacstick.com/photos/550e8400-e29b-41d4-a716-446655440040.jpg",
    "thumbnail": "https://cdn.tictacstick.com/photos/550e8400-e29b-41d4-a716-446655440040_thumb.jpg",
    "filename": "driveway_photo.jpg",
    "size": 245000, // bytes
    "mimeType": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "caption": "Before photo - driveway",
    "tags": ["before", "driveway"],
    "uploadedAt": "2025-11-17T09:00:00Z",
    "uploadedBy": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}

Errors:
400 - File too large (max 10MB)
400 - Invalid file type (must be JPEG, PNG, HEIC)
413 - Request entity too large
```

#### List Photos
```http
GET /api/uploads/photos
Authorization: Bearer <token>
Query Parameters:
  - quoteId: UUID (filter by quote)
  - invoiceId: UUID (filter by invoice)
  - tags: comma-separated (filter by tags)
  - page: number
  - limit: number

Response: 200 OK
{
  "photos": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440040",
      "url": "https://cdn.tictacstick.com/photos/550e8400-e29b-41d4-a716-446655440040.jpg",
      "thumbnail": "https://cdn.tictacstick.com/photos/550e8400-e29b-41d4-a716-446655440040_thumb.jpg",
      "caption": "Before photo - driveway",
      "uploadedAt": "2025-11-17T09:00:00Z"
    }
  ],
  "pagination": { /* standard pagination */ }
}
```

#### Get Photo
```http
GET /api/uploads/photos/:id
Authorization: Bearer <token>

Response: 200 OK (redirect to CDN URL)
Location: https://cdn.tictacstick.com/photos/550e8400-e29b-41d4-a716-446655440040.jpg
```

#### Delete Photo
```http
DELETE /api/uploads/photos/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "deletedAt": "2025-11-17T10:00:00Z"
}

Errors:
422 - Cannot delete photo attached to sent quote/invoice
```

#### Attach Photo to Quote
```http
POST /api/quotes/:id/photos
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoId": "550e8400-e29b-41d4-a716-446655440040",
  "caption": "Before photo - driveway",
  "order": 1
}

Response: 200 OK
{
  "success": true,
  "quote": { /* updated quote with photos array */ }
}
```

#### Detach Photo from Quote
```http
DELETE /api/quotes/:id/photos/:photoId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

### 5.2 PDF Generation

#### Generate Quote PDF
```http
POST /api/generate/quote-pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "quoteId": "550e8400-e29b-41d4-a716-446655440000",
  "template": "standard", // standard, detailed, minimal
  "options": {
    "includePhotos": true,
    "includeTerms": true,
    "includeSignature": false,
    "headerColor": "#4F46E5"
  }
}

Response: 202 Accepted (async generation)
{
  "jobId": "pdf_job_abc123",
  "status": "processing",
  "estimatedTime": 5000, // ms
  "pollUrl": "/api/jobs/pdf_job_abc123"
}

// Poll for completion
GET /api/jobs/pdf_job_abc123
Authorization: Bearer <token>

Response: 200 OK
{
  "jobId": "pdf_job_abc123",
  "status": "completed",
  "pdfUrl": "https://cdn.tictacstick.com/pdfs/Q-2025-000123.pdf",
  "filename": "Q-2025-000123.pdf",
  "size": 1250000, // bytes
  "expiresAt": "2025-11-18T10:00:00Z", // 24 hour expiry
  "generatedAt": "2025-11-17T10:05:00Z"
}

// For synchronous generation (small PDFs)
POST /api/generate/quote-pdf?sync=true
...

Response: 200 OK (returns PDF directly)
Content-Type: application/pdf
Content-Disposition: inline; filename="Q-2025-000123.pdf"

[PDF Binary Data]
```

#### Generate Invoice PDF
```http
POST /api/generate/invoice-pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": "550e8400-e29b-41d4-a716-446655440100",
  "template": "standard",
  "options": {
    "includePaymentStub": true,
    "includeBankDetails": true
  }
}

Response: Similar to quote PDF
```

### 5.3 Document Storage

#### Get Document
```http
GET /api/documents/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "document": {
    "uuid": "550e8400-e29b-41d4-a716-446655440050",
    "type": "quote_pdf", // quote_pdf, invoice_pdf, photo, other
    "relatedEntityId": "550e8400-e29b-41d4-a716-446655440000",
    "relatedEntityType": "quote",
    "url": "https://cdn.tictacstick.com/documents/550e8400-e29b-41d4-a716-446655440050.pdf",
    "filename": "Q-2025-000123.pdf",
    "mimeType": "application/pdf",
    "size": 1250000,
    "createdAt": "2025-11-17T10:05:00Z",
    "expiresAt": "2025-11-18T10:05:00Z"
  }
}
```

---

## Analytics & Reporting

### 6.1 Dashboard Metrics

#### Get Dashboard Overview
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
Query Parameters:
  - dateFrom: YYYY-MM-DD (default: current month start)
  - dateTo: YYYY-MM-DD (default: today)
  - compareWithPrevious: true|false (default: false)

Response: 200 OK
{
  "period": {
    "from": "2025-11-01",
    "to": "2025-11-17",
    "days": 17
  },
  "revenue": {
    "total": 125000.00,
    "invoiced": 125000.00,
    "paid": 110000.00,
    "outstanding": 15000.00,
    "overdue": 5000.00,
    "averageInvoiceValue": 2083.33,
    "trend": {
      "percentage": 15.5,
      "direction": "up",
      "comparedTo": "previous_period"
    }
  },
  "quotes": {
    "total": 85,
    "draft": 5,
    "sent": 10,
    "accepted": 60,
    "rejected": 10,
    "expired": 0,
    "conversionRate": 0.71,
    "averageValue": 1470.59,
    "totalValue": 125000.00,
    "trend": {
      "total": { "percentage": 10.0, "direction": "up" },
      "conversionRate": { "percentage": 5.2, "direction": "up" }
    }
  },
  "invoices": {
    "total": 60,
    "draft": 2,
    "sent": 8,
    "partial": 5,
    "paid": 50,
    "overdue": 5,
    "void": 0,
    "averageValue": 2083.33,
    "averageDaysToPayment": 18,
    "paymentRate": 0.83
  },
  "clients": {
    "total": 45,
    "new": 12,
    "active": 38,
    "inactive": 7,
    "returning": 33,
    "churnRate": 0.05,
    "averageLifetimeValue": 2777.78
  },
  "topClients": [
    {
      "clientId": "550e8400-e29b-41d4-a716-446655440010",
      "name": "John Smith",
      "revenue": 15000.00,
      "jobs": 8,
      "lastJobDate": "2025-11-15"
    },
    {
      "clientId": "550e8400-e29b-41d4-a716-446655440011",
      "name": "Jane Doe",
      "revenue": 12500.00,
      "jobs": 6,
      "lastJobDate": "2025-11-10"
    }
  ],
  "revenueByJobType": [
    { "jobType": "residential", "revenue": 75000.00, "percentage": 0.60 },
    { "jobType": "commercial", "revenue": 40000.00, "percentage": 0.32 },
    { "jobType": "industrial", "revenue": 10000.00, "percentage": 0.08 }
  ],
  "revenueByService": [
    { "service": "window_cleaning", "revenue": 60000.00, "percentage": 0.48 },
    { "service": "pressure_cleaning", "revenue": 50000.00, "percentage": 0.40 },
    { "service": "both", "revenue": 15000.00, "percentage": 0.12 }
  ]
}
```

### 6.2 Revenue Reports

#### Revenue Over Time
```http
GET /api/reports/revenue
Authorization: Bearer <token>
Query Parameters:
  - groupBy: day|week|month|quarter|year
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - metric: invoiced|paid|outstanding (default: paid)

Response: 200 OK
{
  "report": {
    "title": "Revenue Report",
    "period": { "from": "2025-01-01", "to": "2025-11-17" },
    "groupBy": "month",
    "metric": "paid"
  },
  "data": [
    {
      "period": "2025-01",
      "periodLabel": "January 2025",
      "revenue": 10000.00,
      "invoices": 8,
      "jobs": 8,
      "averageValue": 1250.00
    },
    {
      "period": "2025-02",
      "periodLabel": "February 2025",
      "revenue": 12500.00,
      "invoices": 10,
      "jobs": 10,
      "averageValue": 1250.00
    },
    {
      "period": "2025-03",
      "periodLabel": "March 2025",
      "revenue": 15000.00,
      "invoices": 12,
      "jobs": 12,
      "averageValue": 1250.00
    }
  ],
  "totals": {
    "revenue": 125000.00,
    "invoices": 60,
    "jobs": 60,
    "averageValue": 2083.33
  },
  "trends": {
    "growthRate": 0.15,
    "bestMonth": { "period": "2025-10", "revenue": 18000.00 },
    "worstMonth": { "period": "2025-01", "revenue": 10000.00 }
  }
}
```

### 6.3 Quote Conversion Reports

```http
GET /api/reports/quote-conversion
Authorization: Bearer <token>
Query Parameters:
  - groupBy: day|week|month
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD

Response: 200 OK
{
  "report": {
    "title": "Quote Conversion Report",
    "period": { "from": "2025-01-01", "to": "2025-11-17" }
  },
  "data": [
    {
      "period": "2025-W01",
      "periodLabel": "Week 1, 2025",
      "sent": 5,
      "accepted": 4,
      "rejected": 1,
      "expired": 0,
      "pending": 0,
      "conversionRate": 0.80,
      "averageDaysToAccept": 3.5
    },
    {
      "period": "2025-W02",
      "periodLabel": "Week 2, 2025",
      "sent": 6,
      "accepted": 5,
      "rejected": 0,
      "expired": 0,
      "pending": 1,
      "conversionRate": 0.83,
      "averageDaysToAccept": 2.8
    }
  ],
  "totals": {
    "sent": 85,
    "accepted": 60,
    "rejected": 10,
    "expired": 0,
    "pending": 15,
    "overallConversionRate": 0.71,
    "averageDaysToAccept": 4.2
  },
  "insights": [
    "Conversion rate is 71%, which is above industry average (60%)",
    "Monday quotes have highest conversion (85%)",
    "Quotes under $1500 convert 15% better than larger quotes"
  ]
}
```

### 6.4 Aging Report (Outstanding Invoices)

```http
GET /api/reports/aging
Authorization: Bearer <token>
Query Parameters:
  - asOf: YYYY-MM-DD (default: today)
  - groupBy: client|invoice (default: client)

Response: 200 OK
{
  "report": {
    "title": "Accounts Receivable Aging Report",
    "asOf": "2025-11-17"
  },
  "summary": {
    "current": 50000.00,      // 0-30 days
    "thirtyDays": 10000.00,   // 30-60 days
    "sixtyDays": 3000.00,     // 60-90 days
    "ninetyDays": 2000.00,    // 90+ days
    "total": 65000.00
  },
  "byClient": [
    {
      "clientId": "550e8400-e29b-41d4-a716-446655440010",
      "clientName": "John Smith",
      "current": 1000.00,
      "thirtyDays": 500.00,
      "sixtyDays": 0.00,
      "ninetyDays": 0.00,
      "total": 1500.00,
      "oldestInvoiceDate": "2025-10-15",
      "oldestInvoiceNumber": "INV-2025-000032"
    }
  ],
  "insights": [
    "5 invoices are 60+ days overdue (total: $5,000.00)",
    "Client 'ABC Corp' has $2,000 overdue 90+ days"
  ]
}
```

### 6.5 Custom Reports

```http
POST /api/reports/custom
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Residential Revenue by Suburb",
  "entity": "invoices",
  "filters": {
    "status": ["paid", "partial"],
    "jobType": "residential",
    "dateFrom": "2025-01-01",
    "dateTo": "2025-11-17"
  },
  "groupBy": "client.addresses[0].suburb",
  "metrics": ["sum(total)", "count(*)", "avg(total)"],
  "orderBy": "sum(total) DESC",
  "limit": 10
}

Response: 200 OK
{
  "report": {
    "title": "Residential Revenue by Suburb",
    "generatedAt": "2025-11-17T11:00:00Z"
  },
  "data": [
    {
      "suburb": "Sydney",
      "revenue": 35000.00,
      "count": 18,
      "average": 1944.44
    },
    {
      "suburb": "Parramatta",
      "revenue": 22000.00,
      "count": 12,
      "average": 1833.33
    }
  ]
}
```

---

## Error Handling

### 7.1 Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "code": "INVALID_EMAIL",
  "field": "email",
  "details": {
    "email": "Must be a valid email address"
  },
  "timestamp": "2025-11-17T10:00:00Z",
  "requestId": "req_550e8400e29b41d4a716446655440000",
  "path": "/api/auth/register",
  "method": "POST"
}
```

### 7.2 HTTP Status Codes

```javascript
const StatusCodes = {
  // Success
  200: {
    name: "OK",
    use: "Successful GET, PUT, PATCH requests",
    example: "Fetched quote successfully"
  },
  201: {
    name: "Created",
    use: "Successful POST request that created a resource",
    example: "Quote created successfully"
  },
  202: {
    name: "Accepted",
    use: "Request accepted for async processing",
    example: "PDF generation started"
  },
  204: {
    name: "No Content",
    use: "Successful DELETE request",
    example: "Quote deleted successfully"
  },

  // Client Errors
  400: {
    name: "Bad Request",
    use: "Validation error, malformed JSON, missing required fields",
    example: "Missing required field: clientId"
  },
  401: {
    name: "Unauthorized",
    use: "Missing, invalid, or expired authentication token",
    example: "Token has expired"
  },
  403: {
    name: "Forbidden",
    use: "Valid token but insufficient permissions",
    example: "You do not have permission: quotes:delete"
  },
  404: {
    name: "Not Found",
    use: "Resource doesn't exist",
    example: "Quote not found"
  },
  409: {
    name: "Conflict",
    use: "Version conflict, duplicate resource, concurrent modification",
    example: "Quote was modified by another user (version mismatch)"
  },
  422: {
    name: "Unprocessable Entity",
    use: "Business logic error, invalid state transition",
    example: "Cannot delete paid invoice"
  },
  429: {
    name: "Too Many Requests",
    use: "Rate limit exceeded",
    example: "Rate limit exceeded. Try again in 60 seconds."
  },

  // Server Errors
  500: {
    name: "Internal Server Error",
    use: "Unexpected server error (log & alert team)",
    example: "An unexpected error occurred"
  },
  502: {
    name: "Bad Gateway",
    use: "Upstream service error (e.g., GHL API down)",
    example: "GoHighLevel API is unavailable"
  },
  503: {
    name: "Service Unavailable",
    use: "Maintenance mode, service temporarily down",
    example: "Service under maintenance. Back at 12:00 UTC."
  },
  504: {
    name: "Gateway Timeout",
    use: "Upstream service timeout",
    example: "Request to GoHighLevel API timed out"
  }
};
```

### 7.3 Error Codes

```javascript
const ErrorCodes = {
  // Authentication & Authorization
  AUTH_REQUIRED: "Authentication required",
  TOKEN_EXPIRED: "Authentication token has expired",
  TOKEN_INVALID: "Invalid authentication token",
  TOKEN_REVOKED: "Token has been revoked",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account locked due to too many failed attempts",
  PERMISSION_DENIED: "You do not have the required permission",
  RESOURCE_ACCESS_DENIED: "You do not have access to this resource",

  // Validation
  REQUIRED_FIELD: "Required field is missing",
  INVALID_FORMAT: "Field format is invalid",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PHONE: "Invalid phone number format",
  INVALID_UUID: "Invalid UUID format",
  OUT_OF_RANGE: "Value is out of acceptable range",
  INVALID_DATE: "Invalid date format or value",
  DUPLICATE_ENTRY: "Resource with this value already exists",

  // Resource Errors
  RESOURCE_NOT_FOUND: "Resource not found",
  RESOURCE_DELETED: "Resource has been deleted",
  OWNERSHIP_CHECK_FAILED: "Error verifying resource ownership",

  // Business Logic
  QUOTE_ALREADY_ACCEPTED: "Quote has already been accepted",
  QUOTE_EXPIRED: "Quote has expired",
  INVOICE_ALREADY_PAID: "Invoice is already paid",
  INVOICE_VOID: "Invoice has been voided",
  PAYMENT_EXCEEDS_TOTAL: "Payment amount exceeds invoice total",
  CANNOT_DELETE_PAID_INVOICE: "Cannot delete paid invoice",
  CANNOT_MODIFY_SENT_QUOTE: "Cannot modify quote that has been sent",
  CANNOT_REMOVE_LAST_OWNER: "Cannot remove the last owner from organization",
  CLIENT_HAS_OUTSTANDING_BALANCE: "Cannot delete client with outstanding balance",

  // Sync
  VERSION_CONFLICT: "Resource was modified by another user",
  SYNC_FAILED: "Synchronization failed",
  CONFLICT_RESOLUTION_REQUIRED: "Manual conflict resolution required",

  // Integration (GoHighLevel)
  GHL_CONNECTION_FAILED: "Failed to connect to GoHighLevel",
  GHL_QUOTA_EXCEEDED: "GoHighLevel API quota exceeded",
  GHL_API_ERROR: "GoHighLevel API error",
  GHL_INVALID_CREDENTIALS: "Invalid GoHighLevel API credentials",
  GHL_CONTACT_NOT_FOUND: "Contact not found in GoHighLevel",
  GHL_SYNC_FAILED: "Failed to sync with GoHighLevel",

  // File Upload
  FILE_TOO_LARGE: "File size exceeds maximum allowed",
  INVALID_FILE_TYPE: "File type not allowed",
  UPLOAD_FAILED: "File upload failed",
  STORAGE_QUOTA_EXCEEDED: "Storage quota exceeded",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  QUOTA_EXCEEDED: "API quota exceeded",

  // System
  DATABASE_ERROR: "Database operation failed",
  EXTERNAL_SERVICE_ERROR: "External service error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  MAINTENANCE_MODE: "System is under maintenance"
};
```

### 7.4 Validation Error Details

```javascript
// Example validation error response
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": {
    "email": [
      "Email is required",
      "Must be a valid email address"
    ],
    "password": [
      "Password must be at least 8 characters",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one number"
    ],
    "phone": [
      "Phone number format is invalid"
    ]
  },
  "timestamp": "2025-11-17T10:00:00Z",
  "requestId": "req_abc123"
}
```

### 7.5 Error Handling Best Practices

```javascript
// Middleware for global error handling
function errorHandler(err, req, res, next) {
  // Log error details
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    userId: req.user?.userId,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // Send error to monitoring service (Sentry)
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err);
  }

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred'
    : err.message;

  // Send error response
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    code: err.code || 'INTERNAL_ERROR',
    field: err.field,
    details: err.details,
    timestamp: new Date().toISOString(),
    requestId: req.id,
    path: req.path,
    method: req.method
  });
}

// Custom error classes
class ValidationError extends Error {
  constructor(message, field, details) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_FAILED';
    this.field = field;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'RESOURCE_NOT_FOUND';
  }
}

class ConflictError extends Error {
  constructor(message, code = 'CONFLICT') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = code;
  }
}

class BusinessLogicError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = 422;
    this.code = code;
  }
}
```

---

## Rate Limiting & Quotas

### 8.1 Rate Limit Strategy

```javascript
const RateLimits = {
  // Tier-based limits (per organization)
  TIER_FREE: {
    name: "Free",
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 5000,
    concurrentConnections: 5,
    storageQuota: 1024 * 1024 * 100, // 100MB
    monthlyQuota: 50000
  },

  TIER_BASIC: {
    name: "Basic",
    requestsPerMinute: 120,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    concurrentConnections: 10,
    storageQuota: 1024 * 1024 * 1024, // 1GB
    monthlyQuota: 500000
  },

  TIER_PRO: {
    name: "Pro",
    requestsPerMinute: 300,
    requestsPerHour: 15000,
    requestsPerDay: 200000,
    concurrentConnections: 25,
    storageQuota: 1024 * 1024 * 1024 * 10, // 10GB
    monthlyQuota: 2000000
  },

  TIER_ENTERPRISE: {
    name: "Enterprise",
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 1000000,
    concurrentConnections: 100,
    storageQuota: 1024 * 1024 * 1024 * 100, // 100GB
    monthlyQuota: 10000000
  },

  // Endpoint-specific limits (stricter for sensitive endpoints)
  ENDPOINTS: {
    '/api/auth/login': {
      requestsPerMinute: 5,
      requestsPerHour: 20,
      message: "Too many login attempts"
    },
    '/api/auth/register': {
      requestsPerMinute: 3,
      requestsPerHour: 10,
      message: "Too many registration attempts"
    },
    '/api/auth/forgot-password': {
      requestsPerMinute: 2,
      requestsPerHour: 5,
      message: "Too many password reset requests"
    },
    '/api/generate/pdf': {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      message: "PDF generation rate limit exceeded"
    },
    '/api/uploads/photos': {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      message: "File upload rate limit exceeded"
    },
    '/api/sync/push': {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      message: "Sync rate limit exceeded"
    }
  }
};
```

### 8.2 Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700226000
X-RateLimit-Window: 60
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700226000
Retry-After: 45

{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45,
  "limit": 120,
  "window": "1 minute",
  "timestamp": "2025-11-17T10:30:00Z"
}
```

### 8.3 Rate Limiting Implementation

```javascript
const Redis = require('redis');
const redis = Redis.createClient();

// Rate limit middleware
async function rateLimit(req, res, next) {
  const organizationId = req.user?.organizationId;
  const endpoint = req.path;

  if (!organizationId) {
    return next(); // Skip for unauthenticated requests
  }

  // Get organization tier
  const org = await db.organizations.findOne({
    where: { uuid: organizationId }
  });
  const tier = RateLimits[`TIER_${org.subscription.plan.toUpperCase()}`];

  // Check endpoint-specific limits first
  const endpointLimit = RateLimits.ENDPOINTS[endpoint];
  if (endpointLimit) {
    const limited = await checkLimit(
      `ratelimit:endpoint:${endpoint}:${organizationId}`,
      endpointLimit.requestsPerMinute,
      60
    );

    if (limited.exceeded) {
      return res.status(429).json({
        error: 'TooManyRequests',
        message: endpointLimit.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: limited.resetIn,
        limit: endpointLimit.requestsPerMinute,
        window: '1 minute'
      });
    }
  }

  // Check tier limits
  const minuteLimit = await checkLimit(
    `ratelimit:minute:${organizationId}`,
    tier.requestsPerMinute,
    60
  );

  if (minuteLimit.exceeded) {
    return res.status(429).json({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded for your tier',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: minuteLimit.resetIn,
      limit: tier.requestsPerMinute,
      window: '1 minute',
      tier: tier.name
    });
  }

  // Set rate limit headers
  res.set('X-RateLimit-Limit', tier.requestsPerMinute);
  res.set('X-RateLimit-Remaining', minuteLimit.remaining);
  res.set('X-RateLimit-Reset', minuteLimit.resetAt);
  res.set('X-RateLimit-Window', '60');

  next();
}

// Check rate limit using Redis
async function checkLimit(key, limit, windowSeconds) {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const resetAt = Math.floor(Date.now() / 1000) + ttl;

  return {
    exceeded: current > limit,
    current: current,
    remaining: Math.max(0, limit - current),
    resetIn: ttl,
    resetAt: resetAt
  };
}
```

### 8.4 Quota Management

```http
GET /api/usage/quota
Authorization: Bearer <token>

Response: 200 OK
{
  "organization": {
    "uuid": "550e8400-e29b-41d4-a716-446655440002",
    "plan": "pro"
  },
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-12-01T00:00:00Z",
    "daysRemaining": 13
  },
  "requests": {
    "used": 125000,
    "limit": 2000000,
    "percentage": 6.25,
    "projectedEndOfMonth": 250000,
    "status": "ok" // ok, warning, exceeded
  },
  "storage": {
    "used": 2147483648, // 2GB in bytes
    "limit": 10737418240, // 10GB in bytes
    "percentage": 20.0,
    "status": "ok"
  },
  "concurrentConnections": {
    "current": 5,
    "limit": 25,
    "status": "ok"
  },
  "warnings": []
}

// When approaching limits
{
  ...
  "warnings": [
    "You have used 85% of your monthly request quota",
    "Storage is at 90% capacity"
  ]
}
```

---

## API Versioning

### 9.1 Versioning Strategy

**Recommendation: URL versioning** for simplicity and clarity

```http
https://api.tictacstick.com/v1/quotes
https://api.tictacstick.com/v2/quotes
```

**Alternatives:**

```http
# Header versioning
GET /api/quotes
Accept: application/vnd.tictacstick.v1+json

# Query parameter versioning
GET /api/quotes?version=1
```

### 9.2 Version Support Policy

```javascript
const VersionPolicy = {
  v1: {
    status: "current",
    releasedAt: "2025-12-01",
    deprecationDate: null,
    sunsetDate: null,
    features: "Full API functionality"
  },

  v2: {
    status: "planned",
    releasedAt: "2026-06-01",
    features: "Enhanced sync protocol, GraphQL support"
  },

  // Future deprecation example
  v1_deprecated: {
    status: "deprecated",
    releasedAt: "2025-12-01",
    deprecationDate: "2026-12-01",
    sunsetDate: "2027-06-01",
    message: "v1 will be sunset on 2027-06-01. Migrate to v2."
  }
};
```

### 9.3 Deprecation Headers

```http
GET /api/v1/quotes (deprecated endpoint)

HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 30 Jun 2027 23:59:59 GMT
Link: </api/v2/quotes>; rel="successor-version"
Warning: 299 - "API v1 is deprecated and will be sunset on 2027-06-01"

{
  "quotes": [...],
  "_meta": {
    "version": "1.0",
    "deprecated": true,
    "deprecationDate": "2026-12-01",
    "sunsetDate": "2027-06-01",
    "migration Guide": "https://docs.tictacstick.com/api/v1-to-v2-migration",
    "successorVersion": "2.0"
  }
}
```

### 9.4 Breaking vs Non-Breaking Changes

**Non-breaking changes (no version bump required):**
- Adding new endpoints
- Adding optional parameters
- Adding new fields to responses
- Adding new enum values
- Expanding validation rules (less restrictive)

**Breaking changes (require new version):**
- Removing endpoints
- Removing fields from responses
- Changing field types
- Renaming fields
- Making required parameters optional or vice versa
- Changing error response structure
- Changing authentication method
- Tightening validation rules (more restrictive)

---

## Database Schema

*Continued in next message due to length...*

Let me create the remaining sections of the comprehensive API design document.
