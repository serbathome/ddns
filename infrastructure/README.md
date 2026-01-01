# Azure Container Apps Deployment

This directory contains deployment configurations for Azure Container Apps.

## Prerequisites

1. Azure CLI installed and logged in
2. Docker image built and pushed to a container registry
3. Azure Container Apps environment created

## Build and Push Docker Image

```bash
# Build the image
cd backend
docker build -t your-registry.azurecr.io/ddns-backend:latest .

# Login to Azure Container Registry
az acr login --name your-registry

# Push the image
docker push your-registry.azurecr.io/ddns-backend:latest
```

## Deploy to Azure Container Apps

```bash
# Create resource group
az group create --name ddns-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name ddns-env \
  --resource-group ddns-rg \
  --location eastus

# Create container app with managed identity
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
    AzureDns__ResourceGroupName=your-resource-group \
    AzureDns__SubscriptionId=your-subscription-id \
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
  --scope /subscriptions/your-subscription-id/resourceGroups/your-resource-group/providers/Microsoft.Network/dnszones/example.com
```

## Update Deployment

```bash
# Update with new image
az containerapp update \
  --name ddns-backend \
  --resource-group ddns-rg \
  --image your-registry.azurecr.io/ddns-backend:latest
```

## View Logs

```bash
az containerapp logs show \
  --name ddns-backend \
  --resource-group ddns-rg \
  --follow
```

## Important Notes

1. **Persistent Storage**: SQLite database is stored in-memory by default in ACA. For production, consider:
   - Using Azure SQL Database or PostgreSQL instead
   - Mounting Azure Files for persistent SQLite storage
   
2. **Managed Identity**: The app uses system-assigned managed identity for Azure DNS authentication. Ensure the identity has "DNS Zone Contributor" role on your DNS zone.

3. **CORS**: Update backend CORS configuration to include your Container App URL:
   ```csharp
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
