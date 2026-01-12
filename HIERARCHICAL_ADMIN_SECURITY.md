# Hierarchical Admin Security Model

## 🏗️ **Refined Security Architecture: Hierarchical Role Management**

Following enterprise security best practices, the system now implements a proper hierarchical security model where each role has specific capabilities and limitations based on organizational hierarchy.

## 🎯 **Role Hierarchy & Capabilities**

### **Super Administrator (super_admin)**
- **Account Creation**: Can create accounts with any role (staff, admin, super_admin)
- **User Approval**: Can approve all pending user requests
- **User Management**: Can edit and delete all non-super admin accounts
- **Visibility**: Can see all users including other super admins
- **Special Privileges**: Only role that can manage admin and super admin accounts

### **Administrator (admin)**
- **Account Creation**: Can create staff accounts only
- **User Approval**: Can approve staff requests only
- **User Management**: Can edit staff profiles and their own profile
- **User Deletion**: Can delete staff accounts only (not their own)
- **Visibility**: Can see admin and staff users (super admins are hidden)
- **Limitations**: Cannot create, approve, or manage admin/super admin accounts

### **Staff Member (staff)**
- **Account Creation**: None
- **User Approval**: None
- **User Management**: None
- **Visibility**: No access to admin panel
- **Limitations**: No administrative privileges

## 🛡️ **Security Implementation**

### **1. Account Creation Security**

#### **Frontend Controls**
```typescript
// Role-based tab visibility
{[
  { id: 'users', label: 'User Management' },
  ...(userRole === 'admin' || userRole === 'super_admin' ? [{ id: 'create', label: 'Create User' }] : [])
].map((tab) => (...))}

// Role-specific form options
<select value={createUserData.role}>
  <option value="staff">Staff Member</option>
  {userRole === 'super_admin' && (
    <>
      <option value="admin">Administrator</option>
      <option value="super_admin">Super Administrator</option>
    </>
  )}
</select>
```

#### **Backend Validation**
```typescript
async createUser(email: string, password: string, name: string, role: UserRole, createdBy: string) {
  const creatorProfile = await this.getUserProfile(createdBy);
  
  // Admins can create staff, Super admins can create all roles
  if (creatorProfile.role !== 'admin' && creatorProfile.role !== 'super_admin') {
    throw new Error('Only administrators and super administrators can create user accounts');
  }

  // Regular admins can only create staff accounts
  if (creatorProfile.role === 'admin' && role !== 'staff') {
    throw new Error('Administrators can only create staff accounts');
  }
}
```

### **2. User Approval Security**

#### **Hierarchical Approval Rules**
- **Super Admins**: Can approve all pending requests (staff, admin, super_admin)
- **Admins**: Can approve staff requests only
- **Staff**: Cannot approve any requests

#### **UI Security**
```typescript
const canApprove = userRole === 'super_admin' || (userRole === 'admin' && user.role === 'staff');

<Button
  size="sm"
  onClick={() => handleApproveUser(user.id)}
  disabled={!canApprove}
  title={!canApprove ? 'Only super admins can approve admin/super admin requests' : ''}
>
  Approve
</Button>
```

### **3. User Management Security**

#### **Edit Permissions**
- **Super Admins**: Can edit all non-super admin accounts
- **Admins**: Can edit staff profiles and their own profile only
- **Staff**: No edit permissions

#### **Delete Permissions**
- **Super Admins**: Can delete admin and staff accounts
- **Admins**: Can delete staff accounts only (not their own)
- **Staff**: No delete permissions

#### **Implementation**
```typescript
const canEdit = userRole === 'super_admin' || 
               (userRole === 'admin' && (user.role === 'staff' || user.uid === currentUserUid));

const canDelete = userRole === 'super_admin' || 
                 (userRole === 'admin' && user.role === 'staff' && user.uid !== currentUserUid);
```

## 🎨 **User Experience by Role**

### **Super Administrator Experience**
- ✅ **Full Access**: Complete control over all user management functions
- ✅ **Create Any Role**: Can create staff, admin, and super admin accounts
- ✅ **Approve All**: Can approve all pending user requests
- ✅ **Manage All**: Can edit and delete all non-super admin accounts
- ✅ **See All**: Can view all users including other super admins
- ⚠️ **Special Warnings**: Gets alerts when creating super admin accounts

### **Administrator Experience**
- ✅ **Staff Management**: Can create, approve, edit, and delete staff accounts
- ✅ **Self Management**: Can edit their own profile
- ✅ **Partial Visibility**: Can see admin and staff users (super admins hidden)
- ❌ **Admin Restrictions**: Cannot create, approve, or manage admin accounts
- ❌ **Super Admin Restrictions**: Cannot see or interact with super admin accounts
- ℹ️ **Clear Guidance**: UI shows what requires super admin privileges

### **Staff Experience**
- ❌ **No Admin Access**: Cannot access admin panel
- ❌ **No User Management**: Cannot see or manage other users
- ✅ **Request Access**: Can request account creation through Google Sign-In or registration

## 🔍 **Security Features**

