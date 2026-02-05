# Super Admin File Access Guide

## Overview
Complete guide for super admins to view and manage files and documents for all friaries, schools, parishes, and other organizations.

## 🎯 How Super Admins Can Access Organization Files

### Method 1: Through Organizational Chart (Recommended)

This is the **best and most intuitive** way to access organization-specific files.

#### Step-by-Step:

1. **Navigate to Organizational Chart**
   ```
   Sidebar → Organization (Building icon)
   ```

2. **Find the Organization**
   - Browse by type (Friaries, Schools, Parishes, etc.)
   - Or use the search box to find specific community

3. **Click on Organization Card**
   - Click "View Details" on any organization card
   - This opens the organization dashboard

4. **View Files Tab** (To be implemented)
   ```
   Organization Dashboard
   ├── Overview Tab
   ├── Financial Summary Tab
   ├── Members Tab
   └── Files & Documents Tab ← NEW
   ```

5. **Access Files**
   - See all files uploaded for that organization
   - Filter by category
   - Download or view files
   - Upload new files (if you have permission)

### Method 2: Through File Manager with Filters

Access all files with organization filtering.

#### Step-by-Step:

1. **Navigate to File Manager**
   ```
   Sidebar → Files (Folder icon)
   ```

2. **Use Organization Filter** (To be implemented)
   ```
   Filter Bar
   ├── Search: [Search files...]
   ├── Category: [All Categories ▼]
   └── Organization: [All Organizations ▼] ← NEW
   ```

3. **Select Organization**
   - Choose specific friary, school, or parish
   - Files automatically filter to show only that organization's files

4. **View/Download Files**
   - Click eye icon to view
   - Click download icon to download
   - See file details and metadata

### Method 3: Through AI Assistant

Use AI to find files across all organizations.

#### Step-by-Step:

1. **Navigate to AI Assistant**
   ```
   Sidebar → AI Assistant (Brain icon)
   ```

2. **Ask About Files**
   ```
   Examples:
   - "Show me all financial reports from St. Francis Friary"
   - "Find documents uploaded by Fr. John"
   - "What files does Sacred Heart School have?"
   - "Show me all receipts from last month for all parishes"
   ```

3. **AI Searches All Files**
   - Searches across all organizations
   - Returns relevant files with context
   - Provides direct links to view/download

## 🔐 Access Control

### Super Admin Permissions
As a super admin, you can:
- ✅ View files from ALL organizations
- ✅ Download files from ALL organizations
- ✅ Upload files to ANY organization
- ✅ Delete files from ANY organization
- ✅ See file metadata and history
- ✅ Access financial documents
- ✅ View restricted documents

### Organization Admin Permissions
Organization admins can only:
- ✅ View files from THEIR organization
- ✅ Upload files to THEIR organization
- ✅ Delete files from THEIR organization
- ❌ Cannot see other organizations' files

### Staff Permissions
Staff members can:
- ✅ View files from their organization
- ✅ Upload files to their organization
- ❌ Cannot delete files
- ❌ Cannot see other organizations' files

## 📁 File Organization Structure

### How Files Are Organized

```
Files Collection (Firestore)
├── File 1
│   ├── name: "Financial Report 2024.pdf"
│   ├── category: "Reports"
│   ├── organizationId: "friary_stfrancis" ← Links to organization
│   ├── organizationName: "St. Francis Friary"
│   ├── uploadedBy: "Fr. John Doe"
│   └── url: "https://storage..."
│
├── File 2
│   ├── name: "Budget Proposal.xlsx"
│   ├── category: "Documents"
│   ├── organizationId: "school_sacredheart"
│   ├── organizationName: "Sacred Heart School"
│   └── ...
│
└── File 3
    ├── name: "Meeting Minutes.docx"
    ├── category: "Minutes"
    ├── organizationId: "parish_stanthony"
    └── ...
```

### File Categories

