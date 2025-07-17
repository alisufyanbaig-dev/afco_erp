#!/bin/bash

# Script to restart AFCO ERP services

echo "Restarting AFCO ERP Services..."

# Restart backend service
echo "Restarting backend service..."
sudo systemctl restart afco-backend.service

# Wait a moment for backend to start
sleep 2

# Restart frontend service
echo "Restarting frontend service..."
sudo systemctl restart afco-frontend.service

# Wait a moment for frontend to start
sleep 3

# Check status
echo "Checking service status..."
echo "Backend status:"
sudo systemctl status afco-backend.service --no-pager -l

echo ""
echo "Frontend status:"
sudo systemctl status afco-frontend.service --no-pager -l

echo ""
echo "Services restarted successfully!"
echo "Backend: http://localhost:3500"
echo "Frontend: http://localhost:3501"