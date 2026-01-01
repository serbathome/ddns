# Deployment Guide

This directory contains deployment configurations for Azure Container Apps and Kubernetes.

## Prerequisites

1. Azure CLI installed and logged in
2. Azure Container Registry (ACR) or other container registry
3. Azure Container Apps environment or Kubernetes cluster

## CI/CD with GitHub Actions

The project includes automated build workflows that trigger on changes to frontend or backend folders:

- `.github/workflows/build-backend.yml` - Builds and pushes backend image to ACR
- `.github/workflows/build-frontend.yml` - Builds and pushes frontend image to ACR

**Required GitHub Configuration:**

Repository Variables:
- `ACR_SERVER` - Your ACR server (e.g., `myregistry.azurecr.io`)
- `ACR_LOGIN` - ACR username

Repository Secrets:
- `ACR_PASSWORD` - ACR password

Images are tagged with semantic version + build number (e.g., `1.0.0-123`) and also pushed as `latest`.

## Manual Build and Push

### Backend
```bash
cd backend
docker build -t your-registry.azurecr.io/ddns-backend:1.0.0 .
docker push your-registry.azurecr.io/ddns-backend:1.0.0
```

### Frontend
```bash
cd frontend
docker build -t your-registry.azurecr.io/ddns-frontend:1.0.0 \
  --build-arg VITE_DOMAIN_NAME=your-domain.com \
  --build-arg VITE_API_URL=https://api.your-domain.com .
docker push your-registry.azurecr.io/ddns-frontend:1.0.0
```

## Deploy to Azure Container Apps

### Backend Deployment

```bash
# Create resource group
az group create --name ddns-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name ddns-env \
  --resource-group ddns-rg \
  --location eastus

# Create backend container app with managed identity
az containerapp create \
  --name ddns-backend \
  --resource-group ddns-rg \
  --environment ddns-env \
  --image your-registry.azurecr.io/ddns-backend:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --registry-server your-registry.azurecr.io \
  --registry-identity system \
  --env-vars \
    ASPNETCORE_ENVIRONMENT=Production \
    AzureDns__ZoneName=example.com \
    AzureDns__ResourceGroupName=your-dns-rg \
    AzureDns__SubscriptionId=your-subscription-id \
    RecordTTL=3600 \
    Cors__AllowedOrigins=https://your-frontend-url.azurecontainerapps.io \
  --system-assigned

# Get the container app's managed identity
IDENTITY_ID=$(az containerapp show \
  --name ddns-backend \
  --resource-group ddns-rg \
  --query identity.principalId -o tsv)

# Grant DNS Zone Contributor role to the managed identity
az role assignment create \
  --assignee $IDENTITY_ID \
  --role "DNS Zone Contributor" \
  --scope /subscriptions/your-subscription-id/resourceGroups/your-dns-rg/providers/Microsoft.Network/dnszones/example.com
### Backend Update
```bash
az containerapp update \
  --name ddns-backend \
  --resource-group ddns-rg \
  --image your-registry.azurecr.io/ddns-backend:1.0.0-123
```

### Frontend Update
```bash
az containerapp update \
  --name ddns-frontend \
  --resource-group ddns-rg \
  --image your-registry.azurecr.io/ddns-frontend:1.0.0-123
```

### Update CORS Configuration
```bash
az containerapp update \
  --name ddns-backend \
  --resource-group ddns-rg \
  --set-env-vars Cors__AllowedOrigins=https://new-frontend-url.com
az containerapp create \
  --name ddns-frontend \
  --resource-group ddns-rg \
  --environment ddns-env \
  --image your-registry.azurecr.io/ddns-frontend:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 2 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --registry-server your-registry.azurecr.io \
  --registry-identity system
### Backend Logs
```bash
az containerapp logs show \
  --name ddns-backend \
  --resource-group ddns-rg \
  --follow
```

### Frontend Logs
```bash
az containerapp logs show \
  --name ddns-frontend \
  --resource-group ddns-rg \
  --follow
```

## Configuration Reference

### Backend Environment Variables

Required:
- `AzureDns__ZoneName` - Your Azure DNS zone name (e.g., `example.com`)
- `AzureDns__ResourceGroupName` - Resource group containing the DNS zone
- `AzureDns__SubscriptionId` - Azure subscription ID
- `Cors__AllowedOrigins` - Allowed frontend origins (comma-separated)

Optional:
- `ASPNETCORE_ENVIRONMENT` - Environment (Production/Development)
- `RecordTTL` - Record expiration time in seconds (default: 3600)
- `ConnectionStrings__DefaultConnection` - Database connection string (default: `Data Source=/app/data/app.db`)

### Frontend Build Arguments

Required at build time:
- `VITE_DOMAIN_NAME` - Your domain name (e.g., `example.com`)
- `VITE_API_URL` - Backend API URL (e.g., `https://api.example.com`)

## Important Notes

### 1. Persistent Storage
SQLite database requires persistent storage in production:
- **Azure Container Apps**: Mount Azure Files or use Azure SQL Database
- **Kubernetes**: Use PersistentVolumeClaim (included in `kubernetes-deployment.yaml`)

### 2. Managed Identity
Backend uses Azure Managed Identity for DNS authentication:
- System-assigned identity is automatically created
- Must grant "DNS Zone Contributor" role to the identity
- No credentials needed in configuration

### 3. CORS Configuration
Backend CORS is configured via `Cors__AllowedOrigins` environment variable:
- Supports multiple origins (comma-separated)
- Must match frontend URL exactly (including protocol and subdomain)
- Example: `https://www.example.com,https://example.com`

### 4. Frontend Configuration
Frontend config is baked into the build:
- `VITE_DOMAIN_NAME` and `VITE_API_URL` must be set at build time
- Rebuilding required for config changes
- Consider using different images for different environments

### 5. Version Management
- Backend version in `backend/backend.csproj` (`<Version>1.0.0</Version>`)
- Frontend version in `frontend/package.json` (`"version": "1.0.0"`)
- GitHub Actions automatically tags images as `{version}-{run_number}`

## Kubernetes Deployment

For Kubernetes deployment, see `kubernetes-deployment.yaml` which includes:
- Backend deployment with persistent volume for SQLite
- Frontend deployment serving static files via nginx
- Services with LoadBalancer/ClusterIP
- Health checks and resource limits
- ConfigMaps for environment-specific configuration

Apply manifests:
```bash
kubectl apply -f kubernetes-deployment.yaml
```
   builder.Services.AddCors(options => {
       options.AddDefaultPolicy(policy => {
           policy.WithOrigins("https://your-frontend-url.azurecontainerapps.io")
                 .AllowAnyHeader()
                 .AllowAnyMethod();
       });
   });
   ```

## Kubernetes Deployment

For Kubernetes deployment, see `kubernetes-deployment.yaml` which includes:
- Deployment with persistent volume for SQLite
- Service with LoadBalancer
- Health checks
- Resource limits
