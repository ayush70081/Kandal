# Admin Dashboard Design Document

## Overview

The Admin Dashboard is a comprehensive administrative interface for the Mangrove application that enables administrators to manage user reports, assign badges, visualize data on maps, and perform analytics. The system will be built as a separate admin interface with dedicated authentication, leveraging the existing backend infrastructure while adding new admin-specific endpoints and functionality.

## Architecture

### High-Level Architecture


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Client  │    │   Backend API   │    │    Database     │
│   (React SPA)   │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Admin Routes    │    │ Admin Controllers│    │ Existing Models │
│ Admin Components│    │ Admin Middleware │    │ + Badge Model   │
│ Admin Context   │    │ Admin Services   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘


### Authentication Flow

1. *Admin Login*: Separate admin login endpoint with hardcoded credentials
2. *Admin JWT*: Special admin JWT tokens with admin role claims
3. *Admin Middleware*: Dedicated middleware to verify admin privileges
4. *Session Management*: Admin session handling separate from regular users

## Components and Interfaces

### Frontend Components

#### 1. Admin Authentication
- *AdminLogin.jsx*: Dedicated admin login form
- *AdminProtectedRoute.jsx*: Route protection for admin pages
- *AdminAuthContext.jsx*: Admin authentication state management

#### 2. Admin Layout
- *AdminLayout.jsx*: Main admin dashboard layout with navigation
- *AdminSidebar.jsx*: Navigation sidebar with admin menu items
- *AdminHeader.jsx*: Top header with admin user info and logout

#### 3. Report Management
- *ReportManagement.jsx*: Main reports management interface
- *ReportList.jsx*: Paginated list of all reports with filters
- *ReportDetails.jsx*: Detailed view of individual reports
- *ReportActions.jsx*: Approve/reject action buttons and modals

#### 4. User & Badge Management
- *UserManagement.jsx*: User listing and management interface
- *UserProfile.jsx*: Individual user profile with badge assignment
- *BadgeAssignment.jsx*: Badge selection and assignment interface
- *BadgeManagement.jsx*: Badge creation and management

#### 5. Map Visualization
- *AdminMap.jsx*: Interactive Leaflet map component
- *MapControls.jsx*: Map filtering and control interface
- *ReportMarker.jsx*: Custom markers for report locations
- *MapPopup.jsx*: Report details popup on marker click

#### 6. Analytics Dashboard
- *AnalyticsDashboard.jsx*: Main analytics overview
- *ReportAnalytics.jsx*: Report-specific charts and metrics
- *UserAnalytics.jsx*: User engagement and activity metrics
- *GeographicAnalytics.jsx*: Location-based analysis
- *SystemMetrics.jsx*: Platform health and performance metrics

### Backend Components

#### 1. Admin Authentication
- *Admin Middleware*: admin.middleware.js - Verify admin privileges
- *Admin Controller*: admin.controller.js - Admin authentication logic
- *Admin Routes*: admin.routes.js - Admin-specific endpoints

#### 2. Report Management API
- *GET /api/admin/reports*: Paginated reports with filtering
- *PUT /api/admin/reports/:id/approve*: Approve a report
- *PUT /api/admin/reports/:id/reject*: Reject a report
- *GET /api/admin/reports/:id*: Get detailed report information

#### 3. User & Badge Management API
- *GET /api/admin/users*: Get all users with pagination
- *GET /api/admin/users/:id*: Get user details with badges
- *POST /api/admin/users/:id/badges*: Assign badge to user
- *GET /api/admin/badges*: Get all available badges
- *POST /api/admin/badges*: Create new badge

#### 4. Analytics API
- *GET /api/admin/analytics/overview*: General platform metrics
- *GET /api/admin/analytics/reports*: Report-specific analytics
- *GET /api/admin/analytics/users*: User engagement metrics
- *GET /api/admin/analytics/geographic*: Location-based analysis

## Data Models

### Badge Model (New)
javascript
const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String, // Icon name or URL
    required: true
  },
  color: {
    type: String,
    default: '#4CAF50'
  },
  criteria: {
    type: String, // Description of how to earn this badge
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});


### Admin Activity Log Model (New)
javascript
const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: String, // Admin identifier
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['report_approved', 'report_rejected', 'badge_assigned', 'user_updated']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['report', 'user', 'badge']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed // Additional action details
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});


