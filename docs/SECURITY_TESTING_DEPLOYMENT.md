# TicTacStick Backend - Security, Testing & Deployment
## Production-Ready Implementation Guide

**Version:** 1.0.0
**Date:** 2025-11-17

---

## Table of Contents

1. [Security Checklist](#security-checklist)
2. [Testing Strategy](#testing-strategy)
3. [Deployment Guide](#deployment-guide)

---

# Security Checklist

## 1. Authentication Security

### Password Security
```javascript
// ✅ Strong password hashing with bcrypt
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ✅ Password requirements
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  maxLength: 128
};

function validatePassword(password) {
  const errors = [];

  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
  }

  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (passwordRequirements.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (passwordRequirements.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}
```

### JWT Security
```javascript
// ✅ Secure JWT configuration
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_SECRET, // Strong, random secret
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '30d',
  algorithm: 'HS256',
  issuer: 'tictacstick-api',
  audience: 'tictacstick-client'
};

// ✅ Generate tokens with secure payload
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.uuid,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: user.permissions,
      jti: uuidv4() // Unique token ID for revocation
    },
    JWT_CONFIG.accessTokenSecret,
    {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      algorithm: JWT_CONFIG.algorithm,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }
  );
}

// ✅ Token blacklist for logout
async function blacklistToken(jti, expiresAt) {
  const ttl = Math.floor((expiresAt - Date.now()) / 1000);
  await redis.setex(`blacklist:${jti}`, ttl, '1');
}

// ✅ Verify token and check blacklist
async function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  } catch (err) {
    throw err;
  }
}
```

### Account Lockout
```javascript
// ✅ Prevent brute force attacks
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function handleFailedLogin(email) {
  const key = `login_attempts:${email}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 3600); // Reset after 1 hour
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    // Lock account
    await db.users.update(
      { locked_until: new Date(Date.now() + LOCKOUT_DURATION) },
      { where: { email } }
    );

    // Clear attempts counter
    await redis.del(key);

    throw new Error('Account locked due to too many failed login attempts');
  }

  return {
    attemptsRemaining: MAX_FAILED_ATTEMPTS - attempts
  };
}

async function handleSuccessfulLogin(email) {
  // Clear failed attempts
  await redis.del(`login_attempts:${email}`);

  // Update last login
  await db.users.update(
    {
      last_login_at: new Date(),
      last_login_ip: req.ip,
      failed_login_attempts: 0,
      locked_until: null
    },
    { where: { email } }
  );
}
```

## 2. Input Validation & Sanitization

### Request Validation
```javascript
// ✅ Use Joi for input validation
const Joi = require('joi');

const createQuoteSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  quoteTitle: Joi.string().max(255).required(),
  jobType: Joi.string().valid('residential', 'commercial', 'industrial').required(),
  clientLocation: Joi.string().max(500),
  lineItems: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('window', 'pressure', 'other').required(),
      description: Joi.string().max(500).required(),
      quantity: Joi.number().integer().min(0),
      area: Joi.number().min(0),
      unitPrice: Joi.number().min(0).required(),
      subtotal: Joi.number().min(0).required()
    })
  ).min(1).required(),
  subtotal: Joi.number().min(0).required(),
  gst: Joi.number().min(0).required(),
  total: Joi.number().min(0).required(),
  internalNotes: Joi.string().max(5000),
  clientNotes: Joi.string().max(5000),
  validUntil: Joi.date().iso().min('now')
});

// Validation middleware
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        details[detail.path.join('.')] = detail.message;
      });

      return res.status(400).json({
        error: 'ValidationError',
        message: 'Request validation failed',
        code: 'VALIDATION_FAILED',
        details
      });
    }

    req.validatedBody = value;
    next();
  };
}

// Usage
app.post('/api/quotes',
  authenticateJWT,
  validateRequest(createQuoteSchema),
  createQuote
);
```

### SQL Injection Prevention
```javascript
// ✅ Use parameterized queries (ORM or prepared statements)

