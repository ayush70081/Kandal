# Mangrove Authentication System

A complete MERN stack authentication system with JWT and refresh token mechanism.

## Features

- **User Registration & Login**: Secure authentication with email/username
- **JWT Authentication**: Short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
- **Automatic Token Refresh**: Seamless token renewal without user interruption
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Protected Routes**: Route protection for authenticated users only
- **Classic UI**: Clean, professional interface without purple colors or SVGs
- **MongoDB Integration**: Secure user data storage
- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: User-friendly error messages and feedback

## Technology Stack

### Backend
- **Express.js**: Node.js web framework
- **MongoDB**: Database with Mongoose ODM
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **Express-validator**: Input validation
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 19**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Context API**: Global state management

## Project Structure

```
Mangrove/
├── backend/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── controllers/
│   │   └── auth.controller.js    # Authentication logic
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT middleware
│   ├── models/
│   │   └── user.model.js         # User schema
│   ├── routes/
│   │   └── auth.routes.js        # Auth endpoints
│   ├── utils/
│   │   └── jwt.utils.js          # JWT utilities
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Server entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Home.jsx          # Dashboard component
    │   │   ├── Login.jsx         # Login form
    │   │   ├── Register.jsx      # Registration form
    │   │   └── ProtectedRoute.jsx # Route protection
    │   ├── contexts/
    │   │   └── AuthContext.jsx   # Authentication state
    │   ├── styles/
    │   │   ├── auth.css          # Authentication styles
    │   │   └── home.css          # Dashboard styles
    │   ├── utils/
    │   │   └── axios.js          # HTTP client with interceptors
    │   ├── App.jsx               # Main app component
    │   └── main.jsx              # Entry point
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/mangrove_auth
   JWT_ACCESS_SECRET=your_super_secret_access_token_key_here_2024_mangrove_auth
   JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_here_2024_mangrove_auth
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

Ensure MongoDB is running locally on port 27017, or update the `MONGODB_URI` in the `.env` file to point to your MongoDB instance.

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/logout-all` - Logout from all devices
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/health` - Health check

## Authentication Flow

1. **Registration**: User creates account with email, username, password, and name
2. **Login**: User authenticates with email/username and password
3. **Token Generation**: Server generates access token (15 min) and refresh token (7 days)
4. **Protected Access**: Access token required for protected routes
5. **Auto Refresh**: Frontend automatically refreshes expired access tokens
6. **Logout**: Tokens are invalidated and removed

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Security**: Signed tokens with short expiration
- **Token Rotation**: Refresh tokens are rotated on use
- **Input Validation**: Server-side validation and sanitization
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Built-in rate limiting for auth endpoints

## Usage

1. **Start both servers** (backend on port 5000, frontend on port 5173)
2. **Register a new account** at http://localhost:5173/register
3. **Login with credentials** at http://localhost:5173/login
4. **Access protected dashboard** at http://localhost:5173/home
5. **Manage profile** and change password from the dashboard

## Features Implemented

- ✅ User registration with validation
- ✅ User login with email or username
- ✅ JWT access and refresh tokens
- ✅ Automatic token refresh
- ✅ Protected route system
- ✅ User dashboard with profile management
- ✅ Password change functionality
- ✅ Logout and logout from all devices
- ✅ Classic UI design (no purple colors or SVGs)
- ✅ Responsive design
- ✅ Error handling and user feedback
- ✅ Input validation and security

## Development Notes

- Follow the file naming convention: `feature.type.js`
- All authentication state is managed through React Context
- Axios interceptors handle token refresh automatically
- MongoDB warnings have been resolved
- All components use classic styling without complex graphics

## Next Steps

To continue developing:
1. Add password reset functionality
2. Implement email verification
3. Add user roles and permissions
4. Add two-factor authentication
5. Implement social login options