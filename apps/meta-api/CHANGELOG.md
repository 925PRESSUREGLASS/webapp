# Changelog

All notable changes to the meta-api will be documented in this file.

## [Unreleased]

## [2025-11-30] - Auth & Sync Fixes

### Fixed
- **Auth:** Added missing `expiresIn` field to JWT token responses (login/register)
- **GHL Routes:** Scoped JWT preHandler to GHL routes only, preventing 401 on public auth endpoints
- **Dependencies:** Downgraded `@fastify/jwt` from 10.0.0 to 8.0.1 for Fastify 4.x compatibility
- **CORS:** Added `Authorization` header to Access-Control-Allow-Headers in all CORS configurations
- **Sync:** Fixed JWT payload mapping - changed from `userId` to `id` to match actual token payload

### Changed
- JWT tokens now expire in 7 days (604800 seconds) with explicit `expiresIn` in response
- Build version tracking updated to `2025-11-30T23:15-sync-fix`

---

## Previous Versions

### Initial Release
- Core auth routes (register, login, me, logout)
- GHL integration routes with OAuth2 flow
- Sync routes for PWA offline data synchronization
- Health check endpoint with build version tracking
