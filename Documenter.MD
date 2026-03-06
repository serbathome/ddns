# DDNS Management System Documentation

## Technical Stack

- **Backend:** ASP.NET Core 9.0 Minimal APIs, Entity Framework Core (SQLite)
- **Frontend:** React 18, Vite, Material-UI
- **Database:** SQLite (file: backend/app.db)
- **API Communication:** REST (http://localhost:5000), CORS enabled for http://localhost:5173

## Business Logic

### User Management
- Users are identified by email and a GUID token (no passwords).
- Token-based authentication: token passed via query string (GET) or request body (POST/PATCH).

### DNS Record Management
- Records: Id, Token, IpAddress, Hostname, Status, LastUpdatedAt
- Hostnames are globally unique across all users.
- CRUD operations for DNS records, with status lifecycle:
  - "added" → "active" (auto, 5 min timer)
  - "active" → "refreshed" (manual refresh)
- DnsRecordActivationService (background job) activates records every 5 minutes.

### API Patterns
- Minimal API endpoints with inline async lambdas.
- Request/response records defined at bottom of Program.cs.
- JSON serialization uses camelCase.
- All endpoints validate token existence before operations.
- Hostname uniqueness enforced globally (not per user).

### Frontend Logic
- SPA with routing: /login, /signup, /dashboard, /add-dns-record, /edit-dns-record/:id
- Auth state stored in useState + localStorage.
- Material-UI for styling, responsive layouts.
- Error handling matches backend HTTP status codes to user-friendly messages.

### Development Workflow
- Backend: `dotnet run` in backend directory
- Frontend: `npm run dev` in frontend directory
- Database schema changes require manual deletion of app.db
- Scalar UI for API docs at /scalar/v1

### Common Issues
- "N/A" in UI: missing property in backend projection or camelCase mismatch
- Database locked: stop all dotnet processes before deleting app.db
- CORS errors: backend must be running before frontend

## File Map
- Backend entry: backend/Program.cs
- Frontend entry: frontend/src/App.jsx
- Background jobs: backend/DnsRecordActivationService.cs
- Data access: backend/AppDbContext.cs
- UI components: frontend/src/components/ManagementPage.jsx
