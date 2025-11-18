# TicTacStick Webhook Receiver - Cloudflare Worker

This Cloudflare Worker receives webhooks from GoHighLevel and processes them for TicTacStick.

## Deployment Instructions

### 1. Create Cloudflare Workers Account

1. Go to [Cloudflare Workers](https://workers.cloudflare.com/)
2. Sign up or log in
3. Navigate to Workers & Pages

### 2. Create New Worker

1. Click "Create Application"
2. Select "Create Worker"
3. Give it a name: `tictacstick-webhooks`
4. Click "Deploy"

### 3. Deploy Code

1. Click "Quick Edit"
2. Delete the default code
3. Copy the contents of `worker.js`
4. Paste into the editor
5. Click "Save and Deploy"

### 4. Configure Environment Variables

1. Go to your worker's Settings
2. Click "Variables"
3. Add the following environment variables:

**WEBHOOK_SECRET** (required)
- Type: Secret
- Value: Your webhook secret from GoHighLevel
- This is used to verify webhook signatures

**ALLOWED_ORIGINS** (required)
- Type: Plain text
- Value: Comma-separated list of allowed origins
- Example: `https://your-tictacstick-domain.com,http://localhost:8080`

4. Click "Save"

### 5. Get Worker URL

Your worker URL will be something like:
```
https://tictacstick-webhooks.your-account.workers.dev
```

Copy this URL - you'll need it for:
1. TicTacStick webhook settings
2. GoHighLevel webhook configuration

### 6. Test Worker

Test the health endpoint:
```bash
curl https://tictacstick-webhooks.your-account.workers.dev/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Webhook Endpoints

### POST /webhook
Receives webhooks from GoHighLevel
- Used by GHL to send events
- Verifies signatures
- Processes and transforms events

### GET /events
Client polling endpoint
- Used by TicTacStick to fetch new events
- Query params:
  - `since` - Get events after this ID (optional)

### GET /health
Health check endpoint
- Returns worker status
- Useful for monitoring

## Optional: Configure KV Storage

For better performance and event persistence, you can add KV storage:

1. Go to Workers & Pages → KV
2. Create namespace: `WEBHOOK_EVENTS`
3. Go to your worker settings
4. Click "Variables" → "KV Namespace Bindings"
5. Add binding:
   - Variable name: `WEBHOOK_EVENTS`
   - KV namespace: `WEBHOOK_EVENTS`

Uncomment the KV-related code in `worker.js` to enable event storage.

## Monitoring

### View Logs

1. Go to your worker in Cloudflare dashboard
2. Click "Logs"
3. Enable "Live Logs" to see real-time events

### Metrics

1. Go to your worker
2. Click "Metrics"
3. View:
   - Request rate
   - Error rate
   - Response time

## Troubleshooting

### CORS Errors

Make sure `ALLOWED_ORIGINS` environment variable includes your TicTacStick domain.

### Signature Verification Failures

1. Check `WEBHOOK_SECRET` matches GHL configuration
2. Implement proper HMAC verification (see TODO in code)

### Events Not Appearing

1. Check worker logs for errors
2. Verify webhook is registered in GHL
3. Test endpoint using `/health`

## Security Best Practices

1. **Never commit secrets** - Always use environment variables
2. **Implement signature verification** - Uncomment and complete the signature verification code
3. **Limit CORS origins** - Only allow your actual domains
4. **Monitor logs** - Watch for suspicious activity
5. **Rotate secrets** - Change webhook secret periodically

## Cost

Cloudflare Workers Free Tier:
- 100,000 requests/day
- More than enough for webhook processing

Paid tier ($5/month):
- 10,000,000 requests/month
- Recommended for production use

## Support

For issues with:
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **TicTacStick Integration**: Check TicTacStick documentation
- **GoHighLevel Webhooks**: https://highlevel.stoplight.io/

## Next Steps

After deploying the worker:

1. Copy your worker URL
2. Go to TicTacStick → Settings → Webhooks
3. Paste the URL
4. Enter webhook secret
5. Save settings
6. Register webhook with GHL
7. Test integration