1. **Documents** - General documents
2. **Reports** - Financial and activity reports
3. **Forms** - Application and request forms
4. **Policies** - Rules and guidelines
5. **Minutes** - Meeting minutes
6. **Correspondence** - Letters and communications
7. **Other** - Miscellaneous files

## 🎨 User Interface Design

### Organization Dashboard - Files Tab

```
┌────────────────────────────────────────────────┐
│ St. Francis Friary                             │
│ [Overview] [Financial] [Members] [Files] ←     │
├────────────────────────────────────────────────┤
│                                                │
│ 📁 Files & Documents                           │
│                                                │
│ [Search files...] [Category ▼] [Upload File]  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ 📄 Financial Report 2024.pdf             │  │
│ │ Reports • 2.5 MB • Uploaded by Fr. John  │  │
│ │ [👁 View] [⬇ Download] [🗑 Delete]       │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ 📄 Budget Proposal.xlsx                  │  │
│ │ Documents • 1.2 MB • Uploaded by Admin   │  │
│ │ [👁 View] [⬇ Download] [🗑 Delete]       │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Total Files: 15 • Total Size: 45.2 MB         │
└────────────────────────────────────────────────┘
```

### File Manager - Organization Filter

```
┌────────────────────────────────────────────────┐
│ File Manager                                   │
│                                                │
│ [Search...] [Category ▼] [Organization ▼]     │
│                          └─ All Organizations  │
│                             St. Francis Friary │
│                             Sacred Heart School│
│                             St. Anthony Parish │
│                             ...                │
│                                                │
│ Showing 15 files from St. Francis Friary      │
│                                                │
│ [File Grid/List View]                          │
└────────────────────────────────────────────────┘
```

## 🔍 Search and Filter Options

### Search Capabilities

**By Name:**
```
Search: "financial report"
→ Shows all files with "financial report" in name
```

**By Category:**
```
Category: Reports
→ Shows all report files
```

**By Organization:**
```
Organization: St. Francis Friary
→ Shows only St. Francis Friary files
```

**By Uploader:**
```
Search: "Fr. John"
→ Shows files uploaded by Fr. John
```

**By Date:**
```
Date Range: Last 30 days
→ Shows recent files
```

### Combined Filters

```
Organization: Sacred Heart School
Category: Reports
Date: Last month
→ Shows last month's reports from Sacred Heart School
```

## 📊 File Statistics

### Organization File Summary

```
┌────────────────────────────────────┐
│ File Statistics by Organization    │
├────────────────────────────────────┤
│ St. Francis Friary                 │
│ Files: 25 • Size: 125 MB           │
│                                    │
│ Sacred Heart School                │
│ Files: 18 • Size: 89 MB            │
│                                    │
│ St. Anthony Parish                 │
│ Files: 12 • Size: 45 MB            │
│                                    │
│ Total: 55 files • 259 MB           │
└────────────────────────────────────┘
```

## 🚀 Implementation Plan

### Phase 1: Add Organization Field to Files ✅
```typescript
interface FileDocument {
  id: string;
  name: string;
  category: string;
  organizationId: string;      // NEW
  organizationName: string;    // NEW
  organizationType: string;    // NEW
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  size: number;
}
```

### Phase 2: Add Organization Filter to File Manager
```typescript
// Add organization filter dropdown
const [filterOrganization, setFilterOrganization] = useState('all');

// Filter files by organization
const filteredFiles = files.filter(file => {
  const matchesOrg = filterOrganization === 'all' || 
                     file.organizationId === filterOrganization;
  // ... other filters
  return matchesOrg && matchesCategory && matchesSearch;
});
```

### Phase 3: Add Files Tab to Organization Dashboard
```typescript
// In OrganizationalChart component
const [activeTab, setActiveTab] = useState('overview');

// Tabs: Overview | Financial | Members | Files
{activeTab === 'files' && (
  <OrganizationFiles 
    organizationId={friary.id}
    organizationName={friary.name}
  />
)}
```

