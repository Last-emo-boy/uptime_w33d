#!/bin/bash

# Uptime W33d Deployment Script
# Usage: ./deploy.sh [command]

APP_DIR=$(dirname "$(readlink -f "$0")")
cd "$APP_DIR" || exit

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect docker compose command
if docker compose version &> /dev/null; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' found.${NC}"
    exit 1
fi

function print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

function print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

function print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
}

function update_code() {
    if [ -d ".git" ]; then
        print_info "Pulling latest code from git..."
        git pull
        if [ $? -eq 0 ]; then
            print_success "Code updated successfully."
        else
            print_error "Failed to pull code. Please check your git configuration."
            exit 1
        fi
    else
        print_info "Not a git repository. Skipping git pull."
    fi
}

function start_services() {
    print_info "Starting services using $DC..."
    
    # Check if we need to remove old containers (fix for ContainerConfig error)
    if $DC ps -q | grep -q .; then
        print_info "Existing containers found. Removing them to ensure clean state..."
        $DC down --remove-orphans
    fi

    $DC up -d --build --remove-orphans
    if [ $? -eq 0 ]; then
        print_success "Services started successfully."
        print_info "Backend: http://127.0.0.1:7080"
        print_info "Frontend: http://127.0.0.1:3090"
    else
        print_error "Failed to start services."
        exit 1
    fi
}

function stop_services() {
    print_info "Stopping services..."
    $DC stop
}

function remove_services() {
    print_info "Removing services and containers..."
    $DC down
}

function restart_services() {
    print_info "Restarting services..."
    $DC restart
}

function show_logs() {
    $DC logs -f
}

function show_status() {
    $DC ps
}

function clean_system() {
    print_info "Cleaning up unused Docker resources..."
    docker system prune -f
}

function full_cleanup() {
    print_info "WARNING: Removing ALL project resources (containers, volumes, networks, images)..."
    $DC down -v --rmi local --remove-orphans
    print_success "All project resources and volumes have been removed."
}

function help() {
    echo "Usage: ./deploy.sh [command]"
    echo "Commands:"
    echo "  deploy  - Pull latest code, rebuild and start services (Update)"
    echo "  start   - Start services"
    echo "  stop    - Stop services"
    echo "  down    - Stop and remove containers"
    echo "  restart - Restart services"
    echo "  logs    - View logs"
    echo "  status  - Check service status"
    echo "  clean   - Stop and remove ALL resources including VOLUMES (Reset project)"
    echo "  prune   - Prune unused docker resources (System-wide)"
    echo "  help    - Show this help message"
}

# Main logic
check_docker

if [ ! -f .env ]; then
    print_info "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created. Please edit it with your configuration."
    else
        print_error ".env.example file not found. Please create .env manually."
    fi
fi

case "$1" in
    deploy)
        update_code
        start_services
        clean_system
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    down)
        remove_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        full_cleanup
        ;;
    prune)
        clean_system
        ;;
    *)
        help
        ;;
esac