// ❌ NEVER do this
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ ALWAYS do this (Sequelize example)
const user = await db.users.findOne({
  where: { email: email }
});

// ✅ Or use parameterized queries (raw SQL)
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

### XSS Prevention
```javascript
// ✅ Sanitize user input
const sanitizeHtml = require('sanitize-html');

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}
  });
}

// ✅ Set security headers
const helmet = require('helmet');
app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://cdn.tictacstick.com'],
    connectSrc: ["'self'", 'https://api.tictacstick.com'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}));
```

## 3. CORS Configuration

```javascript
// ✅ Secure CORS setup
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = [
      'https://app.tictacstick.com',
      'https://www.tictacstick.com',
      'http://localhost:3000', // Development only
      'http://localhost:5000'  // Development only
    ];

    if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      callback(null, true);
    } else if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Last-Sync'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

## 4. Secrets Management

```javascript
// ✅ Use environment variables for secrets
require('dotenv').config();

const secrets = {
  // Database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

  // GoHighLevel
  GHL_API_KEY: process.env.GHL_API_KEY,

  // Redis
  REDIS_URL: process.env.REDIS_URL,

  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN
};

// ✅ Validate required secrets on startup
function validateSecrets() {
  const required = [
    'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'JWT_SECRET', 'REFRESH_TOKEN_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateSecrets();

// ✅ Use AWS Secrets Manager or similar in production
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({
  region: 'ap-southeast-2'
});

async function getSecret(secretName) {
  try {
    const data = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();

    if ('SecretString' in data) {
      return JSON.parse(data.SecretString);
    }
  } catch (err) {
    console.error('Error retrieving secret:', err);
    throw err;
  }
}
```

## 5. File Upload Security

```javascript
// ✅ Secure file upload configuration
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, HEIC, and WebP are allowed.'));
  }
};

// Storage configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 files per request
  },
  fileFilter: fileFilter
});

// Upload endpoint
app.post('/api/uploads/photos',
  authenticateJWT,
  requirePermission('files:upload'),
  upload.single('file'),
  async (req, res) => {
    try {
      // Validate file
      if (!req.file) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No file uploaded'
        });
      }

      // Generate secure filename
      const ext = path.extname(req.file.originalname);
      const filename = crypto.randomBytes(16).toString('hex') + ext;

      // Scan for viruses (optional but recommended)
      await scanFileForViruses(req.file.buffer);

      // Upload to S3
      const s3Key = `photos/${req.user.organizationId}/${filename}`;
      const s3Url = await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);

      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(req.file.buffer);
      const thumbnailKey = `photos/${req.user.organizationId}/thumbs/${filename}`;
      const thumbnailUrl = await uploadToS3(thumbnailKey, thumbnailBuffer, 'image/jpeg');

      // Save to database
      const photo = await db.photos.create({
        uuid: uuidv4(),
        organization_id: req.user.organizationId,
        filename: req.file.originalname,
        url: s3Url,
        thumbnail_url: thumbnailUrl,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
        storage_provider: 's3',
        storage_key: s3Key,
        uploaded_by: req.user.userId
      });

      res.status(201).json({ photo });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'File upload failed'
      });
    }
  }
);
```

## 6. API Security Headers

```javascript
// ✅ Security headers middleware
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (HTTPS only)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

app.use(securityHeaders);
```

## 7. Logging & Monitoring

```javascript
// ✅ Security event logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'security.log', level: 'warn' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Security events to log
function logSecurityEvent(event, details) {
  logger.warn({
    type: 'security_event',
    event: event,
    ...details,
    timestamp: new Date().toISOString()
  });

  // Send to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(`Security Event: ${event}`, {
      level: 'warning',
      extra: details
    });
  }
}

// Examples
logSecurityEvent('failed_login', {
  email: email,
  ip: req.ip,
  attempts: attempts
});

logSecurityEvent('unauthorized_access', {
  userId: req.user.userId,
  resource: req.path,
  requiredPermission: permission
});

