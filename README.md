# Mangrove Guardian (Kandal)

**Protecting Coastal Ecosystems Through Community Monitoring**

A comprehensive MERN stack platform for mangrove conservation that empowers communities to monitor, report, and protect coastal ecosystems through collaborative environmental stewardship.

## Features

### Authentication & User Management
- **Secure Registration & Login**: JWT-based authentication with refresh tokens
- **User Profiles**: Comprehensive user profiles with location and preferences
- **Role-based Access**: Different access levels for users, validators, and administrators
- **Protected Routes**: Secure route protection for authenticated users

### Incident Reporting System
- **Real-time Reporting**: Submit detailed incident reports with photos and GPS coordinates
- **Multiple Incident Types**: Support for illegal cutting, pollution, dumping, erosion, and more
- **Photo Evidence**: Upload and manage photographic evidence with EXIF metadata extraction
- **Location Mapping**: Interactive maps with geospatial incident visualization
- **Severity Classification**: Categorize incidents by severity levels (low, medium, high, critical)

### Gamification & Rewards
- **Badge System**: Earn badges for reporting, validation, and community participation
- **Points System**: Accumulate points for various conservation activities
- **Achievement Tracking**: Track progress across different conservation milestones
- **Leaderboards**: Community rankings based on contributions and achievements

### Validation & Verification
- **Admin Approval System**: Multi-level verification process for threat validation
- **AI-Assisted Validation**: Automated image analysis and anomaly detection
- **Community Validation**: Peer review system for incident verification
- **Status Tracking**: Real-time status updates for reported incidents

### Modern User Interface
- **Interactive Dashboard**: Comprehensive analytics and reporting dashboard
- **Real-time Notifications**: Instant updates on report status and community activities
- **Beautiful Landing Page**: Modern, nature-inspired design with smooth animations

## 🛠️ Technology Stack

### Backend
- **Express.js**: Node.js web framework
- **MongoDB**: Database with Mongoose for data persistence
- **JWT**: Token-based authentication with refresh tokens
- **Bcrypt**: Password hashing with 12 salt rounds
- **Multer**: File upload handling for photo evidence
- **Sharp**: Image processing and optimization
- **Google Generative AI**: AI-powered image analysis and validation
- **Express-validator**: Comprehensive input validation
- **Helmet**: Security middleware for HTTP headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting for security

### Frontend
- **React 19**: Modern UI library with hooks
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing with protected routes
- **Axios**: HTTP client with automatic token refresh interceptors
- **React Context**: Global state management for authentication
- **React Leaflet**: Interactive maps for location visualization
- **Chart.js**: Data visualization and analytics charts
- **React Toastify**: User-friendly notifications
- **Lucide React**: Modern icon library
- **React Dropzone**: Drag-and-drop file uploads

## 📁 Project Structure

