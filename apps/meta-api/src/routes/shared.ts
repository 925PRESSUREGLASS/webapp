/**
 * Shared Route Utilities
 * Common schemas, validators, and helpers used across route files
 */

import { z } from 'zod';
import { FastifyReply } from 'fastify';

// ===== Enums =====
export var projectStatusEnum = ['draft', 'in-progress', 'complete'] as const;
export var assetStatusEnum = ['draft', 'active', 'deprecated'] as const;
export var assetTypeEnum = ['snippet', 'component', 'template', 'static', 'doc', 'prompt'] as const;
export var businessStatusEnum = ['active', 'paused', 'archived'] as const;
export var riskEnum = ['low', 'medium', 'high'] as const;
export var methodEnum = ['pressure', 'softwash'] as const;

// ===== Schemas =====
export var serviceLineSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export var serviceTypeSchema = z.object({
  id: z.string().min(1),
  serviceLineId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  baseRate: z.number().optional(),
  baseMinutesPerUnit: z.number().optional(),
  riskLevel: z.enum(riskEnum).optional(),
  pressureMethod: z.enum(methodEnum).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export var marketAreaSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  postalCodes: z.array(z.string()).optional(),
  travelFee: z.number().optional(),
  minJobValue: z.number().optional(),
  notes: z.string().optional()
});

export var modifierSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().optional(),
  scope: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  multiplier: z.number().optional(),
  flatAdjust: z.number().optional(),
  appliesTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export var packageSchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  discountPct: z.number().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        serviceTypeId: z.string().min(1),
        quantity: z.number().optional(),
        unitOverride: z.string().optional()
      })
    )
    .optional()
});

export var projectBodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(projectStatusEnum)
});

export var projectUpdateSchema = projectBodySchema.partial().extend({
  id: z.string().min(1)
});

export var featureBodySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(projectStatusEnum)
});

export var assetBodySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(assetTypeEnum),
  status: z.enum(assetStatusEnum),
  link: z.string().url().optional(),
  tags: z.array(z.string()).optional()
});

// ===== Validation Helper =====
export function validateOrReply<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
  reply: FastifyReply
): { success: true; data: T } | { success: false } {
  var parsed = schema.safeParse(body);
  if (!parsed.success) {
    reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    return { success: false };
  }
  return { success: true, data: parsed.data };
}
