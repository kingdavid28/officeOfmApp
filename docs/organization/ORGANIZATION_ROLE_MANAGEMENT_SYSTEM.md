# Organization Role Management System

## Overview
Comprehensive hierarchical role-based access control (RBAC) system that allows each organization (friary, parish, school, formation house, retreat center) to have its own admin, vice admin, and staff members with specific permissions.

## Architecture

### Hierarchical Structure
```
Organization
├── Admin (1 person)
│   └── Full control over organization
├── Vice Admin (1 person)
│   └── Almost full control (some restrictions)
└── Staff (Multiple people)
    └── Operational access (limited permissions)
```

### Key Features
1. **One Admin Per Organization**: Each organization can have exactly one administrator
2. **One Vice Admin Per Organization**: Each organization can have exactly one vice administrator
3. **Multiple Staff**: Unlimited staff members per organization
4. **Granular Permissions**: 19 different permissions across 5 categories
5. **User Multi-Membership**: Users can be members of multiple organizations with different roles
6. **Permission Inheritance**: Roles come with predefined permission sets
7. **Custom Permissions**: Permissions can be customized per user if needed

## Roles & Permissions

### Organization Roles

#### 1. Organization Administrator (`org_admin`)
**Full Control** - Can do everything in the organization

**Permissions:**
- ✅ Create, edit, delete documents
- ✅ Create and approve expenses
- ✅ View and manage budget
- ✅ Add, remove, and edit member roles
- ✅ Edit and delete organization
- ✅ Manage all settings
- ✅ Send messages and manage chats

**Use Cases:**
- Guardian of a Friary
- Principal of a School
- Director of a Retreat Center
- Pastor of a Parish

#### 2. Vice Administrator (`org_vice_admin`)
**Almost Full Control** - Can do most things except critical operations

**Permissions:**
- ✅ Create, edit, delete documents
- ✅ Create and approve expenses
- ✅ View financials
- ❌ Cannot manage budget
- ✅ Add members
- ❌ Cannot remove members
- ❌ Cannot edit member roles
- ✅ Edit organization
- ❌ Cannot delete organization
- ✅ Manage settings
- ✅ Send messages and manage chats

**Use Cases:**
- Vice Guardian
- Vice Principal
- Assistant Director
- Associate Pastor

#### 3. Staff Member (`org_staff`)
**Operational Access** - Can perform day-to-day operations

**Permissions:**
- ✅ Create and edit documents
- ❌ Cannot delete documents
- ✅ Create expenses
- ❌ Cannot approve expenses
- ✅ View financials
- ❌ Cannot manage budget
- ❌ Cannot manage members
- ❌ Cannot edit organization
- ❌ Cannot manage settings
- ✅ Send messages
- ❌ Cannot manage chats

**Use Cases:**
- Friars/Brothers
- Teachers
- Staff members
- Volunteers

#### 4. Viewer (`org_viewer`)
**Read-Only Access** - Can only view information

**Permissions:**
- ❌ Cannot create/edit/delete documents
- ✅ View documents
- ❌ Cannot create/approve expenses
- ✅ View financials
- ❌ Cannot manage anything
- ✅ Send messages

**Use Cases:**
- External auditors
- Observers
- Guests

### Permission Categories

#### 1. Content Management
- `canCreateDocuments`: Create new documents
- `canEditDocuments`: Edit existing documents
- `canDeleteDocuments`: Delete documents
- `canViewDocuments`: View documents

#### 2. Financial Management
- `canCreateExpenses`: Create expense entries
- `canApproveExpenses`: Approve expense requests
- `canViewFinancials`: View financial reports
- `canManageBudget`: Manage budget allocations

#### 3. Member Management
- `canAddMembers`: Add new members to organization
- `canRemoveMembers`: Remove members from organization
- `canEditMemberRoles`: Change member roles
- `canViewMembers`: View member list

#### 4. Organization Settings
- `canEditOrganization`: Edit organization details
- `canDeleteOrganization`: Delete the organization
- `canManageSettings`: Manage organization settings