### Phase 4: Update Upload Form
```typescript
// Add organization selector to upload form
<Select
  value={formData.organizationId}
  onValueChange={(value) => setFormData({...formData, organizationId: value})}
>
  <SelectTrigger>
    <SelectValue placeholder="Select Organization" />
  </SelectTrigger>
  <SelectContent>
    {organizations.map(org => (
      <SelectItem key={org.id} value={org.id}>
        {org.name} ({org.type})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## 🔒 Security Rules

### Firestore Security Rules

```javascript
// Files collection
match /files/{fileId} {
  // Super admins can read all files
  allow read: if isSuperAdmin();
  
  // Organization admins can read their organization's files
  allow read: if isAuthenticated() && (
    resource.data.organizationId in getUserOrganizations(request.auth.uid)
  );
  
  // Super admins and org admins can write
  allow write: if isAuthenticated() && (
    isSuperAdmin() ||
    isOrgAdmin(request.resource.data.organizationId, request.auth.uid)
  );
}

// Helper function
function getUserOrganizations(userId) {
  return get(/databases/$(database)/documents/userOrganizationMemberships/$(userId)).data.organizations;
}
```

## 📱 Mobile Access

### Mobile View

```
┌─────────────────────┐
│ Files               │
│ [≡ Menu]            │
├─────────────────────┤
│ [Search...]         │
│ [Filters ▼]         │
│                     │
│ 📄 Report.pdf       │
│ St. Francis Friary  │
│ 2.5 MB • Reports    │
│ [View] [Download]   │
│                     │
│ 📄 Budget.xlsx      │
│ Sacred Heart School │
│ 1.2 MB • Documents  │
│ [View] [Download]   │
└─────────────────────┘
```

## 🎓 Training Guide

### For Super Admins

**Quick Start:**
1. Go to Organization → Find community → View Details
2. Click "Files" tab to see all files
3. Use filters to find specific files
4. Download or view as needed

**Advanced:**
1. Use File Manager with organization filter
2. Bulk download files
3. Generate file reports
4. Monitor file usage

### For Organization Admins

**Quick Start:**
1. Go to Files in sidebar
2. Upload files for your organization
3. Organize by category
4. Share with members

## 📈 Reporting

### File Usage Reports

```
Monthly File Report
─────────────────────
St. Francis Friary
├── New Files: 5
├── Total Files: 25
├── Storage Used: 125 MB
└── Most Active: Fr. John (3 uploads)

Sacred Heart School
├── New Files: 3
├── Total Files: 18
├── Storage Used: 89 MB
└── Most Active: Principal (2 uploads)
```

## 🆘 Troubleshooting

### Can't See Organization Files?

**Check:**
1. Are you logged in as super admin?
2. Does the organization have files uploaded?
3. Are files properly tagged with organizationId?
4. Check Firestore security rules

### Files Not Showing in Organization Dashboard?

**Solution:**
1. Verify organizationId matches
2. Check file permissions
3. Refresh the page
4. Check browser console for errors

### Can't Upload Files to Organization?

**Check:**
1. Do you have permission?
2. Is organization selected?
3. Is file size within limit?
4. Check Firebase Storage configuration

## 🔗 Related Documentation

- [Organization Role Management](./ORGANIZATION_ROLE_MANAGEMENT_SYSTEM.md)
- [File Manager Implementation](../firebase-setup/FIREBASE_STORAGE_SETUP_COMPLETE.md)
- [Organizational Chart](./ORGANIZATIONAL_CHART_IMPLEMENTATION.md)

## 📝 Summary

### Current State
- ❌ Files not linked to organizations
- ❌ No organization filter in File Manager
- ❌ No files tab in Organization Dashboard
- ❌ Super admins can't easily view org-specific files

### After Implementation
- ✅ Files linked to organizations
- ✅ Organization filter in File Manager
- ✅ Files tab in Organization Dashboard
- ✅ Super admins can easily view all org files
- ✅ Proper access control
- ✅ Better file organization

---

**Status**: Implementation Guide  
**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 4-6 hours
