#!/bin/bash

# Script to setup Nginx on host machine
# Usage: ./setup_nginx.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

function print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

function print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

function print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed. Please install it first:"
    echo "  sudo apt update"
    echo "  sudo apt install nginx"
    exit 1
fi

# Configuration paths
NGINX_CONF_SRC="uptime_nginx.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/uptime_w33d"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/uptime_w33d"

# Check if source config exists
if [ ! -f "$NGINX_CONF_SRC" ]; then
    print_error "Config file '$NGINX_CONF_SRC' not found in current directory."
    exit 1
fi

print_info "Copying Nginx configuration..."
sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"

print_info "Creating symbolic link..."
if [ -L "$NGINX_CONF_LINK" ]; then
    print_info "Link already exists, updating..."
    sudo rm "$NGINX_CONF_LINK"
fi
sudo ln -s "$NGINX_CONF_DEST" "$NGINX_CONF_LINK"

print_info "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_info "Reloading Nginx..."
    sudo systemctl reload nginx
    print_success "Nginx configuration updated and reloaded successfully!"
    print_info "Frontend: http://status.w33d.xyz"
    print_info "Backend API: http://status-api.w33d.xyz"
    print_info "Make sure your DNS records point to this server's IP."
else
    print_error "Nginx configuration test failed. Please check the config file."
    exit 1
fi