#### 5. Messaging
- `canSendMessages`: Send messages in organization chats
- `canCreateGroupChats`: Create new group chats
- `canManageChats`: Manage chat settings

## Data Structure

### Firestore Collections

#### 1. `organizations/{organizationId}/members/{userId}`
```typescript
{
  userId: string;
  userName: string;
  userEmail: string;
  role: 'org_admin' | 'org_vice_admin' | 'org_staff' | 'org_viewer';
  assignedAt: Date;
  assignedBy: string;
  permissions: {
    canCreateDocuments: boolean;
    canEditDocuments: boolean;
    // ... all 19 permissions
  };
  isActive: boolean;
}
```

#### 2. `userOrganizationMemberships/{userId}`
```typescript
{
  userId: string;
  organizations: [
    {
      organizationId: string;
      organizationName: string;
      organizationType: string;
      role: OrganizationRole;
      permissions: OrganizationPermissions;
    }
  ];
}
```

## API Functions

### Role Assignment

#### `assignUserToOrganization()`
Assign a user to an organization with a specific role.

```typescript
await assignUserToOrganization(
  organizationId: string,
  organizationName: string,
  organizationType: string,
  userId: string,
  userName: string,
  userEmail: string,
  role: OrganizationRole,
  assignedBy: string,
  customPermissions?: Partial<OrganizationPermissions>
);
```

**Validations:**
- Only one admin per organization
- Only one vice admin per organization
- User cannot be assigned twice to same organization

#### `removeUserFromOrganization()`
Remove a user from an organization.

```typescript
await removeUserFromOrganization(
  organizationId: string,
  userId: string,
  removedBy: string
);
```

**Validations:**
- Cannot remove the last admin
- User must exist in organization

#### `updateUserRole()`
Change a user's role in an organization.

```typescript
await updateUserRole(
  organizationId: string,
  userId: string,
  newRole: OrganizationRole,
  updatedBy: string,
  customPermissions?: Partial<OrganizationPermissions>
);
```

**Validations:**
- Same constraints as assignment
- Updates permissions automatically

### Query Functions

#### `getOrganizationMembers()`
Get all members of an organization.

```typescript
const members = await getOrganizationMembers(organizationId);
```

#### `getOrganizationAdmin()`
Get the admin of an organization.

```typescript
const admin = await getOrganizationAdmin(organizationId);
```

#### `getOrganizationViceAdmin()`
Get the vice admin of an organization.

```typescript
const viceAdmin = await getOrganizationViceAdmin(organizationId);
```

#### `getOrganizationStaff()`
Get all staff members of an organization.

```typescript
const staff = await getOrganizationStaff(organizationId);
```

#### `getUserOrganizationRole()`
Get a user's role in a specific organization.

```typescript
const member = await getUserOrganizationRole(organizationId, userId);
```

#### `getUserOrganizations()`
Get all organizations where a user is a member.

```typescript
const memberships = await getUserOrganizations(userId);
```

### Permission Checks

#### `hasOrganizationPermission()`
Check if a user has a specific permission.

```typescript
const canEdit = await hasOrganizationPermission(
  organizationId,
  userId,
  'canEditDocuments'
);
```

#### `isOrganizationAdmin()`
Check if user is the organization admin.

```typescript
const isAdmin = await isOrganizationAdmin(organizationId, userId);
```

#### `canManageOrganization()`
Check if user can manage the organization (admin or vice admin).

```typescript
const canManage = await canManageOrganization(organizationId, userId);
```

## UI Component

### OrganizationRoleManager

React component for managing organization roles.

```typescript
<OrganizationRoleManager
  organizationId="friary_123"
  organizationName="St. Francis Friary"
  organizationType="friary"
/>
```

**Features:**
- View admin, vice admin, and staff
- Add new members with role selection
- Remove members
- Change member roles
- Search and filter users
- Permission-based UI (only admins/vice admins can manage)

## Usage Examples

