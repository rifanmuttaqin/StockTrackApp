# syntax=docker/dockerfile:1

FROM php:8.2-fpm-alpine

ARG UID=1000
ARG GID=1000

RUN apk add --no-cache \
    bash git curl \
    zip unzip libzip-dev \
    oniguruma-dev \
    icu-dev icu-libs \
    libpng-dev libjpeg-turbo-dev libwebp-dev \
    freetype-dev \
    libxml2-dev \
    postgresql-dev postgresql-libs \
    nodejs npm

# PHP extensions
RUN docker-php-ext-configure intl \
 && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
 && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    zip \
    dom \
    pcntl \
    bcmath \
    opcache \
    intl \
    gd

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Create non-root user matching host UID/GID for better file permissions
RUN addgroup -g ${GID} appgroup \
 && adduser -D -G appgroup -u ${UID} appuser \
 && chown -R appuser:appgroup /var/www/html

USER appuser

# Expose PHP-FPM port
EXPOSE 9000

CMD ["php-fpm"]