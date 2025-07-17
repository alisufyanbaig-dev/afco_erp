# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AFCO ERP is a Django REST Framework + React Enterprise Resource Planning application designed for Pakistani businesses. The backend runs on port 3500, frontend on port 3501, both managed as systemd services.

## Development Commands

### Backend (Django)
```bash
# Navigate to backend directory
cd /home/ali/development/afco_erp/backend

# Run development server manually (alternative to systemd service)
python manage.py runserver 3500

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Create test user
python manage.py shell -c "
from common.models import User
User.objects.create_user(email='test@example.com', password='testpass123', first_name='Test', last_name='User')
"

# Install backend dependencies
pip install -r requirements.txt
```

### Frontend (React + Vite)
```bash
# Navigate to frontend directory  
cd /home/ali/development/afco_erp/frontend

# Development server (alternative to systemd service)
npm run dev -- --host 0.0.0.0 --port 3501

# Build for production
npm run build

# Lint code
npm run lint

# Install frontend dependencies
npm install
```

### Service Management
```bash
# Restart both services after code changes
./restart-services.sh

# Individual service control
sudo systemctl restart afco-backend.service
sudo systemctl restart afco-frontend.service
sudo systemctl status afco-backend.service
sudo systemctl status afco-frontend.service

# View service logs
sudo journalctl -u afco-backend.service -f
sudo journalctl -u afco-frontend.service -f
```

## Architecture Overview

### Backend Structure (`/backend/`)

**Key Files:**
- `afco_erp/settings.py` - Django configuration with JWT, CORS, and Pakistan timezone
- `common/models.py` - User, Company, FinancialYear models with Pakistani business validations
- `common/views.py` - Authentication APIs using standardized response format
- `common/utils.py` - `APIResponse` class for consistent API responses
- `common/serializers.py` - DRF serializers with custom JWT token handling

**API Architecture:**
- **Base URL:** `http://localhost:3500/api/`
- **Response Format:** `{status_code, success, message, data, errors}`
- **Authentication:** JWT with 60min access tokens, 7-day refresh tokens
- **Error Handling:** Centralized via `APIResponse` utility with automatic toast notifications

**Key Endpoints:**
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/register/` - User registration  
- `POST /api/auth/logout/` - Token blacklisting
- `GET/PUT /api/auth/profile/` - Profile management
- `POST /api/auth/change-password/` - Password change

### Frontend Structure (`/frontend/src/`)

**Key Files:**
- `App.jsx` - Root component with theme, auth, and toast providers
- `services/api.js` - Comprehensive API client with token refresh, retry logic, and error handling
- `contexts/AuthContext.jsx` - Authentication state management
- `contexts/ThemeContext.jsx` - Dark/light theme with localStorage persistence
- `components/layout/dashboard-layout.jsx` - Main application layout with collapsible sidebar

**Component Organization:**
- `/components/ui/` - Reusable Radix UI-based components
- `/components/layout/` - Layout components with theme support
- `/pages/` - Feature-specific page components
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

### Pakistani Business Features

The application includes Pakistan-specific validations and fields:
- **NTN validation** (format: 1234567-8)
- **Provincial dropdown** for Pakistani provinces  
- **Business type classifications** (Sole Proprietorship, Partnership, etc.)
- **STRN field** for Sales Tax Registration Number
- **PKT timezone** (Asia/Karachi) configuration

## Development Patterns

### Adding New API Endpoints

1. Create view in `backend/common/views.py` using `APIResponse` utility
2. Add URL pattern to `backend/common/urls.py`
3. Create service function in `frontend/src/services/api.js` or use `createCRUDService`
4. Handle responses in frontend components (errors automatically toast)

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

- **Backend API:** http://localhost:3500
- **Frontend App:** http://localhost:3501
- **CORS:** Configured for both development and production origins

## Service Dependencies

Both services are configured to:
- **Auto-restart** on failure
- **Start on boot** via systemd
- **Run as user** `ali` with appropriate permissions
- **Log to systemd journal** for debugging

You need to improve the prompt that I send you, add more details to it that I miss add proper functionality to it.