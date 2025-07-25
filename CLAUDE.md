# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AFCO ERP is a Django REST Framework + React + JasperReports Enterprise Resource Planning application designed for Pakistani businesses. The system runs as a 3-service architecture: Frontend (port 3500), Backend (port 3501), Report Server (port 3502), all managed as systemd services.

## Development Commands

### Backend (Django)
```bash
# Navigate to backend directory
cd /home/ali/development/afco_erp/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Create test user
python manage.py shell -c "
from common.models import User
User.objects.create_user(email='test@example.com', password='testpass123', first_name='Test', last_name='User')
"

# Run development server manually (alternative to systemd service)
python manage.py runserver 3501

# Run tests
python manage.py test

# Run specific app tests
python manage.py test common
python manage.py test accounting
```

### Frontend (React + Vite)
```bash
# Navigate to frontend directory  
cd /home/ali/development/afco_erp/frontend

# Install frontend dependencies (using pnpm preferred)
pnpm install
# OR using npm
npm install

# Development server (alternative to systemd service)
npm run dev -- --host 0.0.0.0 --port 3500
# OR with pnpm
pnpm dev -- --host 0.0.0.0 --port 3500

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Service Management (3-Service Architecture)
```bash
# Restart all services in proper order (recommended)
./restart-services.sh

# Individual service control (in dependency order)
sudo systemctl restart afco-report-server.service
sudo systemctl restart afco-backend.service  
sudo systemctl restart afco-frontend.service

# Check service status
sudo systemctl status afco-report-server.service
sudo systemctl status afco-backend.service
sudo systemctl status afco-frontend.service

# View service logs
sudo journalctl -u afco-report-server.service -f
sudo journalctl -u afco-backend.service -f
sudo journalctl -u afco-frontend.service -f

# Enable services to start on boot
sudo systemctl enable afco-report-server.service
sudo systemctl enable afco-backend.service
sudo systemctl enable afco-frontend.service
```

### Report Server (Java/Spring Boot + Systemd)
```bash
# The report server now runs as a systemd service
# No manual startup required - managed automatically

# Health checks
curl http://localhost:3502/actuator/health

# Generate reports via Django backend (recommended)
curl -X GET "http://localhost:3501/api/accounting/vouchers/1/pdf/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output voucher.pdf

# Direct report server API (for testing only)
curl -X POST http://localhost:3502/api/reports/voucher/pdf \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  --output voucher.pdf
```

## Architecture Overview

### Backend Structure (`/backend/`)

**Key Files:**
- `afco_erp/settings.py` - Django configuration with JWT, CORS, Pakistan timezone, and report server settings
- `common/models.py` - User, Company, FinancialYear, UserActivity models with Pakistani business validations
- `common/views.py` - Authentication APIs using standardized response format
- `common/utils.py` - `APIResponse` class and `ReportClient` for Jasper server communication
- `common/serializers.py` - DRF serializers with custom JWT token handling
- `accounting/models.py` - ChartOfAccounts, Voucher, VoucherLineEntry with double-entry validation
- `accounting/views.py` - Accounting APIs for chart of accounts, vouchers, and direct report generation
- `accounting/urls.py` - Accounting module URL patterns
- `inventory/models.py` - Party, HSCode, Category, Product, StockInvoice, StockMovement models
- `inventory/views.py` - Inventory APIs with company isolation and stock tracking
- `inventory/urls.py` - Inventory module URL patterns

**API Architecture:**
- **Base URL:** `http://localhost:3501/api/`
- **Response Format:** `{status_code, success, message, data, errors}`
- **Authentication:** JWT with 60min access tokens, 7-day refresh tokens
- **Error Handling:** Centralized via `APIResponse` utility with automatic toast notifications

