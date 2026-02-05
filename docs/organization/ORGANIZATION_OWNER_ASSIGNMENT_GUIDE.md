# Organization Owner Assignment Guide

## Overview
Complete guide for creating organizations (friaries, schools, parishes, etc.) and assigning owners/administrators with proper role management.

## What is an Organization Owner?

An **Organization Owner** (also called Administrator or Guardian) is the person who has full control over an organization. They can:
- ✅ Manage all content and documents
- ✅ Approve expenses and manage budgets
- ✅ Add/remove members and assign roles
- ✅ Edit organization settings
- ✅ Create group chats and manage messaging
- ✅ View all financial reports

## How to Create an Organization with an Owner

### Step 1: Access Organization Management

1. Navigate to **Organizational Chart** page
2. Click **"Manage Communities"** button (top right)
   - Only Provincial Minister and Vice Provincial can access this

### Step 2: Create New Organization

1. Click **"Add Community"** button
2. Fill in the organization details:
   - **Community Name** * (required) - e.g., "St. Francis Friary"
   - **Location** * (required) - e.g., "Cebu City, Cebu"
   - **Type** * (required) - Select from:
     - Friary
     - Parish
     - School
     - Formation House
     - Retreat Center

### Step 3: Assign Owner/Guardian

This is the most important step!

1. In the **"Owner/Guardian (Administrator)"** section:
   - Click the **"Click to select owner/guardian"** button
   - A user selector will appear

2. **Search for the user**:
   - Type the person's name or email in the search box
   - The list will filter as you type

3. **Select the owner**:
   - Click on the person you want to assign as owner
   - Their profile will appear with a blue background
   - You'll see: "Will be assigned as Administrator"

4. **Verify selection**:
   - Make sure the correct person is selected
   - You can click the X button to remove and select someone else

### Step 4: Complete Organization Details (Optional)

Fill in additional information:
- **Phone** - Contact number
- **Email** - Organization email
- **Established Year** - When it was founded
- **Ministries** - Comma-separated list (e.g., "Parish Ministry, Education, Social Services")

### Step 5: Save

1. Click **"Save"** button
2. The system will:
   - ✅ Create the organization
   - ✅ Automatically assign the selected user as Administrator (org_admin)
   - ✅ Set up the role management structure
   - ✅ Grant full permissions to the owner

3. Success! The organization is created with its owner.

## Managing Roles After Creation

### View Organization Roles

1. Go to **Organizational Chart** → **Manage Communities**
2. Find the organization in the list
3. Click **"Manage Roles"** button
4. You'll see:
   - **Administrator** section (the owner)
   - **Vice Administrator** section (can assign one)
   - **Staff Members** section (can assign multiple)

### Add Vice Administrator

1. In the Role Management view, click **"Add Member"**
2. Select **"Vice Administrator"** role
3. Search and select the user
4. Click **"Add Member"**
5. They will have almost full control (some restrictions)

### Add Staff Members

1. Click **"Add Member"**
2. Select **"Staff"** role
3. Search and select the user
4. Click **"Add Member"**
5. They will have operational access

### Change Roles

1. Find the member in the list
2. Click the **Edit** button (pencil icon)
3. Enter new role number:
   - 1 = Admin
   - 2 = Vice Admin
   - 3 = Staff
   - 4 = Viewer
4. Confirm the change

### Remove Members

1. Find the member in the list
2. Click the **Delete** button (trash icon)
3. Confirm removal
4. Note: Cannot remove the last admin

## Role Hierarchy

### Administrator (Owner)
- **Count**: Exactly 1 per organization
- **Title**: Guardian, Principal, Director, Pastor
- **Permissions**: Full control (all 19 permissions)
- **Can do**:
  - Everything in the organization
  - Assign/remove all roles
  - Delete the organization
  - Manage budget

### Vice Administrator
- **Count**: Exactly 1 per organization
- **Title**: Vice Guardian, Vice Principal, Assistant Director
- **Permissions**: Almost full control (16 of 19 permissions)
- **Cannot do**:
  - Manage budget
  - Remove members
  - Edit member roles
  - Delete organization

### Staff
- **Count**: Unlimited
- **Title**: Friars, Brothers, Teachers, Staff
- **Permissions**: Operational access (8 of 19 permissions)
- **Can do**:
  - Create/edit documents
  - Create expenses (but not approve)
  - View financials
  - Send messages

### Viewer
- **Count**: Unlimited
- **Title**: Observers, Guests, Auditors
- **Permissions**: Read-only (4 of 19 permissions)
- **Can do**:
  - View documents
  - View financials
  - Send messages

## Best Practices

### 1. Choose the Right Owner
✅ **DO**:
- Assign the actual Guardian/Principal/Director
- Choose someone who will actively manage the organization
- Select someone with appropriate authority

❌ **DON'T**:
- Assign yourself if you're not the actual guardian
- Leave the owner field empty
- Assign someone who won't use the system

### 2. Set Up Complete Hierarchy
✅ **DO**:
- Assign a Vice Administrator for backup
- Add all active members as Staff
- Review roles regularly

❌ **DON'T**:
- Leave only one person with access
- Assign everyone as Admin
- Forget to add key members

### 3. Maintain Accurate Information
✅ **DO**:
- Update roles when positions change
- Remove members who leave
- Keep contact information current

❌ **DON'T**:
- Leave inactive members with admin access
- Forget to update when guardians change
- Keep outdated information

### 4. Use Proper Role Levels
✅ **DO**:
- Admin: Guardian/Principal only
- Vice Admin: Vice Guardian/Vice Principal
- Staff: Regular members
- Viewer: External observers

