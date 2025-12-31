# Docker Configuration untuk StockTrackApp

Dokumentasi ini menjelaskan konfigurasi Docker untuk sistem StockTrackApp yang menggunakan teknologi stack Laravel + Inertia.js + React + PostgreSQL dengan pendekatan mobile-first.

## 📁 Struktur File

```
StockTrackApp/
├── docker-compose.yml              # Konfigurasi Docker Compose utama
├── Dockerfile                      # Dockerfile untuk aplikasi Laravel
├── .dockerignore                   # File yang diabaikan saat build
├── .env.example                    # Template environment variables
├── README_DOCKER.md                # Dokumentasi ini
└── docker/
    ├── nginx/
    │   ├── nginx.conf              # Konfigurasi Nginx utama
    │   └── sites/
    │       └── default.conf        # Konfigurasi virtual host
    ├── php/
    │   └── php.ini                 # Konfigurasi PHP custom
    ├── postgres/
    │   └── init/
    │       └── 01-init.sql         # Skrip inisialisasi PostgreSQL
    └── supervisor/
        └── supervisord.conf        # Konfigurasi Supervisor
```

## 🚀 Cara Penggunaan

### 1. Setup Awal

```bash
# Copy file environment
cp .env.example .env

# Build dan jalankan container
docker-compose up -d --build
```

### 2. Install Dependencies

```bash
# Install Composer dependencies
docker-compose exec app composer install

# Install npm dependencies
docker-compose exec node npm install

# Generate application key
docker-compose exec app php artisan key:generate

# Run migrations
docker-compose exec app php artisan migrate

# Seed database (jika diperlukan)
docker-compose exec app php artisan db:seed
```

### 3. Akses Aplikasi

- **Aplikasi Web**: http://localhost:8000
- **MailHog (Email Testing)**: http://localhost:8025
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Konfigurasi Service

### 1. App Service (Laravel + PHP-FPM)

- **Base Image**: php:8.2-fpm-alpine
- **PHP Extensions**: PDO, PDO_PGSQL, GD, Zip, XML, DOM, Intl, OPcache, dll
- **Working Directory**: /var/www/html
- **Supervisor**: Menjalankan PHP-FPM, Queue Worker, dan Scheduler

### 2. Node Service (Frontend Build)

- **Base Image**: node:18-alpine
- **Working Directory**: /var/www/html
- **Command**: `npm install && npm run dev`
- **Hot-reload**: Aktif untuk development

### 3. Nginx Service (Web Server)

- **Base Image**: nginx:alpine
- **Port**: 8000:80
- **Optimasi**: Gzip compression, mobile optimization, rate limiting
- **Security Headers**: X-Frame-Options, X-XSS-Protection, CSP

### 4. PostgreSQL Service (Database)

- **Base Image**: postgres:15-alpine
- **Port**: 5432:5432
- **Extensions**: uuid-ossp, pg_trgm
- **Persistensi**: Volume postgres-data

### 5. Redis Service (Cache/Queue)

- **Base Image**: redis:7-alpine
- **Port**: 6379:6379
- **Persistensi**: Volume redis-data
- **Command**: redis-server --appendonly yes

### 6. MailHog Service (Email Testing)

- **Base Image**: mailhog/mailhog:latest
- **SMTP Port**: 1025
- **Web Interface**: 8025

## 📁 Volume Mounting

### Development

- **Source Code**: `./:/var/www/html`
- **Composer Cache**: `composer-cache:/root/.composer/cache`
- **NPM Cache**: `node-cache:/root/.npm`
- **PostgreSQL Data**: `postgres-data:/var/lib/postgresql/data`
- **Redis Data**: `redis-data:/data`
- **Nginx Logs**: `nginx-logs:/var/log/nginx`

## 🌐 Networking

- **Network Name**: stocktrack-network
- **Driver**: bridge
- **Subnet**: 172.20.0.0/16
- **Service Communication**: Semua service terhubung dalam network yang sama

## 🔐 Environment Variables

### Application Configuration

```bash
APP_NAME="StockTrackApp"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost
```

### Database Configuration

```bash
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=stocktrack_db
DB_USERNAME=stocktrack_user
DB_PASSWORD=stocktrack_password
```

### Inertia.js Configuration

```bash
INERTIA_SSR_ENABLED=false
INERTIA_SSR_URL=http://127.0.0.1:13714
```

## 🛠️ Commands Berguna

### Container Management

```bash
# Jalankan semua container
docker-compose up -d

# Build ulang container
docker-compose build --no-cache

# Stop semua container
docker-compose down

# Hapus volume (hati-hati!)
docker-compose down -v
```

### Monitoring

```bash
# Lihat log semua service
docker-compose logs -f

# Lihat log service tertentu
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres

# Masuk ke container
docker-compose exec app sh
docker-compose exec node sh
```

### Maintenance

```bash
# Clear cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear

# Backup database
docker-compose exec postgres pg_dump -U stocktrack_user stocktrack_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U stocktrack_user stocktrack_db < backup.sql
```

## 🔄 Hot-Reload Configuration

### Frontend (React)

- Node service menjalankan `npm run dev` dengan hot-reload
- Perubahan di file frontend akan otomatis terdeteksi
- Browser akan refresh otomatis

### Backend (Laravel)

- Source code di-mount ke container
- Perubahan PHP files akan langsung terlihat
- OPcache dikonfigurasi untuk revalidate frequently

## 📱 Mobile-First Optimization

### Nginx Configuration

- Gzip compression untuk mobile
- Cache headers untuk static assets
- Touch-friendly elements support
- Responsive image optimization

### PHP Configuration

- Memory limit yang cukup untuk mobile processing
- Execution timeout yang sesuai
- Session security untuk mobile devices

## 🔒 Security Configuration

### Nginx

- Security headers (X-Frame-Options, CSP, dll)
- Rate limiting untuk API endpoints
- Hidden sensitive files
- CORS configuration untuk fonts

### PHP

- Expose PHP disabled
- File upload restrictions
- Session security settings
- Input validation support

## 🚀 Production Deployment

### Environment Variables

```bash
APP_ENV=production
APP_DEBUG=false
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

### Scaling

```bash
# Scale app service
docker-compose up -d --scale app=3

# Scale worker service
docker-compose up -d --scale laravel-worker=5
```

### External Database

```bash
# Comment out postgres service di docker-compose.yml
# Update DB_HOST ke external database
# Update DB credentials sesuai production environment
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   sudo chown -R $USER:$USER .
   ```

2. **Port Already in Use**
   ```bash
   # Kill process using port
   sudo lsof -ti:8000 | xargs kill -9
   ```

3. **Database Connection Failed**
   ```bash
   # Check postgres container status
   docker-compose ps postgres
   
   # Restart postgres
   docker-compose restart postgres
   ```

4. **NPM Install Failed**
   ```bash
   # Clear npm cache
   docker-compose exec node npm cache clean --force
   
   # Delete node_modules
   docker-compose exec node rm -rf node_modules
   
   # Reinstall
   docker-compose exec node npm install
   ```

### Debug Mode

```bash
# Enable debug mode
APP_DEBUG=true

# Check logs
docker-compose logs -f app nginx postgres

# Enter container for debugging
docker-compose exec app bash
```

## 📚 Referensi

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Laravel Docker Deployment](https://laravel.com/docs/deployment)
- [Nginx Configuration](https://www.nginx.com/resources/wiki/start/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)