# Instalasi dan Setup StockTrackApp

## Prerequisites

- PHP 8.2+
- Node.js 18+
- Composer
- NPM/Yarn
- Database (MySQL/PostgreSQL/SQLite)

## Langkah-langkah Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd StockTrackApp
```

### 2. Install Backend Dependencies
```bash
composer install
```

### 3. Install Frontend Dependencies
```bash
npm install
```
*Note: Jika mengalami permission error, jalankan dengan sudo atau ubah kepemilikan direktori*

### 4. Environment Setup
```bash
cp .env.example .env
php artisan key:generate
```

### 5. Database Setup
```bash
# Buat database baru
# Edit .env dengan konfigurasi database Anda

# Jalankan migrasi
php artisan migrate

# Seed database dengan data awal
php artisan db:seed
```

### 6. Build Frontend Assets
```bash
npm run build
```

### 7. Start Development Server
```bash
# Terminal 1 - Backend
php artisan serve

# Terminal 2 - Frontend (untuk development)
npm run dev
```

## Aplikasi Siap!

Buka browser dan akses `http://localhost:8000`

## Login Default

Setelah menjalankan seeder, Anda bisa login dengan:
- **Email**: admin@stocktrack.com
- **Password**: password

## Troubleshooting

### Permission Issues
Jika mengalami permission error saat install npm:
```bash
sudo chown -R $USER:$USER /var/www/StockTrackApp
npm install
```

### Storage Permissions
```bash
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

### Cache Clear
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Frontend Build Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development Commands

### Backend
```bash
php artisan serve                    # Start development server
php artisan migrate                   # Run migrations
php artisan db:seed                   # Seed database
php artisan tinker                    # Laravel REPL
php artisan make:controller Name       # Create controller
php artisan make:model Name           # Create model
php artisan make:migration name       # Create migration
```

### Frontend
```bash
npm run dev                          # Start development server
npm run build                        # Build for production
npm run watch                         # Watch for changes
npm run hot                          # Hot module replacement
```

## Production Deployment

1. Set environment ke production:
```bash
APP_ENV=production
APP_DEBUG=false
```

2. Install dependencies:
```bash
composer install --optimize-autoloader --no-dev
npm install && npm run build
```

3. Cache configuration:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

4. Optimize:
```bash
php artisan optimize
```

5. Set file permissions:
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 755 storage bootstrap/cache