### Example 1: Assign Guardian to Friary
```typescript
// Assign Fr. John as Guardian (Admin) of St. Francis Friary
await assignUserToOrganization(
  'friary_stfrancis',
  'St. Francis Friary',
  'friary',
  'user_john',
  'Fr. John Doe',
  'john@example.com',
  'org_admin',
  'super_admin_id'
);
```

### Example 2: Assign Vice Guardian
```typescript
// Assign Fr. Peter as Vice Guardian
await assignUserToOrganization(
  'friary_stfrancis',
  'St. Francis Friary',
  'friary',
  'user_peter',
  'Fr. Peter Smith',
  'peter@example.com',
  'org_vice_admin',
  'user_john' // Assigned by Guardian
);
```

### Example 3: Add Staff Member
```typescript
// Add Br. Paul as staff member
await assignUserToOrganization(
  'friary_stfrancis',
  'St. Francis Friary',
  'friary',
  'user_paul',
  'Br. Paul Brown',
  'paul@example.com',
  'org_staff',
  'user_john'
);
```

### Example 4: Check Permission Before Action
```typescript
// Check if user can approve expenses
const canApprove = await hasOrganizationPermission(
  'friary_stfrancis',
  currentUserId,
  'canApproveExpenses'
);

if (canApprove) {
  // Show approve button
  await approveExpense(expenseId);
} else {
  alert('You do not have permission to approve expenses');
}
```

### Example 5: Get User's Organizations
```typescript
// Get all organizations where user is a member
const memberships = await getUserOrganizations(userId);

memberships.organizations.forEach(org => {
  console.log(`${org.organizationName}: ${org.role}`);
  // St. Francis Friary: org_admin
  // Sacred Heart School: org_staff
});
```

## Integration with Existing Systems

### 1. Organizational Chart
Add role management button to organization cards:

```typescript
<Button onClick={() => showRoleManager(friary.id)}>
  <Users size={16} />
  Manage Members
</Button>
```

### 2. File Manager
Check permissions before file operations:

```typescript
const canDelete = await hasOrganizationPermission(
  organizationId,
  userId,
  'canDeleteDocuments'
);

if (canDelete) {
  // Show delete button
}
```

### 3. Financial Dashboard
Filter data based on permissions:

```typescript
const canViewFinancials = await hasOrganizationPermission(
  organizationId,
  userId,
  'canViewFinancials'
);

if (!canViewFinancials) {
  return <AccessDenied />;
}
```

### 4. Messaging System
Auto-add organization members to chat:

```typescript
const members = await getOrganizationMembers(organizationId);
const memberIds = members.map(m => m.userId);

await createGroupChat(
  chatName,
  creatorId,
  memberIds, // Add all members
  'group'
);
```

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Organization members
    match /organizations/{orgId}/members/{userId} {
      // Read: Any authenticated user can read
      allow read: if request.auth != null;
      
      // Write: Only org admin or super admin
      allow write: if request.auth != null && (
        isOrgAdmin(orgId, request.auth.uid) ||
        isSuperAdmin(request.auth.uid)
      );
    }
    
    // User organization memberships
    match /userOrganizationMemberships/{userId} {
      // Read: Only the user themselves
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Write: System only (via Cloud Functions)
      allow write: if false;
    }
    
    // Helper functions
    function isOrgAdmin(orgId, userId) {
      return exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(userId)) &&
             get(/databases/$(database)/documents/organizations/$(orgId)/members/$(userId)).data.role == 'org_admin';
    }
    
    function isSuperAdmin(userId) {
      return exists(/databases/$(database)/documents/users/$(userId)) &&
             get(/databases/$(database)/documents/users/$(userId)).data.role == 'super_admin';
    }
  }
}
```

## Best Practices

### 1. Always Check Permissions
```typescript
// ❌ BAD
async function deleteDocument(docId) {
  await deleteDoc(doc(db, 'documents', docId));
}

