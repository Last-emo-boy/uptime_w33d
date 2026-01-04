#!/bin/bash

# Script to setup SSL certificates using Certbot
# Usage: ./setup_ssl.sh

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

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    print_info "Certbot is not installed. Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Domains to secure
DOMAINS="-d status.w33d.xyz -d status-api.w33d.xyz"
EMAIL="admin@w33d.xyz" # Change this to your email

print_info "Obtaining SSL certificates for: $DOMAINS"
sudo certbot --nginx $DOMAINS --non-interactive --agree-tos -m "$EMAIL" --redirect

if [ $? -eq 0 ]; then
    print_success "SSL certificates installed successfully!"
    print_info "Frontend: https://status.w33d.xyz"
    print_info "Backend API: https://status-api.w33d.xyz"
    print_info "Certbot will automatically renew certificates."
else
    print_error "Failed to obtain SSL certificates. Check DNS records and firewall settings."
    print_info "Ensure port 80 and 443 are open."
    exit 1
fi
