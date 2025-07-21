# AFCO ERP Report Server

Simple Java Spring Boot server for generating PDF reports using JasperReports.

## Features

- Generate PDF voucher reports from JSON data
- No database required - pure stateless service
- RESTful API endpoints
- CORS enabled for cross-origin requests

## Getting Started

### Prerequisites

- Java 11 or higher
- Maven 3.6 or higher

### Running the Application

```bash
# Navigate to the report server directory
cd report_server

# Build and run the application
mvn spring-boot:run
```

The application will start on port 8080.

### API Endpoints

#### Generate Voucher PDF
- **POST** `/api/reports/voucher/pdf`
- **Content-Type:** `application/json`
- **Response:** PDF file

#### Health Check
- **GET** `/api/reports/health`
- **Response:** "Report Server is running!"

### Sample Request

```bash
curl -X POST http://localhost:8080/api/reports/voucher/pdf \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  --output voucher.pdf
```

### JSON Structure

```json
{
  "voucherNumber": "JV-2024-001",
  "voucherType": "JOURNAL",
  "voucherDate": "2024-12-21",
  "description": "Opening entries for cash and capital account",
  "totalAmount": 100000.00,
  "companyName": "AFCO ERP Company",
  "companyAddress": "123 Business Street, Karachi, Pakistan",
  "lineEntries": [
    {
      "accountCode": "1-1-1",
      "accountName": "Cash in Hand",
      "description": "Opening cash balance",
      "debitAmount": 100000.00,
      "creditAmount": 0.00
    },
    {
      "accountCode": "4-1-1",
      "accountName": "Capital Account", 
      "description": "Owner's capital",
      "debitAmount": 0.00,
      "creditAmount": 100000.00
    }
  ]
}
```

### Integration with AFCO ERP

The report server can be called from the main AFCO ERP application:

```javascript
// Example frontend integration
const generateVoucherPdf = async (voucherData) => {
  const response = await fetch('http://localhost:8080/api/reports/voucher/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(voucherData)
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voucher-${voucherData.voucherNumber}.pdf`;
  a.click();
};
```

### Port Configuration

- Default port: 8080
- Change in `application.yml` under `server.port`

### Customizing the Report Template

Edit `src/main/resources/reports/voucher_template.jrxml` to customize the PDF layout and styling.