### Extended Report Model
The existing Report model will be extended with admin-specific fields:
javascript
// Add to existing report schema
adminNotes: {
  type: String // Admin notes when approving/rejecting
},
reviewedBy: {
  type: String // Admin identifier who reviewed
},
reviewedAt: {
  type: Date // When the review was completed
}


## Error Handling

### Admin Authentication Errors
- *401 Unauthorized*: Invalid admin credentials
- *403 Forbidden*: Non-admin user attempting admin access
- *Token Expired*: Admin session timeout handling

### Report Management Errors
- *404 Not Found*: Report not found for approval/rejection
- *409 Conflict*: Report already processed
- *400 Bad Request*: Invalid report status transition

### Badge Assignment Errors
- *404 Not Found*: User or badge not found
- *409 Conflict*: Badge already assigned to user
- *400 Bad Request*: Invalid badge assignment data

### Map and Analytics Errors
- *500 Internal Server Error*: Database aggregation failures
- *400 Bad Request*: Invalid query parameters for filtering
- *503 Service Unavailable*: External map service issues

## Testing Strategy

### Unit Tests
- *Admin Authentication*: Test admin login, token validation, middleware
- *Report Management*: Test approve/reject functionality, status updates
- *Badge System*: Test badge assignment, validation, and retrieval
- *Analytics*: Test data aggregation and metric calculations

### Integration Tests
- *Admin API Endpoints*: Test all admin routes with proper authentication
- *Database Operations*: Test admin operations on reports and users
- *Notification System*: Test admin action notifications to users

### Frontend Tests
- *Component Testing*: Test admin components with React Testing Library
- *User Interaction*: Test admin workflows (approve reports, assign badges)
- *Map Integration*: Test Leaflet map functionality and interactions
- *Analytics Visualization*: Test chart rendering and data display

### End-to-End Tests
- *Admin Login Flow*: Complete admin authentication process
- *Report Review Workflow*: Full report approval/rejection process
- *Badge Assignment Flow*: Complete badge assignment workflow
- *Map Visualization*: Test map loading and interaction features

## Security Considerations

### Admin Access Control
- *Hardcoded Credentials*: Secure storage of admin credentials
- *Admin Role Verification*: Middleware to verify admin privileges
- *Session Management*: Secure admin session handling
- *Audit Logging*: Log all admin actions for accountability

### Data Protection
- *Input Validation*: Validate all admin inputs and actions
- *SQL Injection Prevention*: Use parameterized queries
- *XSS Protection*: Sanitize admin interface inputs
- *CSRF Protection*: Implement CSRF tokens for admin actions

### API Security
- *Rate Limiting*: Implement rate limiting for admin endpoints
- *Request Validation*: Validate all admin API requests
- *Error Handling*: Secure error messages without data leakage
- *Logging*: Comprehensive logging of admin activities

## Performance Considerations

### Database Optimization
- *Indexing*: Optimize queries for report filtering and analytics
- *Aggregation*: Efficient data aggregation for analytics
- *Pagination*: Implement efficient pagination for large datasets
- *Caching*: Cache frequently accessed admin data

### Frontend Performance
- *Code Splitting*: Lazy load admin components
- *Map Optimization*: Efficient marker clustering for large datasets
- *Chart Performance*: Optimize chart rendering for large datasets
- *State Management*: Efficient admin state management

### API Performance
- *Query Optimization*: Optimize database queries for admin operations
- *Response Caching*: Cache analytics data where appropriate
- *Batch Operations*: Support batch operations for efficiency
- *Connection Pooling*: Optimize database connections

## Implementation Phases

### Phase 1: Core Admin Infrastructure
- Admin authentication system
- Basic admin layout and navigation
- Admin middleware and route protection

### Phase 2: Report Management
- Report listing and filtering
- Report approval/rejection functionality
- Admin activity logging

### Phase 3: Badge System
- Badge model and management
- Badge assignment interface
- User badge display

### Phase 4: Map Visualization
- Leaflet map integration
- Report marker display
- Map filtering and controls

### Phase 5: Analytics Dashboard
- Basic analytics and metrics
- Chart integration
- Geographic analysis

### Phase 6: Advanced Features
- Advanced filtering and search
- Bulk operations
- Export functionality
- Performance optimizations