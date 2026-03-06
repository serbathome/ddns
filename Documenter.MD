# DDNS Management System Documentation

## Technical Stack

### Backend
- **Framework:** ASP.NET Core 9.0 (Minimal APIs)
- **Database:** SQLite (via Entity Framework Core)
- **Language:** C#
- **Authentication:** Token-based (GUID tokens)
- **Background Service:** DnsRecordActivationService (periodic activation)
- **API Documentation:** Scalar UI (dev only)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **UI Library:** Material-UI
- **Routing:** React Router v6
- **State Management:** useState + localStorage (no Redux/Context)

## Business Logic

### User Management
- Users are created with an email and assigned a unique token (GUID).
- Authentication is token-based; no passwords are used.
- Token is required for all API operations.

### DNS Record Management
- Records have: Id, Token, IpAddress, Hostname, Status, LastUpdatedAt.
- Hostnames are globally unique across all users.
- CRUD operations for DNS records via REST API.
- Status lifecycle: "added" → "active" → "refreshed" (one-way transitions).
- DnsRecordActivationService activates records every 5 minutes.
- Manual refresh transitions status to "refreshed".

### API Patterns
- Endpoints use minimal API pattern with inline async lambdas.
- Token passed via query string (GET) or request body (POST/PATCH).
- All endpoints validate token existence before operations.
- Hostname uniqueness enforced globally (not per user).
- GET endpoints use projections to shape JSON responses.

### Frontend Logic
- SPA with protected routes: /login, /signup, /dashboard, /add-dns-record, /edit-dns-record/:id.
- Auth state persisted in localStorage.
- Pages handle data fetching; components receive props.
- Material-UI used for styling and responsive layouts.
- Error handling matches backend HTTP status codes to user-friendly messages.

## Development Workflow
- Backend runs on http://localhost:5000
- Frontend runs on http://localhost:5173
- CORS configured for frontend-backend communication.
- Database schema changes require manual deletion of app.db.

## Common Issues
- "N/A" in UI: Check backend projection and property naming.
- Database locked: Stop all dotnet processes before deleting app.db.
- CORS errors: Ensure backend is running before frontend.

## File Map
- Backend entry: backend/Program.cs
- Frontend entry: frontend/src/App.jsx
- Background jobs: backend/DnsRecordActivationService.cs
- Data access: backend/AppDbContext.cs
- UI components: frontend/src/components/ManagementPage.jsx
