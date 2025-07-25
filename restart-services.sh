#!/bin/bash

# Script to restart all AFCO ERP services (Report Server, Backend, Frontend)

set -e

echo "=========================================="
echo "AFCO ERP - Restarting All Services"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check service status
check_service_status() {
    local service_name=$1
    local service_url=$2
    
    if systemctl is-active --quiet $service_name; then
        print_status "$service_name is running"
        if [ ! -z "$service_url" ]; then
            echo "  └─ Available at: $service_url"
        fi
        return 0
    else
        print_error "$service_name is not running"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if [ ! -z "$health_url" ]; then
            if curl -s -f "$health_url" > /dev/null 2>&1; then
                print_status "$service_name is ready!"
                return 0
            fi
        else
            if systemctl is-active --quiet $service_name; then
                print_status "$service_name is ready!"
                return 0
            fi
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Step 1: Restart Report Server
print_status "Step 1/3: Restarting Report Server..."
sudo systemctl restart afco-report-server.service

# Step 2: Wait for Report Server and then restart Backend
print_status "Step 2/3: Waiting for Report Server and restarting Backend..."
wait_for_service "afco-report-server.service" "http://localhost:3502/actuator/health"

print_status "Restarting Backend service..."
sudo systemctl restart afco-backend.service

# Step 3: Wait for Backend and then restart Frontend
print_status "Step 3/3: Waiting for Backend and restarting Frontend..."
wait_for_service "afco-backend.service" "http://localhost:3501/api/auth/health"

print_status "Restarting Frontend service..."
sudo systemctl restart afco-frontend.service

# Wait for all services to be fully ready
print_status "Waiting for all services to be ready..."
sleep 5

# Final status check
echo ""
echo "=========================================="
echo "Service Status Check"
echo "=========================================="

all_services_running=true

# Check Report Server
if ! check_service_status "afco-report-server.service" "http://localhost:3502"; then
    all_services_running=false
fi

# Check Backend
if ! check_service_status "afco-backend.service" "http://localhost:3501"; then
    all_services_running=false
fi

# Check Frontend
if ! check_service_status "afco-frontend.service" "http://localhost:3500"; then
    all_services_running=false
fi

echo ""
echo "=========================================="

if [ "$all_services_running" = true ]; then
    print_status "All services restarted successfully!"
    echo ""
    echo "Service URLs:"
    echo "  • Frontend App:  http://localhost:3500"
    echo "  • Backend API:   http://localhost:3501"
    echo "  • Report Server: http://localhost:3502"
    echo ""
    echo "Health Checks:"
    echo "  • Report Server: http://localhost:3502/actuator/health"
    echo "  • Backend API:   http://localhost:3501/api/reports/server/health/"
    echo ""
    echo "Logs:"
    echo "  • Report Server: sudo journalctl -u afco-report-server.service -f"
    echo "  • Backend:       sudo journalctl -u afco-backend.service -f"
    echo "  • Frontend:      sudo journalctl -u afco-frontend.service -f"
else
    print_error "Some services failed to start properly!"
    echo ""
    echo "Check individual service status:"
    echo "  sudo systemctl status afco-report-server.service"
    echo "  sudo systemctl status afco-backend.service"
    echo "  sudo systemctl status afco-frontend.service"
    exit 1
fi

echo "=========================================="