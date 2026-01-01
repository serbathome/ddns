# Free DynDNS

A Dynamic DNS management system with Azure DNS integration, featuring automated record synchronization, TTL-based expiration, and containerized deployment support.

## Features

### User Management
- **Token-based Authentication**: Secure authentication using Authorization Bearer tokens
- **Account Creation**: Generate unique tokens for API access
- **Login System**: Email and token-based authentication

### DNS Record Management
- **CRUD Operations**: Create, read, update, and delete DNS records
- **Real-time Sync**: Automatic synchronization with Azure DNS zones
- **Status Tracking**: Records lifecycle: `added` → `active` → `refreshed` → `inactive`
- **TTL Expiration**: Automatic record expiration based on configurable TTL
- **Hostname Validation**: Global uniqueness validation across all users
- **Soft Delete**: Records marked inactive before Azure DNS cleanup

### Background Processing
- **5-Minute Sync Cycle**: Automated background service for DNS operations
  - Activates new/updated records in Azure DNS
  - Expires stale records based on TTL
  - Deletes inactive records from Azure DNS
- **Hostname Change Handling**: Automatic cleanup of old DNS records when hostname changes

### Azure Integration
- **Azure DNS Zone Management**: Direct integration with Azure DNS
- **Managed Identity Support**: Secure authentication using Azure Managed Identity
- **A Record Management**: Create, update, and delete DNS A records with 1-hour TTL

### Security
- **Authorization Headers**: Industry-standard Bearer token authentication
- **Token Isolation**: Per-user token with record isolation
- **Secure Defaults**: Non-root container user, HTTPS redirection

## Tech Stack

### Frontend
- React 18 with Vite
- Material-UI (MUI)
- React Router for navigation
- Modern responsive design with gradient backgrounds
- Configurable domain visualization

### Backend
- ASP.NET Core 9.0 Minimal APIs
- Entity Framework Core with SQLite
- Azure SDK for DNS management (Azure.ResourceManager.Dns)
- Background services with PeriodicTimer
- Scalar API documentation (OpenAPI)

### Infrastructure
- Docker containerization
- Azure Container Apps ready
- Kubernetes deployment manifests
- Managed Identity authentication

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js and npm
- Azure subscription (for DNS integration)
- Azure DNS zone configured

### Configuration

#### Backend Configuration (`backend/appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=app.db"
  },
  "RecordTTL": 3600,
  "AzureDns": {
    "ZoneName": "your-domain.com",
    "ResourceGroupName": "your-resource-group",
    "SubscriptionId": "your-subscription-id"
  }
}
```

#### Frontend Configuration (`frontend/src/config.js`)
```javascript
export const config = {
  domainName: 'your-domain.com',
  apiUrl: 'http://localhost:5000'
};
```

### Running Locally

#### Backend
```bash
cd backend
dotnet restore
dotnet run
```

The backend starts at `http://localhost:5000`

**API Endpoints:**
- `GET /health` - Health check
- `POST /api/user` - Create user (returns token)
- `POST /api/login` - Authenticate user
- `GET /api/dns` - List DNS records (requires Authorization header)
- `POST /api/dns` - Create DNS record (requires Authorization header)
- `PATCH /api/dns/{id}` - Update DNS record (requires Authorization header)
- `DELETE /api/dns/{id}` - Delete DNS record (requires Authorization header)
- `POST /api/dns/refresh` - Refresh record timestamp (accepts Authorization header OR body token)
- `GET /scalar/v1` - API documentation (development only)

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`

### Azure Authentication

**Local Development:**
```bash
az login
```

**Azure Container Apps:**
Enable system-assigned managed identity and grant DNS Zone Contributor role:
```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "DNS Zone Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Network/dnszones/{zone-name}
```

## Docker Deployment

### Build Image
```bash
cd backend
docker build -t ddns-backend:latest .
```

### Run Container
```bash
docker run -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e AzureDns__ZoneName=your-domain.com \
  -e AzureDns__ResourceGroupName=your-rg \
  -e AzureDns__SubscriptionId=your-sub-id \
  ddns-backend:latest
```

## Azure Container Apps Deployment

See `infrastructure/README.md` for complete deployment instructions including:
- Container registry setup
- Container Apps environment creation
- Managed identity configuration
- DNS role assignment

## Architecture

### Record Lifecycle

```
User creates record (status: "added")
    ↓
Background service (5 min)
    ↓
Create in Azure DNS → status: "active"
    ↓
User updates record (status: "updated")
    ↓
Background service
    ↓
Update Azure DNS → status: "active"
    ↓
TTL expires (no refresh)
    ↓
Background service → status: "inactive"
    ↓
Background service
    ↓
Delete from Azure DNS → Remove from DB
```

### Background Service Tasks

Every 5 minutes:
1. **Expire stale records**: Mark active/refreshed records as inactive if `LastUpdatedAt` exceeds TTL
2. **Sync new/updated records**: Create or update A records in Azure DNS
3. **Handle hostname changes**: Delete old DNS records after new ones are created
4. **Cleanup inactive records**: Delete from Azure DNS and database

## Project Structure

```
ddns/
├── backend/
│   ├── Program.cs                      # API endpoints + startup
│   ├── AppDbContext.cs                 # EF Core context
│   ├── User.cs                         # User entity
│   ├── Record.cs                       # DNS record entity
│   ├── AzureDnsService.cs              # Azure DNS operations
│   ├── DnsRecordActivationService.cs   # Background service
│   ├── Dockerfile                      # Container image
│   ├── appsettings.json                # Configuration
│   └── backend.csproj                  # Project file
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Router + auth state
│   │   ├── config.js                   # App configuration
│   │   ├── utils/
│   │   │   └── api.js                  # Auth header helpers
│   │   ├── components/
│   │   │   ├── SignupForm.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── ManagementPage.jsx      # DNS record table
│   │   └── pages/
│   │       ├── AddDnsRecordPage.jsx
│   │       └── EditDnsRecordPage.jsx
│   ├── public/
│   │   └── favicon.svg
│   └── index.html
├── infrastructure/
│   ├── kubernetes-deployment.yaml      # K8s manifests
│   └── README.md                       # Deployment guide
├── .github/
│   └── copilot-instructions.md         # AI agent instructions
└── README.md
```

## Usage

1. **Sign Up**: Create account and save your token
2. **Login**: Authenticate with email + token
3. **Add DNS Record**: Create hostname with IP address (status: `added`)
4. **Wait 5 Minutes**: Background service creates record in Azure DNS (status: `active`)
5. **Update Record**: Change IP or hostname (status: `updated`)
6. **Auto-Expire**: Records not updated within TTL marked `inactive`
7. **Delete Record**: Mark as `inactive`, removed from Azure DNS on next cycle

## Database Schema

### Users
- `Id` (int, PK)
- `UserEmail` (string)
- `Token` (GUID)

### Records
- `Id` (int, PK)
- `Token` (string, FK to User)
- `IpAddress` (string)
- `Hostname` (string, unique globally)
- `OldHostname` (string?, nullable)
- `Status` (string: added/active/refreshed/inactive)
- `LastUpdatedAt` (DateTime)

## Security Best Practices

✅ Authorization Bearer tokens (not in query strings)  
✅ Token validation on all protected endpoints  
✅ Managed Identity for Azure authentication  
✅ Non-root container user  
✅ CORS restricted to frontend origin  
✅ Soft delete with cleanup confirmation  

## License

This project is licensed under the MIT License.
