# Dockerfile untuk StockTrackApp
# Berdasarkan teknologi stack: Laravel + Inertia.js + React + PostgreSQL
# Mendukung Repository Pattern dan Service Layer

# Gunakan PHP 8.2 FPM sebagai base image
FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies yang diperlukan untuk Laravel dan extension
RUN apk add --no-cache \
    # Basic utilities
    curl \
    wget \
    git \
    zip \
    unzip \
    # Image processing libraries
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    libxml2-dev \
    # PostgreSQL client library
    postgresql-dev \
    # Node.js dan npm (untuk build frontend)
    nodejs \
    npm \
    # Composer
    composer \
    # Other utilities
    supervisor \
    # Clean up
    && rm -rf /var/cache/apk/*

# Install PHP extensions yang diperlukan untuk Laravel
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    # Core extensions
    pdo \
    pdo_pgsql \
    pgsql \
    # Image processing
    gd \
    # File handling
    zip \
    # XML processing
    xml \
    dom \
    # Internationalization
    intl \
    # OPcache untuk performance
    opcache \
    # Additional extensions
    bcmath \
    ctype \
    fileinfo \
    json \
    mbstring \
    openssl \
    pcre \
    session \
    simplexml \
    tokenizer \
    curl

# Install dan konfigurasi Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer --version

# Konfigurasi PHP
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
    && sed -i 's/memory_limit = 128M/memory_limit = 512M/' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 20M/' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/post_max_size = 8M/post_max_size = 20M/' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/max_execution_time = 30/max_execution_time = 300/' "$PHP_INI_DIR/php.ini"

# Konfigurasi OPcache
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.validate_timestamps=1'; \
} > /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Copy custom PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

# Copy supervisor configuration
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Install Laravel dependencies
# Copy composer files terlebih dahulu untuk memanfaatkan Docker cache
COPY composer.json composer.lock ./

# Install Composer dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Copy application source code
COPY . .

# Set permissions untuk storage dan cache
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Install Node.js dependencies dan build frontend
RUN npm install \
    && npm run build \
    && npm cache clean --force

# Expose port 9000 untuk PHP-FPM
EXPOSE 9000

# Start supervisor untuk menjalankan PHP-FPM dan queue worker
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]