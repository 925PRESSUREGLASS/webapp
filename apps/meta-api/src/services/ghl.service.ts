import { env } from '../config/env.js';
import { fetch } from 'undici';

interface GHLConfig {
  apiKey: string | undefined;
  locationId: string | undefined;
  pipelineId: string | undefined;
  stageId: string | undefined;
  baseUrl: string;
}

interface ContactPayload {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface OpportunityPayload {
  title: string;
  contactId: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  monetaryValue?: number;
  assignedTo?: string;
  source?: string;
  tags?: string[];
  notes?: string;
}

var defaultBaseUrl = 'https://rest.gohighlevel.com/v1';

function getConfig(): GHLConfig {
  return {
    apiKey: env.GHL_API_KEY,
    locationId: env.GHL_LOCATION_ID,
    pipelineId: env.GHL_PIPELINE_ID,
    stageId: env.GHL_STAGE_ID,
    baseUrl: env.GHL_BASE_URL || defaultBaseUrl
  };
}

function ensureConfigured(): { ok: boolean; message?: string } {
  var config = getConfig();
  if (!config.apiKey || !config.locationId) {
    return { ok: false, message: 'GHL integration not configured' };
  }
  return { ok: true };
}

async function makeRequest(method: string, path: string, body?: any) {
  var config = getConfig();
  if (!config.apiKey) {
    throw new Error('GHL API key not configured');
  }

  var headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + config.apiKey
  };

  var url = config.baseUrl.replace(/\/$/, '') + path;
  var options: any = {
    method: method,
    headers: headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  var response = await fetch(url, options);
  var text = await response.text();
  var data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    // If parsing fails, keep raw text
    data = text;
  }

  if (!response.ok) {
    var message = (data && (data.message || data.error)) || ('HTTP ' + response.status);
    throw new Error('GHL API error: ' + message);
  }

  return data;
}

export async function testConnection() {
  var status = ensureConfigured();
  if (!status.ok) {
    throw new Error(status.message);
  }
  // Simple ping: fetch pipelines for the configured location
  return makeRequest('GET', '/pipelines/?locationId=' + encodeURIComponent(env.GHL_LOCATION_ID || ''));
}

export async function createContact(payload: ContactPayload) {
  var status = ensureConfigured();
  if (!status.ok) {
    throw new Error(status.message);
  }

  var contactBody = {
    locationId: env.GHL_LOCATION_ID,
    ...payload
  };

  return makeRequest('POST', '/contacts/', contactBody);
}

export async function createOpportunity(payload: OpportunityPayload) {
  var status = ensureConfigured();
  if (!status.ok) {
    throw new Error(status.message);
  }

  var body = {
    locationId: env.GHL_LOCATION_ID,
    pipelineId: payload.pipelineId || env.GHL_PIPELINE_ID,
    stageId: payload.stageId || env.GHL_STAGE_ID,
    title: payload.title,
    status: payload.status || 'open',
    monetaryValue: payload.monetaryValue,
    assignedTo: payload.assignedTo,
    source: payload.source,
    tags: payload.tags,
    notes: payload.notes,
    contactId: payload.contactId
  };

  return makeRequest('POST', '/opportunities/', body);
}

export function getGhlStatus() {
  var config = getConfig();
  return {
    isConfigured: Boolean(config.apiKey && config.locationId),
    hasPipeline: Boolean(config.pipelineId),
    hasStage: Boolean(config.stageId),
    baseUrl: config.baseUrl
  };
}
