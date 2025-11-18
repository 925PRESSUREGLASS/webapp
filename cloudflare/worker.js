/**
 * TicTacStick Webhook Receiver
 * Cloudflare Worker to receive and process GoHighLevel webhooks
 *
 * Deploy this to Cloudflare Workers:
 * 1. Create Cloudflare Workers account
 * 2. Create new worker
 * 3. Copy this code to the worker editor
 * 4. Configure environment variables (WEBHOOK_SECRET, ALLOWED_ORIGINS)
 * 5. Deploy
 *
 * Environment Variables:
 * - WEBHOOK_SECRET: Your webhook secret from GHL
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 */

// Configuration
var CONFIG = {
  // Your webhook secret from GHL (for signature verification)
  // Set this in Cloudflare Workers environment variables
  WEBHOOK_SECRET: typeof WEBHOOK_SECRET !== 'undefined' ? WEBHOOK_SECRET : 'your-webhook-secret-here',

  // CORS origins (your TicTacStick domain)
  // Set this in Cloudflare Workers environment variables
  ALLOWED_ORIGINS: typeof ALLOWED_ORIGINS !== 'undefined'
    ? ALLOWED_ORIGINS.split(',')
    : [
        'https://your-tictacstick-domain.com',
        'http://localhost:8080' // For testing
      ],

  // Event processing
  SUPPORTED_EVENTS: [
    'ContactCreate',
    'ContactUpdate',
    'OpportunityUpdate',
    'OpportunityStatusUpdate',
    'TaskUpdate',
    'TaskComplete',
    'NoteCreate',
    'InboundMessage'
  ],

  // Event storage TTL (24 hours)
  EVENT_TTL: 86400
};

/**
 * Handle incoming requests
 */
addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  var url = new URL(request.url);
  var path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }

  // Route requests
  if (path === '/webhook' && request.method === 'POST') {
    return handleWebhook(request);
  } else if (path === '/events' && request.method === 'GET') {
    return handleGetEvents(request);
  } else if (path === '/health' && request.method === 'GET') {
    return handleHealth(request);
  } else {
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * Handle webhook POST from GoHighLevel
 */
async function handleWebhook(request) {
  try {
    // Parse webhook payload
    var payload = await request.json();

    // Verify webhook signature
    var signature = request.headers.get('X-GHL-Signature');
    if (!await verifySignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract event type
    var eventType = payload.type;

    // Check if we handle this event
    if (CONFIG.SUPPORTED_EVENTS.indexOf(eventType) === -1) {
      console.log('Unsupported event type:', eventType);
      return new Response('Event type not supported', { status: 200 });
    }

    // Process event
    var result = await processWebhookEvent(payload);

    // Store event for client polling (using KV if available)
    await storeEvent(payload, result);

    // Return success
    return new Response(JSON.stringify({
      success: true,
      eventId: payload.id,
      processed: result
    }), {
      status: 200,
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, getCORSHeaders(request))
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle GET /events request from clients
 */
async function handleGetEvents(request) {
  try {
    var url = new URL(request.url);
    var since = url.searchParams.get('since');

    // Retrieve events from KV (if available)
    // For now, return empty array as KV setup is optional
    var events = [];

    // If you have KV namespace bound to your worker:
    // events = await getEventsFromKV(since);

    var response = {
      events: events,
      lastEventId: events.length > 0 ? events[events.length - 1].id : null
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, getCORSHeaders(request))
    });

  } catch (error) {
    console.error('Get events error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, getCORSHeaders(request))
    });
  }
}

/**
 * Health check endpoint
 */
async function handleHealth(request) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, getCORSHeaders(request))
  });
}

/**
 * Verify webhook signature using HMAC-SHA256
 * @param {Object} payload - The webhook payload
 * @param {string} signature - The signature from X-GHL-Signature header
 * @returns {Promise<boolean>} True if signature is valid
 */
async function verifySignature(payload, signature) {
  try {
    // If no signature provided, reject
    if (!signature) {
      console.warn('[WEBHOOK] No signature provided');
      return false;
    }

    // Convert payload to string (canonical JSON representation)
    var payloadString = JSON.stringify(payload);

    // Encode the payload and secret
    var encoder = new TextEncoder();
    var data = encoder.encode(payloadString);
    var keyData = encoder.encode(CONFIG.WEBHOOK_SECRET);

    // Import the secret as a crypto key
    var key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Compute HMAC-SHA256 signature
    var computedSignature = await crypto.subtle.sign('HMAC', key, data);

    // Convert to hex string
    var computedHex = Array.from(new Uint8Array(computedSignature))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');

    // Compare signatures (case-insensitive)
    var isValid = computedHex.toLowerCase() === signature.toLowerCase();

    if (!isValid) {
      console.warn('[WEBHOOK] Signature mismatch');
      console.warn('[WEBHOOK] Expected:', computedHex);
      console.warn('[WEBHOOK] Received:', signature);
    }

    return isValid;

  } catch (error) {
    console.error('[WEBHOOK] Signature verification error:', error);
    return false;
  }
}

/**
 * Process webhook event
 */
