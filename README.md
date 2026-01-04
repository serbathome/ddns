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
- Modern responsive design
- Configurable domain visualization

### Backend
- ASP.NET Core 9.0 Minimal APIs
- Entity Framework Core with Azure SQL Database
- Passwordless authentication via Azure Entra ID (Managed Identity)
- Azure SDK for DNS management (Azure.ResourceManager.Dns)
- Background services with PeriodicTimer
- Scalar API documentation (OpenAPI)
- EF Core Migrations for schema management

### Infrastructure
- Docker containerization
- Azure Container Apps ready
- Kubernetes deployment manifests
- Managed Identity authentication

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js and npm
- Azure subscription (for DNS and database)
- Azure DNS zone configured
- Azure SQL Database configured with Entra ID authentication
- Azure CLI installed and authenticated (`az login`)

### Configuration

#### Backend Configuration (`backend/appsettings.json`)
```json
{Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  },
  "RecordTTL": 3600,
  "AzureDns": {
    "ZoneName": "your-domain.com",
    "ResourceGroupName": "your-resource-group",
    "SubscriptionId": "your-subscription-id"
  }
}
```

**Note**: The connection string uses passwordless authentication. No credentials are stored in configuration files.
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

**First Time Setup:**
1. Sign in to Azure:
```bash
az login
```

2. Create SQL database user (run in Azure Portal Query Editor on your database):
```sql
CREATE USER [your-email@domain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your-email@domain.com];
ALTER ROLE db_datawriter ADD MEMBER [your-email@domain.com];
ALTER ROLE db_ddladmin ADD MEMBER [your-email@domain.com];
GO
```

3. Create and apply database migrations:
```bash
cd backend
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
```

**Run the Application:**
```bash
cd backend
dotnet restore
dotnet run
```
The application uses **passwordless authentication** via Azure Entra ID (formerly Azure Active Directory) for both Azure SQL Database and Azure DNS operations using `DefaultAzureCredential`.

**Local Development:**
```bash
# Sign in to Azure (uses your credentials for both SQL and DNS)
az login

# Verify you're signed in
az account show
```

**Azure SQL Database Setup:**

Quick steps:
1. Create database user for local development (your Azure account)
2. For production: Enable managed identity and create SQL user for the identity
3. Grant roles: `db_datareader`, `db_datawriter`, `db_ddladmin`

**Azure DNS Setup:**

Enable system-assigned managed identity and grant DNS Zone Contributor role:
```bash
# For Azure Container Apps
az containerapp identity assign \
  --name <app-name> \
  --resource-group <resource-group> \
  --sConnectionStrings__DefaultConnection="Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;Authentication=Active Directory Default;Encrypt=True;" \
  -e AzureDns__ZoneName=your-domain.com \
  -e AzureDns__ResourceGroupName=your-rg \
  -e AzureDns__SubscriptionId=your-sub-id \
  ddns-backend:latest
```

**Note**: When running in Azure (Container Apps, AKS, App Service), managed identity is automatically discovered. No additional environment variables needed for authentication.PATCH /api/dns/{id}` - Update DNS record (requires Authorization header)
- `DELETE /api/dns/{id}` - Delete DNS record (requires Authorization header)
- `POST /api/dns/refresh` - Refresh record timestamp (accepts Authorization header OR body token)
- `GET /scalar/v1` - API documentation (development only)
System-assigned managed identity configuration
- Azure SQL Database user creation with Object ID
- DNS Zone Contributor role assignment

**Quick Setup Commands:**
```bash
# Enable managed identity
az containerapp identity assign --name <app> --resource-group <rg> --system-assigned

# Get the principal ID
PRINCIPAL_ID=$(az containerapp identity show --name <app> --resource-group <rg> --query principalId -o tsv)

# Create SQL user (run in Azure Portal Query Editor)
CREATE USER [your-app-name] FROM EXTERNAL PROVIDER WITH OBJECT_ID = '<principal-id-guid>';
ALTER ROLE db_datareader ADD MEMBER [your-app-name];
ALTER ROLE db_datawriter ADD MEMBER [your-app-name];
ALTER ROLE db_ddladmin ADD MEMBER [your-app-name];
GO

# Grant DNS permissions
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "DNS Zone Contributor" \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Network/dnszones/<zone>
```
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

Ev**Passwordless Authentication**: No credentials in configuration files  
✅ **Azure Entra ID Integration**: Managed Identity for Azure SQL and DNS  
✅ **Authorization Bearer Tokens**: Industry-standard API authentication  
✅ **Token Validation**: All protected endpoints validated  
✅ **Encrypted Connections**: TLS for Azure SQL Database  
✅ **Non-root Container User**: Security-hardened Docker images  
✅ **CORS Restricted**: Frontend origin whitelisting  
✅ **Soft Delete**: Confirmation before permanent removal  
✅ **Principle of Least Privilege**: Granular role assignments  


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

## License

This project is licensed under the MIT License.