// ✅ GOOD
async function deleteDocument(docId, organizationId, userId) {
  const canDelete = await hasOrganizationPermission(
    organizationId,
    userId,
    'canDeleteDocuments'
  );
  
  if (!canDelete) {
    throw new Error('Permission denied');
  }
  
  await deleteDoc(doc(db, 'documents', docId));
}
```

### 2. Use Role Checks for UI
```typescript
// ✅ GOOD
const canManage = await canManageOrganization(organizationId, userId);

return (
  <div>
    {canManage && (
      <Button onClick={handleEdit}>Edit</Button>
    )}
  </div>
);
```

### 3. Validate on Backend
```typescript
// Cloud Function
exports.approveExpense = functions.https.onCall(async (data, context) => {
  const { expenseId, organizationId } = data;
  const userId = context.auth.uid;
  
  // Check permission
  const canApprove = await hasOrganizationPermission(
    organizationId,
    userId,
    'canApproveExpenses'
  );
  
  if (!canApprove) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to approve expenses'
    );
  }
  
  // Approve expense
  await approveExpense(expenseId);
});
```

### 4. Handle Role Changes Gracefully
```typescript
// When user role changes, refresh their permissions
useEffect(() => {
  const refreshPermissions = async () => {
    const member = await getUserOrganizationRole(organizationId, userId);
    setUserPermissions(member?.permissions);
  };
  
  refreshPermissions();
}, [organizationId, userId]);
```

## Migration Guide

### Step 1: Create Organization Documents
```typescript
// For each existing friary/parish/school
await setDoc(doc(db, 'organizations', friaryId), {
  id: friaryId,
  name: friary.name,
  type: friary.type,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Step 2: Assign Existing Guardians as Admins
```typescript
// For each friary with a guardian
if (friary.guardian) {
  await assignUserToOrganization(
    friary.id,
    friary.name,
    friary.type,
    friary.guardian,
    friary.guardianName,
    guardianEmail,
    'org_admin',
    'system'
  );
}
```

### Step 3: Assign Existing Members as Staff
```typescript
// For each member in friary.members
for (const memberId of friary.members) {
  if (memberId !== friary.guardian) {
    await assignUserToOrganization(
      friary.id,
      friary.name,
      friary.type,
      memberId,
      memberName,
      memberEmail,
      'org_staff',
      friary.guardian
    );
  }
}
```

## Testing Checklist

- [ ] Assign admin to organization
- [ ] Assign vice admin to organization
- [ ] Assign staff to organization
- [ ] Try to assign second admin (should fail)
- [ ] Try to assign second vice admin (should fail)
- [ ] Remove staff member
- [ ] Try to remove last admin (should fail)
- [ ] Change user role
- [ ] Check permissions for each role
- [ ] Get user's organizations
- [ ] Get organization members
- [ ] Test permission checks
- [ ] Test UI component
- [ ] Test with multiple organizations
- [ ] Test user in multiple organizations

## Files Created

1. `src/lib/organization-roles.ts` - Core role management system
2. `src/app/components/OrganizationRoleManager.tsx` - UI component
3. `docs/organization/ORGANIZATION_ROLE_MANAGEMENT_SYSTEM.md` - This documentation

## Future Enhancements

1. **Role Templates**: Pre-defined role templates for common scenarios
2. **Permission Groups**: Group permissions for easier management
3. **Temporary Roles**: Time-limited role assignments
4. **Role Requests**: Users can request roles, admins approve
5. **Audit Log**: Track all role changes and permission usage
6. **Delegation**: Admins can delegate specific permissions temporarily
7. **Role Hierarchy**: More granular role levels
8. **Custom Roles**: Create custom roles with specific permissions
9. **Bulk Operations**: Assign multiple users at once
10. **Role Analytics**: Track permission usage and access patterns

## Conclusion

This comprehensive role management system provides:
- ✅ Hierarchical access control per organization
- ✅ Granular permissions (19 different permissions)
- ✅ One admin and one vice admin per organization
- ✅ Multiple staff members
- ✅ User multi-membership support
- ✅ Complete UI for management
- ✅ Security and validation
- ✅ Easy integration with existing systems

The system follows best practices for RBAC and provides a solid foundation for managing organizational access control.
