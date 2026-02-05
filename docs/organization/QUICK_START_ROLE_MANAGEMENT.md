# Quick Start: Organization Role Management

## Overview
Quick guide to implement role-based access control for your organizations (friaries, parishes, schools, etc.).

## 5-Minute Setup

### Step 1: Import the System
```typescript
import {
  assignUserToOrganization,
  getOrganizationMembers,
  hasOrganizationPermission,
  canManageOrganization
} from '../../lib/organization-roles';
```

### Step 2: Assign Roles
```typescript
// Assign Guardian as Admin
await assignUserToOrganization(
  'friary_123',           // Organization ID
  'St. Francis Friary',   // Organization Name
  'friary',               // Organization Type
  'user_john',            // User ID
  'Fr. John Doe',         // User Name
  'john@example.com',     // User Email
  'org_admin',            // Role
  'super_admin_id'        // Assigned By
);

// Assign Vice Guardian
await assignUserToOrganization(
  'friary_123',
  'St. Francis Friary',
  'friary',
  'user_peter',
  'Fr. Peter Smith',
  'peter@example.com',
  'org_vice_admin',
  'user_john'
);

// Assign Staff
await assignUserToOrganization(
  'friary_123',
  'St. Francis Friary',
  'friary',
  'user_paul',
  'Br. Paul Brown',
  'paul@example.com',
  'org_staff',
  'user_john'
);
```

### Step 3: Check Permissions
```typescript
// Before any action, check permission
const canEdit = await hasOrganizationPermission(
  organizationId,
  userId,
  'canEditDocuments'
);

if (canEdit) {
  // Allow action
} else {
  // Show error
}
```

### Step 4: Use in UI
```typescript
import { OrganizationRoleManager } from './components/OrganizationRoleManager';

// In your component
<OrganizationRoleManager
  organizationId={friary.id}
  organizationName={friary.name}
  organizationType={friary.type}
/>
```

## Common Use Cases

### Use Case 1: Protect Delete Button
```typescript
const canDelete = await hasOrganizationPermission(
  organizationId,
  userId,
  'canDeleteDocuments'
);

return (
  <div>
    {canDelete && (
      <Button onClick={handleDelete}>Delete</Button>
    )}
  </div>
);
```

### Use Case 2: Protect Financial Data
```typescript
const canViewFinancials = await hasOrganizationPermission(
  organizationId,
  userId,
  'canViewFinancials'
);

if (!canViewFinancials) {
  return <AccessDenied />;
}

return <FinancialDashboard />;
```

### Use Case 3: Show Admin Panel
```typescript
const canManage = await canManageOrganization(organizationId, userId);

return (
  <div>
    {canManage && (
      <AdminPanel />
    )}
  </div>
);
```

## Role Hierarchy

```
Admin (org_admin)
├── Full control
├── Can do everything
└── One per organization

Vice Admin (org_vice_admin)
├── Almost full control
├── Cannot manage budget
├── Cannot remove members
└── One per organization

Staff (org_staff)
├── Operational access
├── Can create/edit
├── Cannot delete/approve
└── Multiple per organization

Viewer (org_viewer)
├── Read-only access
├── Can view only
└── Multiple per organization
```

## Permission Quick Reference

| Permission | Admin | Vice Admin | Staff | Viewer |
|------------|-------|------------|-------|--------|
| Create Documents | ✅ | ✅ | ✅ | ❌ |
| Edit Documents | ✅ | ✅ | ✅ | ❌ |
| Delete Documents | ✅ | ✅ | ❌ | ❌ |
| Create Expenses | ✅ | ✅ | ✅ | ❌ |
| Approve Expenses | ✅ | ✅ | ❌ | ❌ |
| Manage Budget | ✅ | ❌ | ❌ | ❌ |
| Add Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ | ❌ |
| Edit Roles | ✅ | ❌ | ❌ | ❌ |
| Delete Organization | ✅ | ❌ | ❌ | ❌ |

## Integration Examples

