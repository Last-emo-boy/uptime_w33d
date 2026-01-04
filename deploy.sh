#!/bin/bash

# Uptime W33d Deployment Script

echo "Starting deployment..."

# 1. Update Code
echo "Updating code from Git..."
git pull

# 2. Build & Start Containers
echo "Building and starting Docker containers..."
docker-compose down
docker-compose up -d --build

# 3. Setup Nginx
echo "Setting up Nginx..."
if [ -d "/etc/nginx/conf.d" ]; then
    echo "Copying Nginx configs..."
    sudo cp deploy/nginx/*.conf /etc/nginx/conf.d/
    
    echo "Testing Nginx config..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "Reloading Nginx..."
        sudo systemctl reload nginx
        echo "Nginx reloaded successfully."
    else
        echo "Nginx config test failed. Please check logs."
    fi
else
    echo "Nginx conf.d directory not found. Please ensure Nginx is installed."
fi

echo "Deployment complete!"
echo "Frontend: http://status.w33d.xyz"
echo "Backend: http://status-api.w33d.xyz"