### **Progressive Disclosure**
- **Role-Based UI**: Only shows features available to current user's role
- **Contextual Messaging**: Clear explanations of privilege requirements
- **Visual Indicators**: Badges and tooltips show permission levels
- **Disabled States**: Buttons show why actions aren't available

### **Defense in Depth**
- **Frontend Validation**: UI prevents unauthorized actions
- **Component Validation**: Event handlers validate permissions
- **Backend Validation**: Service methods enforce security rules
- **Database Rules**: Firestore rules provide final security layer

### **Audit & Transparency**
- **Action Logging**: All user management actions are logged with role context
- **Clear Attribution**: Who performed what action with what privileges
- **Permission Tracking**: Changes to user permissions are fully audited
- **Role Visibility**: Users understand their current privilege level

## 📊 **Permission Matrix**

| Action | Super Admin | Admin | Staff |
|--------|-------------|-------|-------|
| **Create Staff** | ✅ | ✅ | ❌ |
| **Create Admin** | ✅ | ❌ | ❌ |
| **Create Super Admin** | ✅ | ❌ | ❌ |
| **Approve Staff** | ✅ | ✅ | ❌ |
| **Approve Admin** | ✅ | ❌ | ❌ |
| **Approve Super Admin** | ✅ | ❌ | ❌ |
| **Edit Staff Profile** | ✅ | ✅ | ❌ |
| **Edit Admin Profile** | ✅ | ❌ | ❌ |
| **Edit Own Profile** | ✅ | ✅ | ❌ |
| **Delete Staff** | ✅ | ✅* | ❌ |
| **Delete Admin** | ✅ | ❌ | ❌ |
| **View Staff** | ✅ | ✅ | ❌ |
| **View Admin** | ✅ | ✅ | ❌ |
| **View Super Admin** | ✅ | ❌ | ❌ |

*Admin cannot delete their own account

## 🚨 **Security Benefits**

### **Proper Delegation**
- **Distributed Management**: Admins can handle day-to-day staff management
- **Reduced Bottlenecks**: Super admins don't need to approve every staff request
- **Clear Boundaries**: Each role knows exactly what they can and cannot do
- **Scalable Structure**: Works for organizations of any size

### **Risk Mitigation**
- **Privilege Separation**: No single role has unnecessary permissions
- **Lateral Movement Prevention**: Compromised admin cannot escalate to super admin
- **Audit Trail**: Complete visibility into who did what
- **Self-Service**: Users can manage appropriate accounts without escalation

### **Operational Efficiency**
- **Faster Approvals**: Staff requests can be handled by any admin
- **Clear Workflows**: Users know who to contact for different needs
- **Reduced Errors**: UI prevents accidental privilege assignments
- **Better UX**: Role-appropriate interfaces reduce confusion

## 🧪 **Testing Scenarios**

### **Test Case 1: Admin Staff Management**
1. Login as admin
2. Verify can create staff accounts
3. Verify cannot create admin accounts
4. Approve staff user requests
5. Verify cannot approve admin requests
6. Edit staff profiles and own profile
7. Verify cannot edit admin profiles

### **Test Case 2: Super Admin Full Control**
1. Login as super admin
2. Create accounts with all roles
3. Approve all types of pending requests
4. Edit all non-super admin profiles
5. Delete admin and staff accounts
6. Verify all operations succeed

### **Test Case 3: Security Boundaries**
1. Login as admin
2. Attempt to create admin account (should fail)
3. Attempt to approve admin request (should fail)
4. Attempt to edit admin profile (should fail)
5. Verify appropriate error messages

## 📈 **Implementation Status**

- ✅ **Hierarchical Creation**: Admins can create staff, super admins can create all
- ✅ **Hierarchical Approval**: Admins can approve staff, super admins can approve all
- ✅ **Hierarchical Management**: Role-based edit and delete permissions
- ✅ **UI Security**: Progressive disclosure based on user role
- ✅ **Backend Security**: Service-level validation for all operations
- ✅ **Visual Feedback**: Clear indicators of permission levels
- ✅ **Error Handling**: Informative messages for security restrictions

## 🔧 **Configuration**

### **Role Hierarchy**
```
Super Admin (super_admin)
├── Can manage: all users
├── Can create: staff, admin, super_admin
├── Can approve: all requests
├── Can edit: all non-super admin profiles
└── Can delete: admin and staff accounts

Administrator (admin)
├── Can manage: staff users only
├── Can create: staff accounts only
├── Can approve: staff requests only
├── Can edit: staff profiles + own profile
└── Can delete: staff accounts only (not own)

Staff (staff)
├── Can manage: none
├── Can create: none
├── Can approve: none
├── Can edit: none
└── Can delete: none
```

### **Security Validation Points**
1. **UI Level**: Tab visibility and form options
2. **Component Level**: Event handler permission checks
3. **Service Level**: Backend method validation
4. **Database Level**: Firestore security rules

This hierarchical security model provides proper delegation of authority while maintaining strict security boundaries, enabling efficient user management at scale while preventing privilege escalation and unauthorized access.