logSecurityEvent('suspicious_activity', {
  userId: req.user.userId,
  activity: 'multiple_device_logins',
  devices: deviceCount
});
```

---

# Testing Strategy

## 1. Unit Tests

### Example: Authentication Service Tests

```javascript
// tests/unit/auth.service.test.js
const { describe, it, expect, beforeEach } = require('@jest/globals');
const AuthService = require('../../services/auth.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestP@ssw0rd123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate valid JWT', () => {
      const user = {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'owner',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        permissions: ['*']
      };

      const token = authService.generateAccessToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.uuid);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should include expiry in token', () => {
      const user = {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'owner'
      };

      const token = authService.generateAccessToken(user);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = authService.validatePassword('TestP@ssw0rd123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = authService.validatePassword('Test1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = authService.validatePassword('testp@ssw0rd123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = authService.validatePassword('TestPassword');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});
```

### Example: Quote Service Tests

```javascript
// tests/unit/quote.service.test.js
const QuoteService = require('../../services/quote.service');

describe('QuoteService', () => {
  let quoteService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      quotes: {
        create: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn()
      },
      quote_line_items: {
        create: jest.fn()
      }
    };

    quoteService = new QuoteService(mockDb);
  });

  describe('createQuote', () => {
    it('should create quote with line items', async () => {
      const quoteData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        quoteTitle: 'Test Quote',
        lineItems: [
          {
            type: 'window',
            description: 'Standard window',
            quantity: 10,
            unitPrice: 25.00,
            subtotal: 250.00
          }
        ],
        subtotal: 250.00,
        gst: 25.00,
        total: 275.00
      };

      mockDb.quotes.create.mockResolvedValue({
        uuid: '123e4567-e89b-12d3-a456-426614174002',
        ...quoteData,
        quote_number: 'Q-2025-000001'
      });

      const result = await quoteService.createQuote(quoteData, 'user123');

      expect(mockDb.quotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: quoteData.clientId,
          organization_id: quoteData.organizationId,
          quote_title: quoteData.quoteTitle,
          created_by: 'user123'
        })
      );

      expect(mockDb.quote_line_items.create).toHaveBeenCalledTimes(1);
      expect(result.quote_number).toBe('Q-2025-000001');
    });

    it('should validate subtotal matches line items', async () => {
      const quoteData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        lineItems: [
          { subtotal: 250.00 }
        ],
        subtotal: 300.00, // Mismatch!
        gst: 30.00,
        total: 330.00
      };

      await expect(
        quoteService.createQuote(quoteData, 'user123')
      ).rejects.toThrow('Subtotal does not match sum of line items');
    });
  });

  describe('calculateQuoteTotals', () => {
    it('should calculate totals correctly', () => {
      const lineItems = [
        { subtotal: 250.00 },
        { subtotal: 500.00 },
        { subtotal: 150.00 }
      ];

      const totals = quoteService.calculateQuoteTotals(lineItems);

      expect(totals.subtotal).toBe(900.00);
      expect(totals.gst).toBe(90.00); // 10% GST
      expect(totals.total).toBe(990.00);
    });
  });
});
```

## 2. Integration Tests

### Example: API Integration Tests

```javascript
// tests/integration/quotes.api.test.js
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, teardownTestDb } = require('../helpers/db');