**Key Endpoints:**
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/register/` - User registration  
- `POST /api/auth/logout/` - Token blacklisting
- `GET/PUT /api/auth/profile/` - Profile management
- `POST /api/auth/change-password/` - Password change
- `GET/POST /api/accounting/chart-of-accounts/` - Chart of accounts management
- `GET /api/accounting/chart-of-accounts/hierarchy/` - Hierarchical account structure
- `GET/POST /api/accounting/vouchers/` - Voucher entry system
- `GET /api/accounting/vouchers/{id}/pdf/` - Generate voucher PDF reports (via Jasper server)
- `GET /api/accounting/ledger-report/` - Ledger reports
- `GET /api/accounting/trial-balance/` - Trial balance reports
- `GET/POST /api/inventory/parties/` - Supplier/customer management
- `GET/POST /api/inventory/hs-codes/` - HS code management
- `GET/POST /api/inventory/categories/` - Product category management
- `GET/POST /api/inventory/products/` - Product management
- `GET/POST /api/inventory/stock-invoices/` - Stock transaction management
- `GET /api/inventory/reports/stock-movement/` - Stock movement reports
- `GET /api/inventory/reports/stock-valuation/` - Stock valuation reports

### Frontend Structure (`/frontend/src/`)

**Key Files:**
- `App.jsx` - Root component with theme, auth, and toast providers
- `services/api.js` - Comprehensive API client with token refresh, retry logic, and error handling
- `contexts/AuthContext.jsx` - Authentication state management
- `contexts/ThemeContext.jsx` - Dark/light theme with localStorage persistence
- `contexts/UserActivityContext.jsx` - Company/Financial year switching and management
- `contexts/UIContext.jsx` - UI state management (sidebar collapse, etc.)
- `components/layout/dashboard-layout.jsx` - Main application layout with collapsible sidebar

**Component Organization:**
- `/components/ui/` - Reusable Radix UI-based components
- `/components/layout/` - Layout components with theme support
- `/components/forms/` - Form components for data entry
- `/pages/` - Feature-specific page components (accounting, inventory, auth)
- `/pages/inventory/` - Inventory management pages (parties, products, stock invoices)
- `/services/` - API and external service integrations

**State Management:**
- React Context for global state (auth, theme, UI)
- Local state for component-specific data
- API service handles token management and refresh

### Authentication Flow

1. **Login:** User submits email/password → JWT tokens stored in localStorage → User redirected to dashboard
2. **Token Refresh:** API service automatically refreshes expired access tokens using refresh token
3. **Logout:** Refresh token blacklisted on backend → All tokens cleared from localStorage
4. **Protected Routes:** `ProtectedRoute` component checks authentication before rendering

### API Service Pattern

The `services/api.js` module provides:
- **Automatic token attachment** to authenticated requests
- **Token refresh logic** with fallback to login redirect
- **Standardized error handling** with toast notifications
- **CRUD service factory** via `createCRUDService(endpoint)`
- **Request retry logic** for transient failures

Example usage:
```javascript
import { apiClient, authService, createCRUDService } from './services/api.js';

// Authentication
await authService.login({email, password});

// Direct API calls
const result = await apiClient.get('/some-endpoint/');

