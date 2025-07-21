#!/bin/bash

# AFCO ERP Report Server Startup Script

echo "Starting AFCO ERP Report Server..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed. Please install Java 11 or higher."
    exit 1
fi

# Check if Maven is installed  
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven is not installed. Please install Maven."
    exit 1
fi

# Kill any existing process
pkill -f "ReportServerApplication"

# Clean and start the application
echo "Building and starting the server..."
mvn clean spring-boot:run

echo "Report server started on http://localhost:8080"
echo "Health check: curl http://localhost:8080/api/reports/health"
echo "Generate PDF: curl -X POST http://localhost:8080/api/reports/voucher/pdf -H \"Content-Type: application/json\" -d @test-data.json --output voucher.pdf"