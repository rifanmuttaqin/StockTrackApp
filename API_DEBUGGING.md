# WhatsApp API Debugging Guide

## Current Issue
API endpoint returning 404 Not Found when testing WhatsApp connection.

## What the Code Does
```php
POST http://192.168.1.118:8080/v1/messages
```

With body:
```json
{
  "phone_number_id": "your-phone-number-id",
  "to": "6281234567890",
  "type": "text",
  "text": {
    "body": "test message"
  }
}
```

## Debug Logging Added
New detailed logging has been added to show:
- Full URL being called
- Phone number ID
- API response status
- Response body
- Error details

Check the logs at:
```bash
tail -f storage/logs/laravel.log | grep -i "whatsapp"
```

## Possible Causes of 404

### 1. Wrong API Endpoint Path
The server at 192.168.1.118:8080 doesn't have `/v1/messages` endpoint.

**Common WhatsApp API endpoints:**
- `/v1/messages` (Meta/WhatsApp Business)
- `/api/v1/messages` (Custom/Dex API)
- `/messages` (Some APIs)
- `/send` (Some APIs)

### 2. Wrong Base URL
The API URL should include the full path. For example:
- ❌ `http://192.168.1.118:8080` → becomes `http://192.168.1.118:8080/v1/messages`
- ✅ `http://192.168.1.118:8080/api/v1` → becomes `http://192.168.1.118:8080/api/v1/messages`

### 3. Server Not Running or Wrong Port
The server might not be running on port 8080 or might be on a different IP.

## How to Debug

### Step 1: Check Current API Configuration
```bash
# Check what's configured in database
docker exec -it stocktrackapp-db-1 psql -U postgres -d stocktrackapp -c "SELECT api_url, phone_number_id FROM whatsapp_settings LIMIT 1;"
```

### Step 2: Test the API Endpoint Manually
```bash
# Test the full URL (replace with your actual values)
curl -X POST http://192.168.1.118:8080/v1/messages \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number_id": "test",
    "to": "6281234567890",
    "type": "text",
    "text": {
      "body": "test message"
    }
  }'
```

### Step 3: Test Different Endpoints
Try these different endpoint paths:
```bash
# Try /api/v1/messages
curl -X POST http://192.168.1.118:8080/api/v1/messages \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Try /messages
curl -X POST http://192.168.1.118:8080/messages \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Try /send
curl -X POST http://192.168.1.118:8080/send \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check if server responds at all
curl http://192.168.1.118:8080/
```

### Step 4: Update API Configuration
If you find the correct endpoint, update the database:
```sql
-- Update API URL to include the correct path
UPDATE whatsapp_settings
SET api_url = 'http://192.168.1.118:8080/correct/path'
WHERE id = 'your-settings-id';
```

Or update via Settings UI:
1. Go to Settings → WhatsApp
2. Update "API URL" field to include the full path
3. Save settings
4. Test again

## Questions to Answer

1. **What API are you using?**
   - Meta WhatsApp Business Cloud API?
   - Dex v2 API?
   - Custom WhatsApp gateway?
   - Other third-party service?

2. **What's the correct endpoint?**
   - Check the API documentation
   - Check the server's available endpoints

3. **Is the server accessible from Docker container?**
   - Test: `docker exec -it stocktrackapp-app-1 curl http://192.168.1.118:8080/`

## Updated Configuration Examples

### Meta WhatsApp Business API
```
API URL: https://graph.facebook.com/v17.0
Endpoint: /v17.0/messages
```

### Custom Gateway (Example)
```
API URL: http://192.168.1.118:8080/api/v1
Endpoint: /messages (becomes /api/v1/messages)
```

### Dex API (Example)
```
API URL: http://192.168.1.118:8080/dex/api/v1
Endpoint: /messages (becomes /dex/api/v1/messages)
```