### With Organizational Chart
```typescript
// Add button to organization card
<Button onClick={() => setShowRoleManager(true)}>
  <Users size={16} />
  Manage Members
</Button>

{showRoleManager && (
  <OrganizationRoleManager
    organizationId={friary.id}
    organizationName={friary.name}
    organizationType={friary.type}
  />
)}
```

### With File Manager
```typescript
// Check before showing delete button
const canDelete = await hasOrganizationPermission(
  file.organizationId,
  userId,
  'canDeleteDocuments'
);

<FileList>
  {files.map(file => (
    <FileItem key={file.id}>
      {file.name}
      {canDelete && (
        <DeleteButton onClick={() => deleteFile(file.id)} />
      )}
    </FileItem>
  ))}
</FileList>
```

### With Messaging
```typescript
// Auto-add organization members to chat
const members = await getOrganizationMembers(organizationId);
const memberIds = members.map(m => m.userId);

await createGroupChat(
  `${organizationName} Chat`,
  creatorId,
  memberIds
);
```

## Common Patterns

### Pattern 1: Permission Hook
```typescript
function useOrganizationPermission(
  organizationId: string,
  permission: keyof OrganizationPermissions
) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    if (!user?.uid) return;
    
    hasOrganizationPermission(organizationId, user.uid, permission)
      .then(setHasPermission);
  }, [organizationId, user?.uid, permission]);
  
  return hasPermission;
}

// Usage
const canEdit = useOrganizationPermission(orgId, 'canEditDocuments');
```

### Pattern 2: Protected Component
```typescript
function ProtectedComponent({ 
  organizationId, 
  permission, 
  children 
}) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    if (!user?.uid) return;
    
    hasOrganizationPermission(organizationId, user.uid, permission)
      .then(setHasPermission);
  }, [organizationId, user?.uid, permission]);
  
  if (!hasPermission) return null;
  
  return <>{children}</>;
}

// Usage
<ProtectedComponent 
  organizationId={orgId} 
  permission="canDeleteDocuments"
>
  <DeleteButton />
</ProtectedComponent>
```

### Pattern 3: Role Badge
```typescript
function RoleBadge({ role }: { role: OrganizationRole }) {
  const config = {
    org_admin: { label: 'Admin', color: 'blue', icon: Shield },
    org_vice_admin: { label: 'Vice Admin', color: 'green', icon: ShieldCheck },
    org_staff: { label: 'Staff', color: 'gray', icon: User },
    org_viewer: { label: 'Viewer', color: 'gray', icon: Eye }
  };
  
  const { label, color, icon: Icon } = config[role];
  
  return (
    <span className={`badge badge-${color}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}
```

## Troubleshooting

### Issue: "Organization already has an admin"
**Solution**: Remove existing admin first or update their role
```typescript
await removeUserFromOrganization(orgId, existingAdminId, currentUserId);
await assignUserToOrganization(orgId, ..., newAdminId, ..., 'org_admin', ...);
```

### Issue: "Cannot remove the last admin"
**Solution**: Assign a new admin first
```typescript
await assignUserToOrganization(orgId, ..., newAdminId, ..., 'org_admin', ...);
await removeUserFromOrganization(orgId, oldAdminId, currentUserId);
```

### Issue: Permission check returns false
**Solution**: Check if user is assigned to organization
```typescript
const member = await getUserOrganizationRole(orgId, userId);
console.log('Member:', member); // Check if exists and is active
```

## Next Steps

1. ✅ Read full documentation: `ORGANIZATION_ROLE_MANAGEMENT_SYSTEM.md`
2. ✅ Implement in your components
3. ✅ Add permission checks to all actions
4. ✅ Test with different roles
5. ✅ Add UI for role management

## Support

For detailed documentation, see:
- `docs/organization/ORGANIZATION_ROLE_MANAGEMENT_SYSTEM.md`
- `src/lib/organization-roles.ts`
- `src/app/components/OrganizationRoleManager.tsx`
