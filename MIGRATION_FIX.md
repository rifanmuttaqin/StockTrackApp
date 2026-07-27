# Migration Fix: WhatsApp Settings Missing Columns

## Problem
When testing WhatsApp connection, the application threw a SQL error:
```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "last_error" of relation "whatsapp_settings" does not exist
```

This happened because the `whatsapp_settings` table was already created without the `last_error` and `send_status` columns, likely from an older version of the migration or manual table creation.

## Root Cause
The columns were defined in the base migration (`2026_07_25_000001_create_whatsapp_settings_table.php`) but didn't exist in the actual database table. This can happen when:
1. Table was created from an older version of the migration
2. Table was created manually without all columns
3. Migration was partially run or failed

## Solution

### 1. Created New Migration
Created `database/migrations/2026_07_25_000002_add_last_error_and_send_status_to_whatsapp_settings_table.php`

This migration:
- Checks if columns exist before adding them (safe to run multiple times)
- Adds `last_error` column (nullable text, after `last_sent_at`)
- Adds `send_status` column (boolean, default false, after `batch_delay`)
- Comments explain the purpose of each column

### 2. Updated Base Migration
Updated `2026_07_25_000001_create_whatsapp_settings_table.php` to have clearer comments:
```php
$table->boolean('send_status')->default(false)->comment('Current send status: true=active, false=paused');
```

This ensures future fresh installations will have proper column comments.

## How to Apply

Run the migration:
```bash
php artisan migrate
```

The migration is **idempotent** - it will:
- Skip adding columns that already exist
- Safely add columns that are missing

## Verification

After running the migration, verify the columns exist:
```bash
php artisan migrate:status
```

Then test the WhatsApp connection again:
```bash
curl -X POST http://localhost:8002/settings/whatsapp/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"phone": "6281234567890"}'
```

## Files

- **New Migration**: `database/migrations/2026_07_25_000002_add_last_error_and_send_status_to_whatsapp_settings_table.php`
- **Updated Base Migration**: `database/migrations/2026_07_25_000001_create_whatsapp_settings_table.php` (improved comments)
