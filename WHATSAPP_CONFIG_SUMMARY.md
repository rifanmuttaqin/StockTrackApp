# Ringkasan Konfigurasi WhatsApp API

## ✅ Masalah Telah Diperbaiki

Kode telah diperbarui untuk menggunakan format API SimpleCMPos:

```
POST {api_url}/message/sendText/{instance_name}
Headers:
  Accept: application/json
  Content-Type: application/json
  apikey: {api_key}
Body:
  {
    "number": "6281234567890",
    "text": "message content"
  }
```

## 📋 Cara Konfigurasi

### Di Settings UI (Settings → WhatsApp):

#### 1. API URL
```
https://192.168.1.118:8080
```
⚠️ Hanya base URL, **JANGAN** include `/message/sendText/`

#### 2. Instance Name (dulunya "Phone Number ID")
```
simplecmpos
```
ℹ️ Ini nama instance yang digunakan di URL path

#### 3. API Key
```
your-api-key-here
```
🔒 Dikirim sebagai header `apikey` (bukan Authorization Bearer)

#### 4. Status
- ✅ Aktif: Centang "Status Aktif"
- ✅ Kirim: Aktifkan "Status Pengiriman Aktif"

## 🧪 Test Koneksi

1. Masukkan nomor telepon di bagian "Test Koneksi"
   - Format: `6281234567890` (dimulai dengan kode negara)
   - Contoh: `6281234567890`

2. Klik "Kirim Test"

3. Lihat hasil:
   - ✅ Berhasil: "Pesan test berhasil dikirim"
   - ❌ Gagal: Akan muncul pesan error detail

## 📊 Monitoring

### Cek Logs Realtime
```bash
tail -f storage/logs/laravel.log | grep -i "whatsapp"
```

### Logs akan menampilkan:
```json
{
  "url": "https://192.168.1.118:8080/message/sendText/simplecmpos",
  "status": 200,
  "response": {...}
}
```

## 🔍 Troubleshooting

### Error 404
**Penyebab:** Instance name salah atau API server tidak punya endpoint tersebut

**Solusi:**
```bash
# Test manual dari container
docker exec -it stocktrackapp-app-1 curl -X POST https://192.168.1.118:8080/message/sendText/simplecmpos \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "apikey: your-key" \
  -d '{"number": "6281234567890", "text": "test"}'
```

Pastikan:
- ✅ Instance name benar (simplecmpos)
- ✅ Server bisa diakses dari container
- ✅ Endpoint tersedia

### Error 401/403
**Penyebab:** API key salah atau format header berbeda

**Solusi:**
- ✅ Cek API key di Settings
- ✅ Pastikan dikirim sebagai `apikey` header
- ✅ Verifikasi di API documentation

### Connection Refused
**Solusi:**
```bash
# Cek connectivity dari container
docker exec -it stocktrackapp-app-1 ping 192.168.1.118
docker exec -it stocktrackapp-app-1 telnet 192.168.1.118 8080
```

## 📁 File yang Diubah

1. **[app/Services/WhatsAppService.php](app/Services/WhatsAppService.php)**
   - Updated `callDexApi()` method
   - Correct API format implementation
   - Added detailed logging

2. **[resources/js/Pages/Settings/WhatsApp/Index.jsx](resources/js/Pages/Settings/WhatsApp/Index.jsx)**
   - Field labels updated
   - Added help text and examples

3. **[app/Models/WhatsAppSetting.php](app/Models/WhatsAppSetting.php)**
   - Updated `isActiveAndConfigured()` validation

4. **[app/Http/Requests/Settings/WhatsAppSettingUpdateRequest.php](app/Http/Requests/Settings/WhatsAppSettingUpdateRequest.php)**
   - Updated error messages

## 📚 Documentation

- [WHATSAPP_API_CONFIG.md](WHATSAPP_API_CONFIG.md) - Detail lengkap API format
- [API_DEBUGGING.md](API_DEBUGGING.md) - Panduan troubleshooting
- [WHATSAPP_TEST_FIX.md](WHATSAPP_TEST_FIX.md) - Fix test connection
- [MIGRATION_FIX.md](MIGRATION_FIX.md) - Database migration fix

## ✨ Yang Sudah Diperbaiki

- ✅ API endpoint path: `/message/sendText/{instance}`
- ✅ Header format: `apikey` instead of `Authorization: Bearer`
- ✅ Body format: `number` + `text` instead of `to` + `text.body`
- ✅ Phone Number ID → Instance Name
- ✅ Better UI help text and examples
- ✅ Detailed logging for debugging
- ✅ Migration untuk kolom yang hilang
- ✅ Test connection bisa jalan tanpa send_status

Sekarang konfigurasi di Settings UI dengan:
- API URL: `https://192.168.1.118:8080`
- Instance Name: `simplecmpos`
- API Key: key Anda

Lalu test koneksi! 🚀