// CRUD operations
const userService = createCRUDService('/users');
await userService.create(userData);
```

### Theme System

The application supports dark/light themes with:
- **System preference detection** on first load
- **Theme persistence** in localStorage
- **CSS variables** for toast notifications
- **Tailwind dark: classes** throughout components
- **Icon theming** with appropriate contrast colors

### Double-Entry Accounting System

The application implements a complete double-entry bookkeeping system:
- **Chart of Accounts**: Hierarchical account structure with auto-generated codes (1, 1-1, 1-1-1)
- **Account Types**: Asset, Liability, Income, Expense with validation
- **Voucher System**: Cash, Bank, and Journal vouchers with line entries
- **Balance Validation**: Automatic debit/credit balance checking (total debit = total credit)
- **Group Account Restrictions**: Group accounts cannot have direct entries
- **Voucher Numbers**: Auto-generated format (CV-2024-0001, BV-2024-0001, JV-2024-0001)

### Pakistani Business Features

The application includes Pakistan-specific validations and fields:
- **NTN validation** (format: 1234567-8)
- **Provincial dropdown** for Pakistani provinces  
- **Business type classifications** (Sole Proprietorship, Partnership, etc.)
- **STRN field** for Sales Tax Registration Number
- **PKT timezone** (Asia/Karachi) configuration

### Multi-Company Architecture

The application supports multiple companies with data isolation:
- **Company Isolation**: All business data (accounts, vouchers, inventory) is segregated by company
- **User Activity**: Users can switch between companies and financial years via `UserActivityContext`
- **Financial Year Management**: Each company has independent financial periods
- **Access Control**: Users can access multiple companies but work in one active company/year at a time

### Inventory Management System

The application includes a comprehensive inventory management module:
- **Party Management**: Suppliers, customers, and both with Pakistani tax validations (NTN, STRN)
- **HS Code Classification**: Harmonized System codes for product classification
- **Category Management**: Product categories under HS codes
- **Product Management**: Complete product master with SKU, barcode, pricing, and stock tracking
- **Stock Invoicing**: Purchase, sale, import, export, returns, and adjustments
- **Average Cost Method**: Automatic stock valuation using weighted average cost
- **Stock Movement Tracking**: Detailed movement history with balance calculations
- **Multi-dimensional Reporting**: Stock movement and valuation reports by product/category/HS code

### Report Server Architecture (3-Service Design)

A separate Java-based report server provides PDF generation via direct HTTP communication:
- **Technology**: Spring Boot + JasperReports + Spring Actuator
- **Port**: 3502
- **Service Management**: Runs as systemd service with dependency chain (Report Server → Backend → Frontend)
- **Integration**: Django views make direct HTTP requests to Jasper server using `ReportClient`
- **Data Flow**: Frontend → Django API → ReportClient → Jasper Server → PDF Response
- **Health Checks**: Spring Actuator endpoints (`/actuator/health`) for monitoring
- **Error Handling**: Connection timeouts, retries, and fallback error messages
- **PDF Generation**: Voucher reports with company branding and line-item details

## Development Patterns

### Adding New API Endpoints

1. Create view in appropriate app's `views.py` (e.g., `backend/accounting/views.py`, `backend/inventory/views.py`) using `APIResponse` utility
2. Add URL pattern to app's `urls.py` (e.g., `backend/accounting/urls.py`, `backend/inventory/urls.py`)
3. Include app URLs in main `backend/afco_erp/urls.py` if needed
4. Create service function in `frontend/src/services/api.js` or use `createCRUDService`
5. Handle responses in frontend components (errors automatically toast)
6. Ensure company isolation by checking `UserActivity.current_company` in views

### Creating New UI Components

1. Follow Radix UI patterns in `/components/ui/`
2. Add dark mode support with `dark:` classes
3. Use consistent spacing and color schemes
4. Import icons from `lucide-react`

### Error Handling Strategy

- **Backend:** All views use `APIResponse` for consistent error format
- **Frontend:** API service automatically shows error toasts
- **Manual errors:** Use `toast.error()` for client-side validation
- **Network errors:** Automatic retry with exponential backoff

## Test Credentials

For development and testing:
- **Email:** `test@example.com`
- **Password:** `testpass123`

## Port Configuration

- **Frontend App:** http://localhost:3500
- **Backend API:** http://localhost:3501
- **Report Server:** http://localhost:3502
- **CORS:** Configured for all service ports

## Service Dependencies

The application consists of three systemd services with dependency chain:

**1. Report Server** (afco-report-server.service):
- **Java/Spring Boot** application on port 3502
- **Systemd managed** with auto-restart and logging
- **Health checks** via Spring Actuator endpoints
- **Prerequisites**: Java 11+, Maven 3.6+
- **Starts first** - no dependencies

**2. Django Backend** (afco-backend.service):
- **Port**: 3501
- **Depends on**: Report Server
- **Waits for**: Report Server health check before starting
- **Communicates with**: Report Server via HTTP client
- **Environment**: REPORT_SERVER_URL=http://localhost:3502

**3. React Frontend** (afco-frontend.service):
- **Port**: 3500
- **Depends on**: Django Backend 
- **Environment**: VITE_API_URL=http://localhost:3501/api
- **Environment**: VITE_REPORT_SERVER_URL=http://localhost:3502
- **Serves**: Static files and API proxy to backend

**Service Start Order**: Report Server → Backend → Frontend

## Initial Setup

To set up the development environment from scratch:

### Backend Setup
```bash
cd /home/ali/development/afco_erp/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### Frontend Setup
```bash
cd /home/ali/development/afco_erp/frontend
pnpm install  # or npm install
```

### Database Connection
The application uses SQLite3 by default (configured in `settings.py`). For production, update `DATABASES` setting to use PostgreSQL or MySQL.

### Service Setup
All three services are configured to run as systemd services:
```bash
# Services are managed by systemd in dependency order
sudo systemctl enable afco-report-server.service
sudo systemctl enable afco-backend.service
sudo systemctl enable afco-frontend.service

# Start services (use restart-services.sh for proper ordering)
sudo systemctl start afco-report-server.service
sudo systemctl start afco-backend.service
sudo systemctl start afco-frontend.service
```
## Code Quality Guidelines

- **DRY and YAGNI principles**: Write simple, modular code without unnecessary complexity
- **File organization**: Split large files into smaller, focused modules grouped in appropriate folders
- **Component reuse**: Always check for existing components before creating new ones
- **UI components**: Use Shadcn UI and Radix UI pre-built components exclusively
- **Service restart**: Servers run via systemd - use `./restart-services.sh` after code changes

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested