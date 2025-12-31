#!/bin/bash

# Docker Helper Script untuk StockTrackApp
# Memudahkan penggunaan Docker Compose untuk development dan production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose first."
        exit 1
    fi
}

# Setup environment
setup_env() {
    print_header "Setting up Environment"
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from .env.example"
        cp .env.example .env
        print_status "Please edit .env file with your configuration"
    else
        print_warning ".env file already exists"
    fi
    
    # Generate APP_KEY if not set
    if ! grep -q "APP_KEY=" .env || grep -q "APP_KEY=$" .env; then
        print_status "Generating APP_KEY..."
        APP_KEY=$(openssl rand -base64 32)
        sed -i "s/APP_KEY=/APP_KEY=base64:$APP_KEY/" .env
    fi
}

# Build and start containers
build() {
    print_header "Building Docker Containers"
    check_docker
    check_docker_compose
    
    docker-compose build --no-cache
    print_status "Build completed"
}

# Start containers
start() {
    print_header "Starting Docker Containers"
    check_docker
    check_docker_compose
    
    docker-compose up -d
    print_status "Containers started"
    
    # Show container status
    docker-compose ps
}

# Stop containers
stop() {
    print_header "Stopping Docker Containers"
    check_docker
    check_docker_compose
    
    docker-compose down
    print_status "Containers stopped"
}

# Restart containers
restart() {
    print_header "Restarting Docker Containers"
    stop
    start
}

# Install dependencies
install() {
    print_header "Installing Dependencies"
    check_docker
    check_docker_compose
    
    print_status "Installing Composer dependencies..."
    docker-compose exec app composer install
    
    print_status "Installing NPM dependencies..."
    docker-compose exec node npm install
    
    print_status "Dependencies installed"
}

# Run migrations
migrate() {
    print_header "Running Database Migrations"
    check_docker
    check_docker_compose
    
    docker-compose exec app php artisan migrate
    print_status "Migrations completed"
}

# Seed database
seed() {
    print_header "Seeding Database"
    check_docker
    check_docker_compose
    
    docker-compose exec app php artisan db:seed
    print_status "Database seeded"
}

# Clear cache
clear_cache() {
    print_header "Clearing Application Cache"
    check_docker
    check_docker_compose
    
    docker-compose exec app php artisan cache:clear
    docker-compose exec app php artisan config:clear
    docker-compose exec app php artisan route:clear
    docker-compose exec app php artisan view:clear
    
    print_status "Cache cleared"
}

# Show logs
logs() {
    check_docker
    check_docker_compose
    
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Access container shell
shell() {
    check_docker
    check_docker_compose
    
    SERVICE=${1:-app}
    print_status "Accessing $SERVICE container shell..."
    docker-compose exec "$SERVICE" sh
}

# Backup database
backup_db() {
    print_header "Backing up Database"
    check_docker
    check_docker_compose
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U stocktrack_user stocktrack_db > "$BACKUP_FILE"
    print_status "Database backed up to $BACKUP_FILE"
}

# Restore database
restore_db() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file name"
        echo "Usage: $0 restore_db <backup_file>"
        exit 1
    fi
    
    print_header "Restoring Database from $1"
    check_docker
    check_docker_compose
    
    if [ ! -f "$1" ]; then
        print_error "Backup file $1 not found"
        exit 1
    fi
    
    docker-compose exec -T postgres psql -U stocktrack_user stocktrack_db < "$1"
    print_status "Database restored from $1"
}

# Show status
status() {
    print_header "Docker Containers Status"
    check_docker
    check_docker_compose
    
    docker-compose ps
    
    print_header "Application URLs"
    print_status "Web Application: http://localhost:8000"
    print_status "MailHog: http://localhost:8025"
    print_status "PostgreSQL: localhost:5432"
    print_status "Redis: localhost:6379"
}

# Full setup for new project
setup() {
    print_header "Full Project Setup"
    
    setup_env
    build
    start
    sleep 10  # Wait for containers to be ready
    install
    migrate
    seed
    clear_cache
    
    print_status "Setup completed successfully!"
    status
}

# Production deployment
deploy() {
    print_header "Production Deployment"
    check_docker
    check_docker_compose
    
    # Update environment for production
    sed -i 's/APP_ENV=local/APP_ENV=production/' .env
    sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env
    
    # Build and start
    build
    start
    
    # Install production dependencies
    docker-compose exec app composer install --no-dev --optimize-autoloader
    docker-compose exec node npm ci --production
    docker-compose exec node npm run build
    
    # Clear and cache
    docker-compose exec app php artisan config:cache
    docker-compose exec app php artisan route:cache
    docker-compose exec app php artisan view:cache
    
    print_status "Production deployment completed"
}

# Show help
help() {
    echo "StockTrackApp Docker Helper Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup      - Full setup for new project"
    echo "  build      - Build Docker containers"
    echo "  start      - Start Docker containers"
    echo "  stop       - Stop Docker containers"
    echo "  restart    - Restart Docker containers"
    echo "  install    - Install Composer and NPM dependencies"
    echo "  migrate    - Run database migrations"
    echo "  seed       - Seed database"
    echo "  cache:clear- Clear application cache"
    echo "  logs       - Show logs (optional: service name)"
    echo "  shell      - Access container shell (default: app)"
    echo "  backup     - Backup database"
    echo "  restore    - Restore database (usage: restore <file>)"
    echo "  status     - Show container status and URLs"
    echo "  deploy     - Production deployment"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 logs app"
    echo "  $0 shell node"
    echo "  $0 restore backup_20231231_120000.sql"
}

# Main script logic
case "$1" in
    setup)
        setup
        ;;
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    install)
        install
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    cache:clear)
        clear_cache
        ;;
    logs)
        logs "$2"
        ;;
    shell)
        shell "$2"
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    status)
        status
        ;;
    deploy)
        deploy
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac