# DDNS Application - AI Agent Instructions

## Architecture Overview

This is a **Dynamic DNS management system** with two independent services:
- **Backend** (ASP.NET Core 9.0 Minimal APIs + SQLite): Token-based authentication, DNS record CRUD, background activation service
- **Frontend** (React 18 + Vite + Material-UI): SPA with routing, localStorage auth persistence

**Critical**: Services communicate via REST API at `http://localhost:5000`. CORS is configured to allow `http://localhost:5173` only.

## Data Model & Status Flow

### Entities
- **User**: `Id`, `UserEmail`, `Token` (GUID) - Token-based auth, no passwords
- **Record**: `Id`, `Token`, `IpAddress`, `Hostname`, `Status`, `LastUpdatedAt`

### Status Lifecycle
```
"added" → "active" → "refreshed"
     ↓ (5 min timer)    ↓ (manual refresh)
```
- `DnsRecordActivationService` (BackgroundService) auto-activates records every 5 minutes
- Status transitions are **one-way**: added→active, active→refreshed

## API Patterns & Conventions

### Endpoint Structure (backend/Program.cs)
All endpoints use **minimal API pattern** with inline async lambdas:
```csharp
app.MapPost("/api/dns", async (DnsRecordRequest request, AppDbContext db) => { ... })
```

### Request/Response Records
- Defined at **bottom of Program.cs**: `CreateUserRequest`, `DnsRecordRequest`, etc.
- Use C# 9+ records with positional parameters
- JSON serialization uses **camelCase by default** (e.g., `LastUpdatedAt` → `lastUpdatedAt`)

### Authentication Pattern
Token passed via:
- **Query string** for GET: `/api/dns?token=xxx`
- **Request body** for POST/PATCH: `{ "token": "xxx", ... }`

All endpoints validate token existence before operations:
```csharp
var user = await db.Users.FirstOrDefaultAsync(u => u.Token == token);
if (user == null) return Results.StatusCode(403);
```

### Hostname Uniqueness
- **Global constraint**: Only ONE record per hostname **across all users** - hostnames are globally unique
- POST `/api/dns` fails with 500 if hostname exists anywhere in database
- PATCH `/api/dns/{id}` checks for conflicts excluding the record being edited
- The token check is intentionally excluded from hostname validation to enforce cross-user uniqueness

## Database Management

**SQLite with Entity Framework Core**
- Database file: `backend/app.db` (auto-created via `db.Database.EnsureCreated()`)
- **Schema changes require database deletion** - EnsureCreated() doesn't migrate schemas
- Stop backend → Delete `app.db`, `app.db-shm`, `app.db-wal` → Restart backend

### Projections in Queries
GET endpoints use `.Select()` to shape responses:
```csharp
.Select(r => new { r.Id, r.IpAddress, r.Hostname, r.Status, r.LastUpdatedAt })
```
**Critical**: Missing properties in projection = missing in JSON response (e.g., forgot `LastUpdatedAt` → UI shows "N/A")

## Frontend Architecture

### Routing Structure (App.jsx)
- React Router v6 with protected routes pattern
- Auth state stored in `useState` + `localStorage` for persistence
- Routes: `/login`, `/signup`, `/dashboard`, `/add-dns-record`, `/edit-dns-record/:id`

### Component Organization
- **Pages** (`src/pages/`): Route containers with navigation logic
- **Components** (`src/components/`): Reusable UI (forms, tables, etc.)
- Pages own data fetching; components receive props

### Material-UI Styling Conventions
- Use `sx` prop for inline styles (e.g., `sx={{ mb: 3, py: 4 }}`)
- Gradient backgrounds: `background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'`
- Responsive spacing: `p: { xs: 2, sm: 3, md: 4 }` for padding

### Error Handling Pattern
```javascript
if (response.status === 500) setError('Hostname already exists...');
else if (response.status === 403) setError('Invalid token...');
```
Match backend HTTP status codes to user-friendly messages.

## Development Workflows

### Running Services
**Backend** (Terminal 1):
```powershell
cd backend
dotnet run  # Starts on http://localhost:5000
```

**Frontend** (Terminal 2):
```powershell
cd frontend
npm run dev  # Starts on http://localhost:5173
```

### API Documentation
Access Scalar UI at `http://localhost:5000/scalar/v1` (dev only)

### Common Issues
1. **"N/A" in UI columns**: Check if property is included in backend `.Select()` projection AND matches camelCase in frontend
2. **Database locked**: Stop all `dotnet` processes before deleting `app.db`
3. **CORS errors**: Backend must be running before frontend; check port 5000 is available

## Code Modification Guidelines

### Adding New Record Properties
1. Add property to `backend/Record.cs`
2. Delete `app.db` and restart backend
3. Update GET endpoint projection in `Program.cs` to include new property
4. Update frontend components to display/edit new property (use camelCase in JS)

### Background Service Patterns
- Use `IServiceProvider` to create scoped `DbContext` (don't inject directly)
- Use `PeriodicTimer` for scheduled tasks (5 min = `TimeSpan.FromMinutes(5)`)
- Log each run with `_logger.LogInformation()` for observability

### Frontend State Management
- **Auth state**: `localStorage` + `useState` in App.jsx (no Redux/Context)
- **Form state**: Local `useState` with controlled inputs
- **Table data**: Fetch on mount with `useEffect`, update after mutations

## File Navigation Map

**Backend entry**: `backend/Program.cs` (all endpoints, service registration)
**Frontend entry**: `frontend/src/App.jsx` (routing, auth context)
**Background jobs**: `backend/DnsRecordActivationService.cs`
**Data access**: `backend/AppDbContext.cs` (EF Core context)
**UI components**: `frontend/src/components/ManagementPage.jsx` (DNS table with CRUD)
