# DDNS Application

A Dynamic DNS management application with a React frontend and ASP.NET Core backend.

## Features

- **Sign Up**: Create a new account with your email and receive a unique token
- **Login**: Authenticate using your email and token
- **Management Dashboard**: View your account details after successful login

## Tech Stack

### Frontend
- React with Vite
- Material-UI (MUI)
- Modern responsive design with gradient backgrounds

### Backend
- ASP.NET Core 9.0
- Entity Framework Core with SQLite
- Scalar API documentation (OpenAPI)

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js and npm

### Running the Backend

```bash
cd backend
dotnet run
```

The backend will start at http://localhost:5000

API endpoints:
- `GET /health` - Health check
- `POST /api/user` - Create new user (accepts email, returns token)
- `POST /api/login` - Login (accepts email and token)
- `GET /scalar/v1` - API documentation (development only)

### Running the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start at http://localhost:5173

## Usage

1. Start the backend server (it will create the SQLite database automatically)
2. Start the frontend development server
3. Open http://localhost:5173 in your browser
4. Use the **Sign Up** form to create a new account
5. Copy the generated token (you'll need it to log in)
6. Use the **Login** form to authenticate with your email and token
7. Access the management dashboard after successful login

## Project Structure

```
ddns/
├── backend/
│   ├── Program.cs
│   ├── AppDbContext.cs
│   ├── User.cs
│   ├── appsettings.json
│   └── backend.csproj
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── SignupForm.jsx
│           ├── LoginForm.jsx
│           └── ManagementPage.jsx
└── README.md
```