describe('Quotes API', () => {
  let authToken;
  let testUser;
  let testClient;

  beforeAll(async () => {
    await setupTestDb();

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestP@ssw0rd123',
        firstName: 'Test',
        lastName: 'User',
        organizationName: 'Test Org'
      });

    authToken = registerResponse.body.token;
    testUser = registerResponse.body.user;

    // Create test client
    const clientResponse = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+61412345678',
        addresses: [{
          type: 'service',
          street: '123 Main St',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000'
        }]
      });

    testClient = clientResponse.body.client;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /api/quotes', () => {
    it('should create a new quote', async () => {
      const quoteData = {
        clientId: testClient.uuid,
        quoteTitle: 'Test Quote',
        jobType: 'residential',
        lineItems: [
          {
            type: 'window',
            description: 'Standard window',
            quantity: 10,
            unitPrice: 25.00,
            subtotal: 250.00
          }
        ],
        subtotal: 250.00,
        gst: 25.00,
        total: 275.00
      };

      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quoteData);

      expect(response.status).toBe(201);
      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.uuid).toBeDefined();
      expect(response.body.quote.quote_number).toMatch(/^Q-\d{4}-\d{6}$/);
      expect(response.body.quote.status).toBe('draft');
      expect(response.body.quote.total).toBe(275.00);
    });

    it('should reject quote without authentication', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('GET /api/quotes/:id', () => {
    let createdQuote;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: testClient.uuid,
          quoteTitle: 'Test Quote',
          jobType: 'residential',
          lineItems: [{ type: 'window', description: 'Test', quantity: 1, unitPrice: 100, subtotal: 100 }],
          subtotal: 100,
          gst: 10,
          total: 110
        });

      createdQuote = response.body.quote;
    });

    it('should get quote by ID', async () => {
      const response = await request(app)
        .get(`/api/quotes/${createdQuote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.uuid).toBe(createdQuote.uuid);
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await request(app)
        .get('/api/quotes/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/quotes/:id', () => {
    it('should update quote', async () => {
      // Create quote
      const createResponse = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: testClient.uuid,
          quoteTitle: 'Original Title',
          jobType: 'residential',
          lineItems: [{ type: 'window', description: 'Test', quantity: 1, unitPrice: 100, subtotal: 100 }],
          subtotal: 100,
          gst: 10,
          total: 110
        });

      const quote = createResponse.body.quote;

      // Update quote
      const updateResponse = await request(app)
        .put(`/api/quotes/${quote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteTitle: 'Updated Title',
          version: quote.version
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.quote.quote_title).toBe('Updated Title');
      expect(updateResponse.body.quote.version).toBe(quote.version + 1);
    });

    it('should detect version conflicts', async () => {
      // Create quote
      const createResponse = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: testClient.uuid,
          quoteTitle: 'Test',
          jobType: 'residential',
          lineItems: [{ type: 'window', description: 'Test', quantity: 1, unitPrice: 100, subtotal: 100 }],
          subtotal: 100,
          gst: 10,
          total: 110
        });

      const quote = createResponse.body.quote;

      // First update
      await request(app)
        .put(`/api/quotes/${quote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteTitle: 'Update 1',
          version: quote.version
        });

      // Second update with old version (conflict!)
      const conflictResponse = await request(app)
        .put(`/api/quotes/${quote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteTitle: 'Update 2',
          version: quote.version
        });

      expect(conflictResponse.status).toBe(409);
      expect(conflictResponse.body.error).toBe('Conflict');
      expect(conflictResponse.body.code).toBe('VERSION_CONFLICT');
    });
  });

  describe('DELETE /api/quotes/:id', () => {
    it('should soft delete quote', async () => {
      const createResponse = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientId: testClient.uuid,
          quoteTitle: 'Test',
          jobType: 'residential',
          lineItems: [{ type: 'window', description: 'Test', quantity: 1, unitPrice: 100, subtotal: 100 }],
          subtotal: 100,
          gst: 10,
          total: 110
        });

      const quote = createResponse.body.quote;

      const deleteResponse = await request(app)
        .delete(`/api/quotes/${quote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify quote is soft deleted
      const getResponse = await request(app)
        .get(`/api/quotes/${quote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
```

## 3. End-to-End Tests

### Example: User Flow E2E Test

```javascript
// tests/e2e/quote-workflow.test.js
describe('Quote Workflow E2E', () => {
  it('should complete full quote workflow', async () => {
    // 1. Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'workflow@example.com',
        password: 'TestP@ssw0rd123',
        firstName: 'Workflow',
        lastName: 'Test',
        organizationName: 'Test Org'
      });

    expect(registerResponse.status).toBe(201);
    const authToken = registerResponse.body.token;

    // 2. Create client
    const clientResponse = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+61412345678',
        addresses: [{
          type: 'service',
          street: '123 Main St',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000'
        }]
      });

    expect(clientResponse.status).toBe(201);
    const client = clientResponse.body.client;

    // 3. Create quote
    const quoteResponse = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: client.uuid,
        quoteTitle: 'Full Workflow Test',
        jobType: 'residential',
        lineItems: [
          { type: 'window', description: 'Windows', quantity: 10, unitPrice: 25, subtotal: 250 }
        ],
        subtotal: 250,
        gst: 25,
        total: 275
      });

    expect(quoteResponse.status).toBe(201);
    const quote = quoteResponse.body.quote;

    // 4. Send quote
    const sendResponse = await request(app)
      .post(`/api/quotes/${quote.uuid}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        to: 'john@example.com',
        subject: 'Your Quote',
        message: 'Please review',
        sendPdf: true
      });

    expect(sendResponse.status).toBe(200);

    // 5. Accept quote
    const acceptResponse = await request(app)
      .patch(`/api/quotes/${quote.uuid}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'accepted',
        version: quote.version
      });

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.quote.status).toBe('accepted');

    // 6. Convert to invoice
    const invoiceResponse = await request(app)
      .post(`/api/quotes/${quote.uuid}/convert-to-invoice`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invoiceDate: '2025-11-17',
        dueDate: '2025-12-17'
      });

    expect(invoiceResponse.status).toBe(201);
    const invoice = invoiceResponse.body.invoice;
    expect(invoice.invoice_number).toMatch(/^INV-\d{4}-\d{6}$/);

    // 7. Add payment
    const paymentResponse = await request(app)
      .post(`/api/invoices/${invoice.uuid}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 275.00,
        method: 'bank_transfer',
        date: '2025-11-20',
        reference: 'TEST123'
      });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.invoice.status).toBe('paid');
    expect(paymentResponse.body.invoice.amount_paid).toBe(275.00);

    // 8. Generate PDF
    const pdfResponse = await request(app)
      .post('/api/generate/invoice-pdf')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invoiceId: invoice.uuid,
        template: 'standard'
      });

    expect(pdfResponse.status).toBe(202);
    expect(pdfResponse.body.jobId).toBeDefined();
  });
});
```

## 4. Load Testing

### Example: Artillery Load Test

```yaml
# load-tests/quotes.yml
config:
  target: 'https://api.tictacstick.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  payload:
    path: "./test-data/auth-tokens.csv"
    fields:
      - "authToken"

scenarios:
  - name: "List quotes"
    weight: 50
    flow:
      - get:
          url: "/api/v1/quotes?page=1&limit=50"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Get single quote"
    weight: 30
    flow:
      - get:
          url: "/api/v1/quotes/{{ $randomString() }}"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Create quote"
    weight: 20
    flow:
      - post:
          url: "/api/v1/quotes"
          headers:
            Authorization: "Bearer {{ authToken }}"
            Content-Type: "application/json"
          json:
            clientId: "{{ $randomString() }}"
            quoteTitle: "Load Test Quote"
            jobType: "residential"
            lineItems:
              - type: "window"
                description: "Test window"
                quantity: 10
                unitPrice: 25
                subtotal: 250
            subtotal: 250
            gst: 25
            total: 275
```

Run with:
```bash
artillery run load-tests/quotes.yml
```

---

# Deployment Guide

## 1. Environment Setup

### Development Environment

```bash
# .env.development
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tictacstick_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev_secret_change_in_production
REFRESH_TOKEN_SECRET=dev_refresh_secret_change_in_production

# AWS (localstack for local dev)
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=tictacstick-dev
AWS_S3_ENDPOINT=http://localhost:4566

# Sentry (disabled in dev)
SENTRY_DSN=

# CORS
CORS_ORIGIN=http://localhost:5000
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database (use AWS Secrets Manager)
DB_HOST=tictacstick-prod.xxxxx.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tictacstick_production
DB_USER=tictacstick_app
DB_PASSWORD=<from secrets manager>

# Redis (ElastiCache)
REDIS_URL=rediss://tictacstick-prod.xxxxx.cache.amazonaws.com:6379

# JWT (strong random secrets)
JWT_SECRET=<from secrets manager>
REFRESH_TOKEN_SECRET=<from secrets manager>

# AWS
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=tictacstick-production

# Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# CORS
CORS_ORIGIN=https://app.tictacstick.com,https://www.tictacstick.com
```

## 2. Docker Configuration

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build (if using TypeScript)
# RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
```

### docker-compose.yml (for local development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: tictacstick_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      SERVICES: s3
      DEFAULT_REGION: ap-southeast-2
    volumes:
      - localstack_data:/var/lib/localstack

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env.development
    depends_on:
      - postgres
      - redis
      - localstack
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
  localstack_data:
```

## 3. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: tictacstick_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: tictacstick_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: tictacstick_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: tictacstick-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2

      - name: Run database migrations
        run: |
          npm ci
          npm run migrate:latest
        env:
          NODE_ENV: production
          DB_HOST: ${{ secrets.PROD_DB_HOST }}
          DB_NAME: ${{ secrets.PROD_DB_NAME }}
          DB_USER: ${{ secrets.PROD_DB_USER }}
          DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster tictacstick-production \
            --service tictacstick-api \
            --force-new-deployment \
            --region ap-southeast-2

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster tictacstick-production \
            --services tictacstick-api \
            --region ap-southeast-2

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_URL: https://api.tictacstick.com

      - name: Notify deployment success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

      - name: Notify deployment failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Production deployment failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 4. Database Migrations

### Migration Script

```javascript
// migrations/001_initial_schema.js
exports.up = async function(knex) {
  // Create extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

  // Create organizations table
  await knex.schema.createTable('organizations', table => {
    table.uuid('uuid').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('abn', 20);
    table.string('phone', 50);
    table.string('email', 255);
    table.text('address');
    table.text('logo_url');
    table.string('subscription_plan', 50).notNullable().defaultTo('free');
    table.string('subscription_status', 50).notNullable().defaultTo('trial');
    table.timestamp('subscription_started_at').nullable();
    table.timestamp('subscription_expires_at').nullable();
    table.jsonb('settings').defaultTo('{}');
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });

  // Add more tables...
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('organizations');
  // Drop more tables...
};
```

### Run Migrations

```bash
# Development
npm run migrate:latest

# Production (via CI/CD)
npm run migrate:latest --env production

# Rollback
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

## 5. Monitoring & Alerting

### Health Check Endpoint

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Health check failed:', err);
  process.exit(1);
});

request.end();
```

### Monitoring Setup

```javascript
// monitoring.js
const Sentry = require('@sentry/node');
const prometheus = require('prom-client');

// Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Prometheus metrics
const register = new prometheus.Registry();

prometheus.collectDefaultMetrics({ register });

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

// Metrics middleware
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.labels(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    ).observe(duration);

    httpRequestTotal.labels(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    ).inc();
  });

  next();
}

module.exports = {
  Sentry,
  register,
  metricsMiddleware
};
```

---

## 6. Scaling Strategy

### Horizontal Scaling (ECS)

```json
{
  "family": "tictacstick-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "xxxxx.dkr.ecr.ap-southeast-2.amazonaws.com/tictacstick-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:xxxxx:secret:tictacstick/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tictacstick-api",
          "awslogs-region": "ap-southeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node healthcheck.js || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Auto Scaling

```json
{
  "ServiceName": "tictacstick-api",
  "ScalableDimension": "ecs:service:DesiredCount",
  "MinCapacity": 2,
  "MaxCapacity": 10,
  "TargetTrackingScalingPolicyConfiguration": {
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }
}
```

---

**End of Security, Testing & Deployment Guide**