```
Kandal/
├── backend/
│   ├── config/
│   │   └── database.js              # MongoDB connection configuration
│   ├── controllers/
│   │   ├── auth.controller.js       # User authentication logic
│   │   ├── report.controller.js     # Incident reporting system
│   │   └── notification.controller.js # Notification management
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT authentication middleware
│   │   └── upload.middleware.js     # File upload handling
│   ├── models/
│   │   ├── user.model.js           # User schema with roles and preferences
│   │   ├── report.model.js         # Incident report schema
│   │   ├── badge.model.js          # Gamification badge system
│   │   └── notification.model.js   # User notification schema
│   ├── routes/
│   │   ├── auth.routes.js          # Authentication endpoints
│   │   ├── report.routes.js        # Report management endpoints
│   │   └── notification.routes.js  # Notification endpoints
│   ├── utils/
│   │   └── jwt.utils.js            # JWT token utilities
│   ├── uploads/                    # Photo evidence storage
│   ├── seed-badges.js              # Badge system initialization
│   ├── seed-reports.js             # Sample report data
│   ├── .env                        # Environment variables
│   ├── package.json
│   └── server.js                   # Express server entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LandingPage.jsx      # Beautiful landing page
    │   │   ├── Login.jsx            # Authentication forms
    │   │   ├── Register.jsx         # User registration
    │   │   ├── ReportSubmission.jsx # Incident reporting form
    │   │   ├── ReportListing.jsx    # Report management interface
    │   │   ├── ReportsMap.jsx       # Interactive map visualization
    │   │   ├── Profile.jsx          # User profile management
    │   │   ├── Sidebar.jsx          # Navigation sidebar
    │   │   └── ProtectedRoute.jsx   # Route protection
    │   ├── contexts/
    │   │   └── AuthContext.jsx      # Global authentication state
    │   ├── styles/
    │   │   ├── LandingPage.css      # Landing page styling
    │   │   ├── Home.css             # Dashboard styling
    │   │   ├── Profile.css          # Profile page styling
    │   │   └── ReportSubmission.css # Report form styling
    │   ├── utils/
    │   │   └── axios.js             # HTTP client with interceptors
    │   ├── test/                    # Component testing files
    │   ├── App.jsx                  # Main application component
    │   └── main.jsx                 # React application entry point
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

1. **Install MongoDB**: Ensure MongoDB is running locally on port 27017
2. **Database Initialization**: The application will automatically create the `mangrove_guardian` database
3. **Seed Data**: Run the following commands to populate initial data:
   ```bash
   cd backend
   node seed-badges.js    # Initialize badge system
   node seed-reports.js   # Add sample reports (optional)
   ```
4. **Indexes**: Geospatial and compound indexes are created automatically
5. **Cloud Setup**: For production, update `MONGODB_URI` to point to MongoDB Atlas or your cloud instance

## 🔌 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration with profile setup
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/logout-all` - Logout from all devices
- `GET /api/auth/profile` - Get user profile with statistics
- `PUT /api/auth/profile` - Update user profile and preferences
- `PUT /api/auth/change-password` - Change user password
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/health` - API health check

### Report Management Routes
- `POST /api/reports` - Submit new incident report with photos
- `GET /api/reports` - Get paginated list of reports with filters
- `GET /api/reports/:id` - Get detailed report information
- `PUT /api/reports/:id` - Update report status (admin/validator only)
- `DELETE /api/reports/:id` - Delete report (admin only)
- `POST /api/reports/:id/comments` - Add comment to report
- `POST /api/reports/:id/upvote` - Upvote/downvote report
- `GET /api/reports/nearby` - Get reports near specific coordinates
- `GET /api/reports/stats` - Get reporting statistics and analytics

### Notification Routes
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Badge & Gamification Routes
- `GET /api/badges` - Get available badges
- `GET /api/badges/user/:userId` - Get user's earned badges
- `POST /api/badges/check` - Check and award eligible badges

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
4. **Access the reports page** at http://localhost:5173/reports
5. **Manage profile** and change password from the profile section

## ✅ Features Implemented

### Authentication & Security
- ✅ Secure user registration and login system
- ✅ JWT access and refresh token mechanism
- ✅ Automatic token refresh with interceptors
- ✅ Role-based access control (User, Validator, Admin)
- ✅ Protected route system with authentication guards
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Input validation and sanitization
- ✅ Rate limiting and security headers

### Incident Reporting System
- ✅ Comprehensive incident reporting form
- ✅ Photo upload with EXIF metadata extraction
- ✅ GPS coordinate capture and validation
- ✅ Multiple incident type categorization
- ✅ Severity level classification
- ✅ Real-time status tracking
- ✅ Comment and discussion system
- ✅ Upvoting and community engagement

### Gamification & Rewards
- ✅ Badge system with multiple categories
- ✅ Points accumulation for activities
- ✅ Achievement tracking and milestones
- ✅ User statistics and progress monitoring
- ✅ Notification system for achievements

### User Interface & Experience
- ✅ Modern landing page
- ✅ Interactive dashboard with analytics
- ✅ Real-time notifications
- ✅ Interactive maps with Leaflet integration
- ✅ Beautiful nature-inspired UI theme
- ✅ Smooth animations and transitions

### Data Management & Analytics
- ✅ MongoDB with geospatial indexing
- ✅ Report analytics and statistics
- ✅ User activity tracking
- ✅ Data visualization with charts
- ✅ Export and reporting capabilities

## 💻 Development Guidelines

### Code Standards
- **File Naming**: Follow `feature.type.js` convention for consistency
- **Component Structure**: Use functional components with React hooks
- **State Management**: Global state managed through React Context API
- **API Integration**: Axios interceptors handle authentication and token refresh
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **Testing**: Unit tests with Vitest and React Testing Library

### Database Design
- **Geospatial Indexing**: MongoDB 2dsphere indexes for location-based queries
- **Schema Validation**: Mongoose schemas with comprehensive validation rules
- **Data Relationships**: Proper referencing between users, reports, and badges
- **Performance Optimization**: Compound indexes for common query patterns

### Security Measures
- **Input Sanitization**: All user inputs validated and sanitized
- **File Upload Security**: Image validation and metadata extraction
- **Rate Limiting**: API endpoint protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Sensitive data stored securely

## 🚀 Upcoming Features

### 🔐 Admin Approval System for Threat Verification
- **Multi-level Validation Process**: Implement a comprehensive admin approval workflow where reported threats undergo systematic verification
- **Expert Review Panel**: Create a system for environmental experts and local authorities to validate incident authenticity
- **Evidence Assessment**: Advanced photo analysis and cross-referencing with satellite imagery for threat verification
- **Escalation Protocols**: Automatic escalation of high-severity threats to relevant authorities
- **Audit Trail**: Complete tracking of validation decisions and reviewer actions
- **Community Consensus**: Implement community voting mechanisms for peer validation of incidents

### 🎮 Enhanced Gamification System
- **Dynamic Badge Categories**: Expand badge system with specialized categories:
  - 🏆 **Conservation Hero**: For exceptional environmental protection efforts
  - 🔍 **Eagle Eye**: For accurate threat detection and reporting
  - 🤝 **Community Leader**: For organizing local conservation initiatives
  - 📊 **Data Guardian**: For consistent and detailed reporting
  - 🌱 **Restoration Champion**: For participating in ecosystem restoration
  - ⚡ **Rapid Responder**: For quick incident reporting and response
- **Points-Based Progression**: Comprehensive point system with activities like:
  - Report submission: 10-50 points (based on severity and accuracy)
  - Photo evidence: 5-15 points per photo
  - Community validation: 20 points
  - Comment engagement: 2-5 points
  - Consecutive daily activity: Bonus multipliers
- **Achievement Milestones**: Progressive achievements (Bronze → Silver → Gold → Platinum → Diamond)
- **Seasonal Challenges**: Time-limited conservation challenges with special rewards
- **Leaderboard System**: Monthly and yearly rankings with recognition ceremonies
- **Reward Redemption**: Convert points to real-world benefits like eco-friendly products or conservation workshop access

### 🌐 Hindi Language Integration
- **Complete Localization**: Full Hindi translation of the entire platform including:
  - User interface elements and navigation
  - Form labels, buttons, and error messages
  - Incident type classifications and descriptions
  - Badge names and achievement descriptions
  - Email notifications and system messages
- **Regional Content**: Location-specific content in Hindi for Indian mangrove regions
- **Regional Incident Types**: Add India-specific threat categories and conservation challenges
- **Bilingual Support**: Seamless language switching between English and Hindi

### 🔧 Technical Enhancements
- **Real-time Collaboration**: Live updates and collaborative incident tracking
- **Advanced Analytics**: Machine learning insights for threat pattern recognition
- **Mobile App Development**: Native iOS and Android applications