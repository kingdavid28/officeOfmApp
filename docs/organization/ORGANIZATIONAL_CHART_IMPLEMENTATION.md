# Organizational Chart Implementation
## San Antonio de Padua Province - Philippines

## Overview

The Organizational Chart feature provides a comprehensive view of the OFM Franciscan Province structure, including friaries, schools, and formation houses. Each community has a detailed dashboard showing files, documents, financial reports, and other relevant information.

## Features Implemented

### 1. **Main Organizational Chart View**

**Location:** Sidebar → Organization

**Features:**
- Province-wide statistics (total communities, friars, friaries, schools)
- Search functionality to filter communities
- Three main sections:
  - **Friaries** - Regular Franciscan communities
  - **Formation Houses** - Seminary and formation centers
  - **Schools** - Educational institutions

**Visual Design:**
- Color-coded cards by type:
  - Friaries: Primary brown (#6B5447)
  - Formation Houses: Chart-2 color
  - Schools: Chart-4 color (gold)
- Hover effects for better UX
- Clickable cards that open detailed dashboards

### 2. **Friary Dashboard**

When clicking on any community card, users see:

**Header Section:**
- Community name and type badge
- Location with map pin icon
- Guardian/Director name
- Number of members
- Established year
- Contact information (phone, email)
- List of ministries

**Statistics Cards:**
- Total Documents
- Total Expenses
- Monthly Budget

**Recent Documents Section:**
- Last 5 documents uploaded for this friary
- Shows title, category, and quick access

**Financial Summary:**
- Budget utilization progress bar
- Spent vs Budget comparison
- Visual percentage indicator

### 3. **Data Structure**

#### Friary Interface
```typescript
interface Friary {
    id: string;
    name: string;
    location: string;
    type: 'friary' | 'school' | 'formation_house';
    guardian: string; // User ID
    members: string[]; // Array of User IDs
    phone?: string;
    email?: string;
    established?: string;
    ministries?: string[];
    budget?: FriaryBudget;
}
```

#### Sample Communities Included

**Friaries:**
1. San Antonio de Padua Friary (Manila)
2. St. Francis Friary (Cebu)
3. Holy Cross Friary (Davao)
4. Our Lady of Atonement Friary (Baguio)
5. San Pedro Bautista Friary (Iloilo)

**Formation Houses:**
1. San Antonio Formation House (Quezon City)

**Schools:**
1. St. Anthony School (Manila)
2. Franciscan College (Cebu)

## Files Created

### Components
- `src/app/components/OrganizationalChart.tsx` - Main component with chart and dashboard views

### Services & Types
- `src/lib/friary-types.ts` - TypeScript interfaces and sample data
- `src/lib/friary-service.ts` - Firestore service functions for friary management

### Updated Files
- `src/app/components/Sidebar.tsx` - Added "Organization" menu item
- `src/app/App.tsx` - Added route for organizational chart

## Firestore Collections

### New Collections (Optional - Currently using sample data)

#### `friaries` Collection
```typescript
{
    name: string;
    location: string;
    type: 'friary' | 'school' | 'formation_house';
    guardian: string; // User ID
    members: string[]; // User IDs
    phone?: string;
    email?: string;
    address?: string;
    established?: string;
    ministries?: string[];
    budget?: {
        annual: number;
        monthly: number;
        categories: Record<string, number>;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

#### `ministries` Collection
```typescript
{
    name: string;
    type: 'parish' | 'education' | 'social' | 'formation' | 'healthcare' | 'retreat' | 'mission' | 'other';
    friaryId: string;
    coordinator: string; // User ID
    description?: string;
    budget?: number;
    beneficiaries?: number;
    startDate?: Timestamp;
    endDate?: Timestamp;
    status: 'active' | 'inactive' | 'planned';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

## Integration with Existing Features

### Files Integration
The friary dashboard queries the `files` collection with:
```typescript
where('friaryId', '==', friary.id)
```

**To enable this:**
1. Add `friaryId` field to file uploads
2. Update FileManager to include friary selection
3. Filter files by friary in queries

### Receipts/Expenses Integration
The friary dashboard queries the `receipts` collection with:
```typescript
where('friaryId', '==', friary.id)
```

**To enable this:**
1. Add `friaryId` field to receipt entries
2. Update receipt forms to include friary selection
3. Filter expenses by friary in financial reports

### User Integration
Link users to friaries:
1. Add `friaryId` field to user profiles
2. Update user management to assign friaries
3. Filter data based on user's friary

## Usage Guide

### For Users

1. **View Organization:**
   - Click "Organization" in the sidebar
   - See all communities in the province

2. **Search Communities:**
   - Use the search box to filter by name or location

3. **View Friary Details:**
   - Click any community card
   - See detailed dashboard with stats and documents

4. **Navigate Back:**
   - Click "← Back to Organization" to return to main view

### For Administrators

1. **Add New Friary:**
   ```typescript
   import { createFriary } from '@/lib/friary-service';
   
   await createFriary({
       name: 'New Friary Name',
       location: 'City, Province',
       type: 'friary',
       guardian: 'user-id',
       members: [],
       phone: '+63 XX XXXX XXXX',
       email: 'friary@ofmsap.org',
       established: '2024'
   });
   ```

2. **Update Friary:**
   ```typescript
   import { updateFriary } from '@/lib/friary-service';
   
   await updateFriary('friary-id', {
       guardian: 'new-guardian-id',
       members: ['user1', 'user2', 'user3']
   });
   ```

3. **Initialize Sample Data:**
   ```typescript
   import { initializeSampleFriaries } from '@/lib/friary-service';
   
   await initializeSampleFriaries();
   ```

## Next Steps

### Phase 1: Data Integration (Immediate)
- [ ] Add `friaryId` field to file uploads
- [ ] Add `friaryId` field to receipt entries
- [ ] Add `friaryId` field to user profiles
- [ ] Update forms to include friary selection

### Phase 2: Enhanced Features (Short-term)
- [ ] Add friary management page (CRUD operations)
- [ ] Implement ministry management
- [ ] Add member assignment interface
- [ ] Create friary-specific reports

### Phase 3: Advanced Features (Medium-term)
- [ ] Budget allocation by friary
- [ ] Inter-friary transfers
- [ ] Province-wide analytics
- [ ] Friary comparison reports
- [ ] Guardian approval workflows

### Phase 4: Mobile & Collaboration (Long-term)
- [ ] Mobile-optimized friary view
- [ ] Friary bulletin board
- [ ] Event calendar per friary
- [ ] Resource sharing between friaries

## Best Practices

### Data Organization
1. **Consistent Naming:** Use official friary names
2. **Location Format:** "City, Province" format
3. **Contact Info:** Keep updated for communication
4. **Member Lists:** Regularly update friar assignments

### Security
1. **Role-Based Access:**
   - Guardians can view/edit their friary
   - Provincial admin can view/edit all friaries
   - Staff can view their assigned friary

2. **Data Privacy:**
   - Limit sensitive information
   - Use proper Firestore security rules

### Performance
1. **Pagination:** Implement for large friary lists
2. **Caching:** Cache friary data for faster loading
3. **Lazy Loading:** Load dashboard data on demand
4. **Indexing:** Create Firestore indexes for queries

## Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Friaries collection
match /friaries/{friaryId} {
  // Anyone authenticated can read
  allow read: if request.auth != null;
  
  // Only admins can create/update/delete
  allow create, update, delete: if isAdmin();
}

// Ministries collection
match /ministries/{ministryId} {
  // Anyone authenticated can read
  allow read: if request.auth != null;
  
  // Admins and coordinators can update
  allow create, update, delete: if isAdmin() || 
    resource.data.coordinator == request.auth.uid;
}

// Helper function
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
}
```

## Styling & Theme

The organizational chart follows the app's Franciscan theme:

**Colors:**
- Primary: #6B5447 (Brown - Franciscan habit)
- Secondary: #D4C4B0 (Cream)
- Accent: #C9B59A (Gold)
- Background: #F5F0EB (Cream)

**Icons:**
- Building2: Friaries
- School: Educational institutions
- Users: Formation houses
- MapPin: Location indicators

## Testing Checklist

- [x] Organizational chart displays correctly
- [x] Search functionality works
- [x] Cards are clickable
- [x] Friary dashboard loads
- [x] Statistics display correctly
- [x] Back navigation works
- [x] Responsive design on mobile
- [ ] Firestore integration (when data added)
- [ ] File filtering by friary
- [ ] Expense filtering by friary
- [ ] User assignment to friaries

## Support & Documentation

For questions or issues:
1. Check this documentation
2. Review the code comments in components
3. Test with sample data first
4. Verify Firestore rules are correct

## Summary

The Organizational Chart feature provides a comprehensive view of the San Antonio de Padua Province structure with:

✅ Visual organization of all communities
✅ Detailed dashboards for each friary/school
✅ Integration points for files and finances
✅ Scalable architecture for future enhancements
✅ Franciscan-themed design
✅ Mobile-responsive layout

The feature is ready to use with sample data and can be connected to Firestore for production use.
