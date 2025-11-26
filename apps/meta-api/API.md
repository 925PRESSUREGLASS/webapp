# Meta-API Documentation

> REST API for the TicTacStick Meta Dashboard — project management, service configuration, and asset library.

**Base URL**: `http://localhost:3001` (development)  
**Authentication**: API key via `x-api-key` header  
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Health Check](#health-check)
4. [AI Bridge](#ai-bridge)
5. [Projects](#projects)
6. [Features](#features)
7. [Apps](#apps)
8. [Assets](#assets)
9. [Service Businesses](#service-businesses)
10. [Service Lines](#service-lines)
11. [Service Types](#service-types)
12. [Market Areas](#market-areas)
13. [Modifiers](#modifiers)
14. [Packages](#packages)
15. [Price Books](#price-books)
16. [Error Responses](#error-responses)

---

## Authentication

All endpoints (except `/health`) require API key authentication.

```http
x-api-key: your-api-key-here
```

Set the API key via the `API_KEY` environment variable.

---

## Rate Limiting

When `RATE_LIMIT_PER_MIN` is configured, requests exceeding the limit receive:

```json
{
  "error": "Rate limit exceeded"
}
```

**Status Code**: `429 Too Many Requests`

---

## Health Check

### GET /health

Check API availability and database connectivity.

**Authentication**: Not required

**Response** `200 OK`:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "db": "connected",
  "version": "0.1.0"
}
```

---

## AI Bridge

### POST /ai/ask

Send a question to the AI assistant.

**Request Body**:
```json
{
  "question": "What is the recommended pressure for residential windows?"
}
```

**Response** `200 OK`:
```json
{
  "answer": "For residential windows, we recommend..."
}
```

---

## Projects

### GET /projects

List all projects.

**Response** `200 OK`:
```json
[
  {
    "id": "proj-1",
    "name": "TicTacStick PWA",
    "description": "Main quote engine application",
    "status": "in-progress",
    "features": []
  }
]
```

### GET /projects/:id

Get a single project by ID.

**Response** `200 OK`:
```json
{
  "id": "proj-1",
  "name": "TicTacStick PWA",
  "description": "Main quote engine application",
  "status": "in-progress",
  "features": []
}
```

**Response** `404 Not Found`:
```json
{
  "error": "Not found"
}
```

### POST /projects

Create a new project.

**Request Body**:
```json
{
  "id": "proj-new",
  "name": "New Project",
  "description": "Project description",
  "status": "draft"
}
```

**Validation**:
- `id`: string, required, min 1 character
- `name`: string, required, min 1 character
- `description`: string, required, min 1 character
- `status`: enum `draft` | `in-progress` | `complete`

**Response** `201 Created`:
```json
{
  "id": "proj-new",
  "name": "New Project",
  "description": "Project description",
  "status": "draft",
  "features": []
}
```

### PUT /projects/:id

Update an existing project.

**Request Body** (partial update supported):
```json
{
  "id": "proj-1",
  "name": "Updated Name",
  "status": "complete"
}
```

**Response** `200 OK`:
```json
{
  "id": "proj-1",
  "name": "Updated Name",
  "description": "...",
  "status": "complete",
  "features": []
}
```

### GET /projects/summary

Get aggregate statistics for all projects.

**Response** `200 OK`:
```json
{
  "projectCount": 5,
  "featureCount": 12,
  "assetCount": 34,
  "statusCounts": {
    "draft": 1,
    "in-progress": 3,
    "complete": 1
  }
}
```

---

## Features

### GET /features

List all features.

**Response** `200 OK`:
```json
[
  {
    "id": "feat-1",
    "projectId": "proj-1",
    "name": "Calculator",
    "summary": "Quote calculation engine",
    "status": "in-progress",
    "assets": []
  }
]
```

### GET /features/:id

Get a single feature by ID.

**Response** `200 OK`:
```json
{
  "id": "feat-1",
  "projectId": "proj-1",
  "name": "Calculator",
  "summary": "Quote calculation engine",
  "status": "in-progress",
  "assets": []
}
```

### POST /projects/:id/features

Create a feature within a project.

**Request Body**:
```json
{
  "id": "feat-new",
  "projectId": "proj-1",
  "name": "New Feature",
  "summary": "Feature description",
  "status": "draft"
}
```

**Validation**:
- `id`: string, required, min 1 character
- `projectId`: string, required, min 1 character
- `name`: string, required, min 1 character
- `summary`: string, required, min 1 character
- `status`: enum `draft` | `in-progress` | `complete`

**Response** `201 Created`:
```json
{
  "id": "feat-new",
  "projectId": "proj-1",
  "name": "New Feature",
  "summary": "Feature description",
  "status": "draft",
  "assets": []
}
```

### PUT /projects/:projectId/features/:featureId

Update a feature.

**Response** `200 OK`: Updated feature object

### DELETE /features/:id

Delete a feature.

**Response** `204 No Content`

### GET /features/summary

Get feature statistics.

**Response** `200 OK`:
```json
{
  "featureCount": 12,
  "projectCoverage": 5,
  "averageAssetsPerFeature": 2.5
}
```

---

## Apps

### GET /apps

List all registered applications/services.

**Response** `200 OK`:
```json
[
  {
    "id": "app-1",
    "name": "Quote Engine",
    "kind": "pwa",
    "status": "active"
  }
]
```

### GET /apps/:id

Get a single app by ID.

**Response** `200 OK`: App object  
**Response** `404 Not Found`: `{ "error": "Not found" }`

### GET /apps/summary

Get app statistics.

**Response** `200 OK`:
```json
{
  "appCount": 3,
  "statusCounts": { "active": 2, "development": 1 },
  "kinds": { "pwa": 1, "api": 1, "dashboard": 1 }
}
```

---

## Assets

### GET /assets

List all assets from the library.

**Response** `200 OK`:
```json
[
  {
    "id": "asset-1",
    "title": "Calculator Component",
    "description": "Main calculation UI",
    "type": "component",
    "status": "active",
    "tags": ["ui", "calculator"],
    "link": ""
  }
]
```

### GET /assets/:id

Get a single asset.

**Response** `200 OK`: Asset object  
**Response** `404 Not Found`: `{ "error": "Not found" }`

### POST /assets

Create a new asset.

**Request Body**:
```json
{
  "id": "asset-new",
  "title": "New Asset",
  "description": "Optional description",
  "type": "snippet",
  "status": "draft",
  "link": "https://example.com/asset",
  "tags": ["tag1", "tag2"]
}
```

**Validation**:
- `id`: string, required
- `title`: string, required
- `description`: string, optional
- `type`: enum `snippet` | `component` | `template` | `static` | `doc` | `prompt`
- `status`: enum `draft` | `active` | `deprecated`
- `link`: string (URL), optional
- `tags`: array of strings, optional

**Response** `201 Created`: Created asset

### PUT /assets/:id

Update an asset.

**Response** `200 OK`: Updated asset

### DELETE /assets/:id

Delete an asset.

**Response** `204 No Content`

### GET /assets/summary

Get asset statistics.

**Response** `200 OK`:
```json
{
  "assetCount": 34,
  "statusCounts": { "active": 30, "draft": 4 },
  "typeCounts": { "component": 15, "snippet": 10, "template": 9 }
}
```

---

## Service Businesses

### GET /businesses

List all service businesses.

**Response** `200 OK`:
```json
[
  {
    "id": "biz-1",
    "name": "925 Pressure Glass",
    "status": "active"
  }
]
```

### POST /businesses

Create a new business.

**Request Body**:
```json
{
  "id": "biz-new",
  "name": "New Business",
  "description": "Business description",
  "status": "active"
}
```

**Validation**:
- `id`: string, required
- `name`: string, required
- `status`: enum `active` | `paused` | `archived`

**Response** `201 Created`: Created business

---

## Service Lines

### GET /service-lines

List service lines, optionally filtered by business.

**Query Parameters**:
- `businessId`: Filter by business ID

**Response** `200 OK`:
```json
[
  {
    "id": "sl-1",
    "businessId": "biz-1",
    "name": "Window Cleaning",
    "description": "Residential and commercial windows",
    "category": "cleaning",
    "tags": ["windows", "glass"]
  }
]
```

### POST /service-lines

Create a service line.

**Validation**:
- `id`: string, required
- `businessId`: string, required
- `name`: string, required
- `description`: string, optional
- `category`: string, optional
- `tags`: array of strings, optional

**Response** `201 Created`: Created service line

### PUT /service-lines/:id

Update a service line.

**Response** `200 OK`: Updated service line

### DELETE /service-lines/:id

Delete a service line.

**Response** `204 No Content`

---

## Service Types

### GET /service-types

List service types, optionally filtered.

**Query Parameters**:
- `serviceLineId`: Filter by service line
- `code`: Filter by code
- `riskLevel`: Filter by risk level (`low` | `medium` | `high`)

**Response** `200 OK`:
```json
[
  {
    "id": "st-1",
    "serviceLineId": "sl-1",
    "code": "WIN-STD",
    "name": "Standard Window",
    "description": "Standard residential window cleaning",
    "unit": "pane",
    "baseRate": 5.00,
    "baseMinutesPerUnit": 2,
    "riskLevel": "low",
    "pressureMethod": "softwash",
    "tags": ["residential"],
    "isActive": true
  }
]
```

### POST /service-types

Create a service type.

**Validation**:
- `id`: string, required
- `serviceLineId`: string, required
- `code`: string, required
- `name`: string, required
- `unit`: string, required
- `baseRate`: number, optional
- `baseMinutesPerUnit`: number, optional
- `riskLevel`: enum `low` | `medium` | `high`, optional
- `pressureMethod`: enum `pressure` | `softwash`, optional
- `tags`: array of strings, optional
- `isActive`: boolean, optional

**Response** `201 Created`: Created service type

### PUT /service-types/:id

Update a service type.

**Response** `200 OK`: Updated service type

### DELETE /service-types/:id

Delete a service type.

**Response** `204 No Content`

---

## Market Areas

### GET /market-areas

List market areas, optionally filtered by business.

**Query Parameters**:
- `businessId`: Filter by business ID

**Response** `200 OK`:
```json
[
  {
    "id": "ma-1",
    "businessId": "biz-1",
    "name": "Downtown",
    "postalCodes": ["90210", "90211"],
    "travelFee": 25.00,
    "minJobValue": 100.00,
    "notes": "Premium area"
  }
]
```

### POST /market-areas

Create a market area.

**Validation**:
- `id`: string, required
- `businessId`: string, required
- `name`: string, required
- `postalCodes`: array of strings, optional
- `travelFee`: number, optional
- `minJobValue`: number, optional
- `notes`: string, optional

**Response** `201 Created`: Created market area

### PUT /market-areas/:id

Update a market area.

**Response** `200 OK`: Updated market area

### DELETE /market-areas/:id

Delete a market area.

**Response** `204 No Content`

---

## Modifiers

### GET /modifiers

List modifiers, optionally filtered by business.

**Query Parameters**:
- `businessId`: Filter by business ID

**Response** `200 OK`:
```json
[
  {
    "id": "mod-1",
    "businessId": "biz-1",
    "scope": "global",
    "name": "Weekend Premium",
    "description": "Additional charge for weekend work",
    "multiplier": 1.25,
    "flatAdjust": 0,
    "appliesTo": "labor",
    "tags": ["pricing"],
    "isActive": true
  }
]
```

### POST /modifiers

Create a modifier.

**Validation**:
- `id`: string, required
- `businessId`: string, optional
- `scope`: string, required
- `name`: string, required
- `description`: string, optional
- `multiplier`: number, optional
- `flatAdjust`: number, optional
- `appliesTo`: string, optional
- `tags`: array of strings, optional
- `isActive`: boolean, optional

**Response** `201 Created`: Created modifier

### PUT /modifiers/:id

Update a modifier.

**Response** `200 OK`: Updated modifier

### DELETE /modifiers/:id

Delete a modifier.

**Response** `204 No Content`

---

## Packages

### GET /packages

List packages, optionally filtered by business.

**Query Parameters**:
- `businessId`: Filter by business ID

**Response** `200 OK`:
```json
[
  {
    "id": "pkg-1",
    "businessId": "biz-1",
    "name": "Basic Home Package",
    "description": "Standard residential cleaning bundle",
    "discountPct": 10,
    "tags": ["residential", "bundle"],
    "isActive": true,
    "items": [
      {
        "serviceTypeId": "st-1",
        "quantity": 10,
        "unitOverride": null
      }
    ]
  }
]
```

### POST /packages

Create a package.

**Validation**:
- `id`: string, required
- `businessId`: string, required
- `name`: string, required
- `description`: string, optional
- `discountPct`: number, optional
- `tags`: array of strings, optional
- `isActive`: boolean, optional
- `items`: array of package items, optional

**Response** `201 Created`: Created package

### PUT /packages/:id

Update a package.

**Response** `200 OK`: Updated package

### DELETE /packages/:id

Delete a package.

**Response** `204 No Content`

### POST /packages/:id/items

Add an item to a package.

**Request Body**:
```json
{
  "serviceTypeId": "st-1",
  "quantity": 5,
  "unitOverride": "pane"
}
```

**Response** `200 OK`: Updated package with new item

### DELETE /packages/:packageId/items/:itemId

Remove an item from a package.

**Response** `200 OK`: Updated package

---

## Price Books

### GET /pricebook/current

Get the current active price book.

**Query Parameters**:
- `businessId`: Filter by business ID (required for multi-business setups)

**Response** `200 OK`:
```json
{
  "id": "pb-1",
  "businessId": "biz-1",
  "name": "2024 Price List",
  "effectiveDate": "2024-01-01",
  "rates": {}
}
```

**Response** `404 Not Found`:
```json
{
  "error": "No price book found"
}
```

---

## Error Responses

### 400 Bad Request

Validation errors return details:

```json
{
  "error": "Invalid request body",
  "details": {
    "name": {
      "_errors": ["Required"]
    }
  }
}
```

### 401 Unauthorized

Missing or invalid API key:

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

Resource not found:

```json
{
  "error": "Not found"
}
```

### 429 Too Many Requests

Rate limit exceeded:

```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error

Unexpected server error:

```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `API_KEY` | Required API key for authentication | — |
| `ALLOWED_ORIGIN` | CORS origin | `*` |
| `RATE_LIMIT_PER_MIN` | Max requests per minute per IP | — |
| `DATABASE_URL` | PostgreSQL connection string | — |

---

## Development

Start the API server:

```bash
cd apps/meta-api
npm run dev
```

The server runs on `http://localhost:3001`.

---

*Last updated: Auto-generated from server.ts*
