# Hierarchical Admin Security Implementation

## Overview

This document outlines the comprehensive hierarchical security system implemented in the Office OFM application. The system ensures proper role-based access control with multiple layers of security protection.

## Security Architecture

### Role Hierarchy
```
Super Admin (Highest Authority)
    ├── Can see and manage ALL users including other super admins
    ├── Can create ANY role (staff, admin, super admin)
    ├── Can approve ANY pending requests
    └── Can edit ANY user profiles (except super admin roles are immutable)

Admin (Middle Authority)
    ├── CANNOT see super admin accounts (hidden for security)
    ├── Can see and manage staff + other admins
    ├── Can create ONLY staff accounts
    ├── Can approve ONLY staff requests
    └── Can edit staff profiles and their own profile

Staff (Lowest Authority)
    ├── Must belong to exactly ONE administrator
    ├── Requests are directed to specific administrators
    ├── Cannot create or manage other accounts
    └── Limited to basic application functionality
```

## Key Security Features Implemented

### 1. Super Admin Invisibility to Regular Admins
- **Implementation**: `getVisibleUsers()` function filters out super admin accounts when requested by non-super admin users
- **Security Benefit**: Prevents regular admins from knowing super admin identities
- **Code Location**: `src/lib/auth.ts` lines 521-531

### 2. Role Creation Restrictions
- **Super Admins**: Can create any role including other super admins
- **Admins**: Can ONLY create staff accounts
- **Staff**: Cannot create any accounts
- **Implementation**: `createUser()` function with role validation
- **Code Location**: `src/lib/auth.ts` lines 417-480

### 3. Staff-Admin Assignment System
- **Each staff member belongs to exactly one administrator**
- **Staff requests include `requestedAdminId` field**
- **Visual indicators show staff-admin relationships**
- **Implementation**: Database schema with `assignedAdminId` field
- **Code Location**: `src/lib/types.ts`, `src/app/components/GoogleRoleSelectionModal.tsx`

### 4. Approval Authority Restrictions
- **Super Admins**: Can approve any pending request
- **Admins**: Can ONLY approve staff requests assigned to them
- **Implementation**: `approveUser()` and `approveGoogleUser()` functions
- **Code Location**: `src/lib/auth.ts` lines 180-280

### 5. Super Admin Role Immutability
- **Super admin roles cannot be modified for security**
- **Prevents accidental or malicious role changes**
- **System prevents removal of last super admin**
- **Implementation**: `updateUserRole()` function with protection
- **Code Location**: `src/lib/auth.ts` lines 300-340

## Visual Indicators and User Experience

### Admin Panel Features
1. **Color-coded staff assignments**:
   - Green: Staff assigned to current admin
   - Yellow: Unassigned staff
   - Blue: Admin requests directed to current admin

2. **Badge system**:
   - "👥 Your Staff" for assigned staff members
   - "📩 For You" for requests directed to current admin
   - "🎯 Wants to work under: [Admin Name]" for staff requests

3. **Staff assignment overview** (Super Admin only):
   - Grid view of all administrators and their assigned staff
   - Unassigned staff summary with warning indicators

### Google Sign-In Role Selection
1. **Admin picker for staff requests**:
   - Dropdown showing available administrators
   - Clear indication of which admin the staff will be assigned to
   - Fallback handling when no admins are available

2. **Role-specific descriptions**:
   - Staff: "Will be assigned to a specific administrator"
   - Admin: "Requires additional approval"

## Database Schema

### User Profile Structure
```typescript
interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  lastLogin: Date;
  approvedBy?: string;
  approvedAt?: Date;
  assignedAdminId?: string; // For staff members only
}
```

### Pending User Structure
```typescript
interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  authProvider: 'email' | 'google';
  requestedAdminId?: string; // For staff requests
}
```

## Security Validation Points

### 1. Frontend Validation
- UI elements disabled/hidden based on user role
- Visual feedback for insufficient privileges
- Role-specific form options and descriptions

### 2. Backend Validation
- Every sensitive operation validates user permissions
- Database queries filtered by user role
- Multiple validation layers for critical operations

### 3. Database Security
- Firestore security rules (separate file)
- Role-based data access restrictions
- Audit logging for sensitive operations

## Implementation Files

### Core Authentication
- `src/lib/auth.ts` - Main authentication service with all security functions
- `src/lib/types.ts` - TypeScript interfaces and type definitions

### UI Components
- `src/app/components/RealAdminPanel.tsx` - Admin panel with hierarchical controls
- `src/app/components/GoogleRoleSelectionModal.tsx` - Role selection with admin assignment
- `src/app/components/EditUserRoleModal.tsx` - Role editing with security restrictions

### Context and State Management
- `src/app/contexts/AuthContext.tsx` - Authentication state management

## Security Best Practices Followed

1. **Defense in Depth**: Multiple validation layers (UI, service, database)
2. **Principle of Least Privilege**: Users can only access what they need
3. **Role Immutability**: Critical roles cannot be accidentally modified
4. **Audit Trail**: All sensitive operations are logged
5. **Clear Visual Feedback**: Users understand their permissions and restrictions
6. **Graceful Degradation**: System handles edge cases and errors properly

## Testing and Validation

### Manual Testing Scenarios
1. **Admin Visibility**: Verify admins cannot see super admin accounts
2. **Role Creation**: Test that admins can only create staff accounts
3. **Staff Assignment**: Verify staff requests are properly assigned to admins
4. **Permission Boundaries**: Test all role-based restrictions
5. **Error Handling**: Verify proper error messages for unauthorized actions

### Security Considerations
- Regular security audits of role assignments
- Monitoring of super admin account creation
- Review of staff-admin assignments for proper distribution
- Validation of approval workflows

## Future Enhancements

1. **Department-based assignments**: Extend staff assignment to departments
2. **Delegation system**: Allow admins to delegate approval authority
3. **Audit dashboard**: Visual interface for security audit logs
4. **Automated alerts**: Notifications for security-relevant events
5. **Role templates**: Predefined role configurations for common scenarios

---

This hierarchical security system ensures that the Office OFM application maintains proper access control while providing a smooth user experience for all role levels.