async function processWebhookEvent(payload) {
  var eventType = payload.type;
  var data = payload.data;

  console.log('Processing webhook:', eventType);

  // Route to appropriate handler
  switch (eventType) {
    case 'ContactCreate':
    case 'ContactUpdate':
      return await handleContactEvent(data, eventType);

    case 'OpportunityUpdate':
    case 'OpportunityStatusUpdate':
      return await handleOpportunityEvent(data, eventType);

    case 'TaskUpdate':
    case 'TaskComplete':
      return await handleTaskEvent(data, eventType);

    case 'NoteCreate':
      return await handleNoteEvent(data, eventType);

    case 'InboundMessage':
      return await handleMessageEvent(data, eventType);

    default:
      console.log('Unhandled event type:', eventType);
      return { handled: false };
  }
}

/**
 * Handle contact event
 */
async function handleContactEvent(data, eventType) {
  // Transform GHL contact data for TicTacStick
  var transformedData = {
    eventType: 'contact-updated',
    ghlId: data.id,
    contact: {
      id: data.id,
      name: [data.firstName, data.lastName].filter(function(n) { return n; }).join(' '),
      email: data.email,
      phone: data.phone,
      address: {
        street: data.address1,
        city: data.city,
        state: data.state,
        postcode: data.postalCode
      }
    },
    timestamp: new Date().toISOString()
  };

  return { handled: true, data: transformedData };
}

/**
 * Handle opportunity event
 */
async function handleOpportunityEvent(data, eventType) {
  var transformedData = {
    eventType: 'opportunity-updated',
    ghlId: data.id,
    opportunity: {
      id: data.id,
      contactId: data.contactId,
      name: data.name,
      value: data.monetaryValue,
      status: data.status,
      stage: data.pipelineStageId
    },
    timestamp: new Date().toISOString()
  };

  return { handled: true, data: transformedData };
}

/**
 * Handle task event
 */
async function handleTaskEvent(data, eventType) {
  var transformedData = {
    eventType: 'task-updated',
    ghlId: data.id,
    task: {
      id: data.id,
      title: data.title,
      description: data.body,
      completed: data.completed || eventType === 'TaskComplete',
      dueDate: data.dueDate,
      contactId: data.contactId
    },
    timestamp: new Date().toISOString()
  };

  return { handled: true, data: transformedData };
}

/**
 * Handle note event
 */
async function handleNoteEvent(data, eventType) {
  var transformedData = {
    eventType: 'note-created',
    ghlId: data.id,
    note: {
      id: data.id,
      contactId: data.contactId,
      body: data.body,
      createdAt: data.dateAdded
    },
    timestamp: new Date().toISOString()
  };

  return { handled: true, data: transformedData };
}

/**
 * Handle message event
 */
async function handleMessageEvent(data, eventType) {
  var transformedData = {
    eventType: 'message-received',
    ghlId: data.id,
    message: {
      id: data.id,
      contactId: data.contactId,
      type: data.type, // sms, email, etc.
      body: data.body,
      receivedAt: data.dateAdded
    },
    timestamp: new Date().toISOString()
  };

  return { handled: true, data: transformedData };
}

/**
 * Store event for client polling
 * Using Cloudflare KV (if available) or Workers Durable Objects
 */
async function storeEvent(payload, result) {
  // If you have KV namespace bound to your worker (named WEBHOOK_EVENTS):
  // await WEBHOOK_EVENTS.put(
  //   'event_' + payload.id,
  //   JSON.stringify({
  //     original: payload,
  //     transformed: result,
  //     timestamp: new Date().toISOString()
  //   }),
  //   { expirationTtl: CONFIG.EVENT_TTL }
  // );

  // Also add to events list (for polling)
  // var eventsList = await WEBHOOK_EVENTS.get('events_list', 'json') || [];
  // eventsList.push({
  //   id: payload.id,
  //   type: payload.type,
  //   timestamp: new Date().toISOString()
  // });
  // // Keep only last 100 events
  // if (eventsList.length > 100) {
  //   eventsList = eventsList.slice(-100);
  // }
  // await WEBHOOK_EVENTS.put('events_list', JSON.stringify(eventsList));

  // For now, just log
  console.log('Event stored:', payload.id);
}

/**
 * Get events from KV (if available)
 */
async function getEventsFromKV(since) {
  // If you have KV namespace bound to your worker:
  // var eventsList = await WEBHOOK_EVENTS.get('events_list', 'json') || [];

  // // Filter by timestamp if 'since' provided
  // if (since) {
  //   var sinceTime = new Date(since).getTime();
  //   eventsList = eventsList.filter(function(e) {
  //     return new Date(e.timestamp).getTime() > sinceTime;
  //   });
  // }

  // // Get full event data for each
  // var events = [];
  // for (var i = 0; i < eventsList.length; i++) {
  //   var eventData = await WEBHOOK_EVENTS.get('event_' + eventsList[i].id, 'json');
  //   if (eventData && eventData.transformed) {
  //     events.push(eventData.transformed.data);
  //   }
  // }

  // return events;

  return [];
}

/**
 * Handle CORS preflight
 */
function handleCORS(request) {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(request)
  });
}

/**
 * Get CORS headers
 */
function getCORSHeaders(request) {
  var origin = request.headers.get('Origin');

  // Check if origin is allowed
  if (!origin || CONFIG.ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-GHL-Signature',
    'Access-Control-Max-Age': '86400'
  };
}
