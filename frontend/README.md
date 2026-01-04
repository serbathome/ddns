# Free DynDNS - Frontend

A modern React-based web interface for managing Dynamic DNS records with Azure DNS integration.

## Features

- **User Authentication**: Token-based authentication with persistent login
- **DNS Record Management**: Create, update, refresh, and delete DNS records
- **Real-time Status**: Visual indicators for record states (added, active, refreshed, inactive)
- **Responsive Design**: Material-UI components with gradient backgrounds
- **Dark Mode Support**: Beautiful purple gradient theme
- **API Documentation**: In-app documentation for users

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast development server and build tool
- **Material-UI (MUI)** - Component library for consistent UI
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: `http://localhost:5000`)

### Installation

```bash
npm install
```

### Configuration

Edit `src/config.js` to match your environment:

```javascript
export const config = {
  domainName: 'my-cloud-lab.com',  // Your Azure DNS zone
  apiUrl: 'http://localhost:5000'  // Backend API URL
};
```

### Development

```bash
npm run dev
```

The frontend starts at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Built files are placed in `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                  # Main app component with routing
│   ├── App.css                  # Global styles
│   ├── config.js                # Configuration (domain, API URL)
│   ├── main.jsx                 # Entry point
│   ├── components/
│   │   ├── SignupForm.jsx       # User registration form
│   │   ├── LoginForm.jsx        # Login form
│   │   └── ManagementPage.jsx   # DNS records table with CRUD
│   ├── pages/
│   │   ├── SignupPage.jsx       # Registration page
│   │   ├── LoginPage.jsx        # Login page
│   │   ├── DashboardPage.jsx    # Main dashboard
│   │   ├── AddDnsRecordPage.jsx # Create record form
│   │   ├── EditDnsRecordPage.jsx # Edit record form
│   │   └── DocumentationPage.jsx # User guide
│   └── utils/
│       └── api.js               # API helper functions
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
├── nginx.conf                    # Nginx config for production
└── Dockerfile                    # Container image
```

## Features Overview

### Authentication
- **Signup**: Create account with email, receive unique token
- **Login**: Authenticate with email + token
- **Persistent Session**: Token stored in localStorage

### DNS Management
- **Add Record**: Create new DNS record with hostname and IP
- **Edit Record**: Update existing record's IP or hostname
- **Refresh**: Update last modified timestamp to prevent expiration
- **Delete**: Remove record (soft delete, cleanup after 5 minutes)

### Record States
- 🟡 **added** - Created, waiting for Azure DNS sync
- 🟢 **active** - Synced to Azure DNS, accessible
- 🔵 **refreshed** - Recently updated timestamp
- 🔴 **inactive** - Expired (TTL exceeded), will be deleted

## API Integration

The frontend communicates with the backend using Bearer token authentication:

```javascript
// Example API call
const response = await fetch(`${config.apiUrl}/api/dns`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Docker Deployment

Build and run the frontend container:

```bash
docker build -t ddns-frontend:latest .
docker run -p 80:80 ddns-frontend:latest
```

The Dockerfile uses Nginx to serve the built React app.

## Environment Variables

Configure via `config.js` or build-time environment variables:

- `VITE_API_URL` - Backend API endpoint
- `VITE_DOMAIN_NAME` - Your DNS zone name

## Development Tips

### Hot Module Replacement (HMR)
Vite provides instant feedback during development. Changes appear without full page reload.

### ESLint
The project includes ESLint configuration for code quality:

```bash
npm run lint
```

## User Guide

For end-users, the application includes built-in documentation accessible from the dashboard. Key concepts:

1. **Hostname**: Choose a unique name (becomes `hostname.your-domain.com`)
2. **IP Address**: Your device's public IP
3. **TTL**: Records expire after 1 hour unless refreshed
4. **Sync Delay**: Azure DNS updates every 5 minutes

## Contributing

When adding new features:
1. Follow Material-UI design patterns
2. Use React hooks (no class components)
3. Keep API calls in `utils/api.js`
4. Update documentation pages as needed

## License

MIT License - See root LICENSE file
