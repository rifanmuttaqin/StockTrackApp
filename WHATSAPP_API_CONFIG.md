# WhatsApp API Configuration - SimpleCMPos Format

## Updated API Format

The WhatsApp API now uses the SimpleCMPos format:

```
POST {api_url}/message/sendText/{phone_number_id}
Accept: application/json
Content-Type: application/json
apikey: {api_key}
{
  "number": "6281234567890",
  "text": "message content"
}
```

## Field Mapping

| SimpleCMPos Field | Database Field | Description |
|-------------------|----------------|-------------|
| URL base | `api_url` | Base URL (e.g., https://192.168.1.118:8080) |
| Path param | `phone_number_id` | Instance name (e.g., simplecmpos) |
| Header | `api_key` | API key for authentication |
| Body: number | `phone` | Recipient phone number |
| Body: text | `message` | Message content |

## Configuration in Settings UI

### 1. API URL
```
Format: https://{host}:{port}
Example: https://192.168.1.118:8080
```

**Important:** Do NOT include `/message/sendText/` or any path - just the base URL.

### 2. Instance Name (Phone Number ID)
```
Format: {instance_name}
Example: simplecmpos
```

This is the instance identifier used in the URL path.

### 3. API Key
```
The API key for authentication (sent as `apikey` header)
```

## Example Configuration

Based on your API endpoint:

```sql
UPDATE whatsapp_settings
SET
  api_url = 'https://192.168.1.118:8080',
  phone_number_id = 'simplecmpos',
  api_key = 'your-api-key-here'
WHERE id = 'your-settings-id';
```

Or configure via Settings UI:
- API URL: `https://192.168.1.118:8080`
- Instance Name: `simplecmpos`
- API Key: `your-api-key`

## Full Request Example

**Request:**
```
POST https://192.168.1.118:8080/message/sendText/simplecmpos
Accept: application/json
Content-Type: application/json
apikey: abc123def456

{
  "number": "6281234567890",
  "text": "Test message from StockTrackApp"
}
```

**Response (Success):**
```json
{
  "key": {
    "id": "message-id-here",
    "remoteJid": "6281234567890@s.whatsapp.net",
    "fromMe": true
  },
  "message": "Text message sent",
  "status": "sent"
}
```

**Response (Error):**
```json
{
  "error": "Invalid API key",
  "status": 401
}
```

## Troubleshooting

### 404 Not Found
- ✅ Check if `phone_number_id` (Instance Name) is correct
- ✅ Check if `api_url` doesn't include extra path
- ✅ Verify endpoint is available: `curl https://192.168.1.118:8080/message/sendText/simplecmpos`

### 401 Unauthorized
- ✅ Check if API key is correct
- ✅ Verify API key is being sent as `apikey` header (not Authorization header)

### 400 Bad Request
- ✅ Check phone number format: must start with country code (e.g., 6281234567890)
- ✅ Check message text is not empty
- ✅ Verify JSON body is valid

### Connection Refused
- ✅ Check if API server is running on that IP/port
- ✅ Verify network connectivity: `ping 192.168.1.118`
- ✅ Check if port is open: `telnet 192.168.1.118 8080`

## Debug Commands

### Test API Connection Manually
```bash
# From container
docker exec -it stocktrackapp-app-1 curl -X POST https://192.168.1.118:8080/message/sendText/simplecmpos \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "apikey: your-api-key" \
  -d '{
    "number": "6281234567890",
    "text": "Test message"
  }'
```

### Check Application Logs
```bash
tail -f storage/logs/laravel.log | grep -i "whatsapp"
```

### Verify Settings in Database
```bash
docker exec -it stocktrackapp-db-1 psql -U postgres -d stocktrackapp \
  -c "SELECT api_url, phone_number_id, is_active, send_status FROM whatsapp_settings;"
```

## Current Code Implementation

The API call is in `app/Services/WhatsAppService.php`:
```php
$fullUrl = rtrim($this->settings->api_url, '/') . '/message/sendText/' . $this->settings->phone_number_id;

$response = Http::withHeaders([
    'Accept' => 'application/json',
    'Content-Type' => 'application/json',
    'apikey' => $this->settings->api_key,
])->timeout(30)->post($fullUrl, [
    'number' => $phone,
    'text' => $message,
]);
```