❌ **DON'T**:
- Give everyone admin access
- Assign staff as vice admin
- Use viewer for active members

## Common Scenarios

### Scenario 1: Creating a New Friary
```
1. Click "Add Community"
2. Name: "St. Anthony Friary"
3. Location: "Manila, Philippines"
4. Type: "Friary"
5. Owner: Select "Fr. John Doe" (Guardian)
6. Phone: "+63 2 1234 5678"
7. Email: "stanthony@ofmsap.org"
8. Established: "1950"
9. Ministries: "Parish Ministry, Social Services"
10. Click "Save"
```

Result:
- ✅ Friary created
- ✅ Fr. John Doe assigned as Administrator
- ✅ Full permissions granted
- ✅ Can now add vice admin and staff

### Scenario 2: Creating a School
```
1. Click "Add Community"
2. Name: "San Antonio School"
3. Location: "Cebu City, Cebu"
4. Type: "School"
5. Owner: Select "Fr. Peter Smith" (Principal)
6. Phone: "+63 32 1234 5678"
7. Email: "principal@sanantonio.edu.ph"
8. Established: "1965"
9. Ministries: "Education, Youth Formation"
10. Click "Save"
```

Result:
- ✅ School created
- ✅ Fr. Peter Smith assigned as Administrator
- ✅ Can manage school operations
- ✅ Can add teachers as staff

### Scenario 3: Changing Guardian
```
Old Guardian: Fr. John Doe
New Guardian: Fr. Paul Brown

Steps:
1. Go to "Manage Communities"
2. Find the friary
3. Click "Manage Roles"
4. Find Fr. John Doe in Administrator section
5. Click Edit button
6. Change role to "3" (Staff)
7. Click "Add Member"
8. Select "Administrator" role
9. Search for "Fr. Paul Brown"
10. Click "Add Member"
```

Result:
- ✅ Fr. Paul Brown is now Administrator
- ✅ Fr. John Doe is now Staff
- ✅ Smooth transition of authority

### Scenario 4: Adding Vice Guardian
```
Current: Fr. John Doe (Guardian)
Adding: Fr. Michael Lee (Vice Guardian)

Steps:
1. Go to "Manage Roles" for the friary
2. Click "Add Member"
3. Select "Vice Administrator" role
4. Search for "Fr. Michael Lee"
5. Click "Add Member"
```

Result:
- ✅ Fr. Michael Lee assigned as Vice Administrator
- ✅ Can help manage the friary
- ✅ Has backup authority

## Troubleshooting

### Problem: Can't find user to assign as owner
**Solution**:
1. Make sure the user has registered in the system
2. Check if they've completed their profile
3. Try searching by email instead of name
4. Contact system administrator if user doesn't exist

### Problem: Error when assigning owner
**Solution**:
1. Check if organization already has an admin
2. Verify you have permission to manage organizations
3. Try refreshing the page
4. Contact support if error persists

### Problem: Owner can't access organization
**Solution**:
1. Verify they're logged in with correct account
2. Check if role was assigned successfully
3. Go to "Manage Roles" and verify they're listed as Administrator
4. Try removing and re-adding them

### Problem: Need to change owner but can't remove current one
**Solution**:
1. First add the new owner as Vice Admin
2. Then change new person to Admin
3. Then change old admin to Staff or remove
4. System prevents removing last admin for safety

### Problem: Organization created but owner not assigned
**Solution**:
1. Go to "Manage Roles" for the organization
2. Click "Add Member"
3. Select "Administrator" role
4. Search and select the correct user
5. Click "Add Member"

## Security Notes

### Permission Validation
- ✅ Only Provincial Minister and Vice Provincial can create organizations
- ✅ Only admins can assign roles
- ✅ System prevents duplicate admins
- ✅ Cannot remove last admin
- ✅ All role changes are logged

### Data Protection
- ✅ Owner has full access to organization data
- ✅ Vice admin has limited access
- ✅ Staff has operational access only
- ✅ Viewers have read-only access
- ✅ Permissions enforced at database level

## Integration with Other Features

### Messaging
- Organization owner can create group chats
- All members can be added to organization chat
- Direct messaging available to all members

### Financial Management
- Owner can approve all expenses
- Vice admin can approve expenses
- Staff can create expense requests
- Viewers can only view reports

### Document Management
- Owner can delete any document
- Vice admin can edit documents
- Staff can create/edit documents
- Viewers can only view documents

### File Sharing
- All members can upload files
- Owner controls file permissions
- Organization-specific file storage
- Automatic organization tagging

## Quick Reference

### Creating Organization
1. Organizational Chart → Manage Communities
2. Add Community
3. Fill details
4. Select owner
5. Save

### Assigning Roles
1. Manage Communities
2. Find organization
3. Manage Roles
4. Add Member
5. Select role and user

### Changing Owner
1. Manage Roles
2. Add new admin
3. Change old admin to staff
4. Verify change

### Removing Member
1. Manage Roles
2. Find member
3. Click Delete
4. Confirm removal

## Related Documentation
- [Organization Role Management System](./ORGANIZATION_ROLE_MANAGEMENT_SYSTEM.md)
- [Quick Start Role Management](./QUICK_START_ROLE_MANAGEMENT.md)
- [Organizational Chart Implementation](./ORGANIZATIONAL_CHART_IMPLEMENTATION.md)

## Support

If you need help:
1. Check this documentation
2. Review the role management system docs
3. Contact your Provincial Minister
4. Reach out to system administrator

---

**Last Updated**: February 2026  
**Version**: 1.0  
**System**: OFM Franciscan Province Office Management
