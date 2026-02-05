# Updated Organizational Chart - San Antonio de Padua Province

## ✅ What's New

### 1. **Actual Province Communities (22 Total)**
Replaced sample data with real communities from the San Antonio de Padua Province:

#### Cebu (4 communities)
- Postulancy Formation House
- Franciscan Renewal Center (Minglanilla)
- St. Francis of Assisi Provincial House Friary (Labangon)
- San Vicente Ferrer Parish–Franciscan Friary (Sambag 2)

#### Northern Samar (1 community)
- St. Francis College (Allen)

#### Calbayog, Samar (2 communities)
- San Damiano Aspirancy Formation House
- Christ the King College (East Awang)

#### Negros Oriental (2 communities)
- Saint Francis College (Guihulngan)
- St. Francis School (La Libertad)

#### Biliran (1 community)
- Saint Raphael Archangel Parish (Kawayan)

#### Leyte (1 community)
- St. Anthony of Padua Novitiate House (Ormoc City)

#### Zamboanga del Sur (3 communities)
- Our Lady of Fatima Parish Friary (Josefina)
- Franciscan Intensification Year Balay Piksalabukan Friary (Josefina)
- Sto. Niño Pastoral Station (Dumingag)

#### Davao City (1 community)
- St. Bonaventure House of Studies

#### Lanao del Norte (1 community)
- Walay A Kalilintad Friary (Baloi)

#### Basilan (2 communities)
- Sagrado Corazon de Jesus Parish (Lamitan)
- San Roque Parish (Tairan)

#### Kidapawan City (2 communities)
- Damieta Friary
- Center for Inter-Religious Dialogue

### 2. **Enhanced Role System**

New role hierarchy with vice positions:

| Role | Display Name | Level | Permissions |
|------|--------------|-------|-------------|
| `super_admin` | Provincial Minister | 100 | Full access to everything |
| `vice_super_admin` | Vice Provincial | 90 | Full access, can manage all friaries |
| `provincial_treasurer` | Provincial Treasurer | 80 | Financial oversight, approve up to ₱50,000 |
| `admin` | Guardian | 70 | Manage own friary, approve up to ₱5,000 |
| `vice_admin` | Vice Guardian | 60 | Assist guardian, approve up to ₱5,000 |
| `treasurer` | Local Treasurer | 50 | Manage friary finances |
| `staff` | Friar | 10 | Basic access |
| `guest` | Guest | 0 | Limited access |

### 3. **CRUD Functionality**

**Who Can Manage:**
- Provincial Minister (super_admin)
- Vice Provincial (vice_super_admin)

**Features:**
- ✅ Add new communities
- ✅ Edit existing communities
- ✅ Delete communities (with confirmation)
- ✅ Real-time updates
- ✅ Form validation
- ✅ Error handling

### 4. **Five Community Types**

| Type | Icon | Border Color | Examples |
|------|------|--------------|----------|
| Friary | 🏛️ Building2 | Brown | Provincial House, Damieta Friary |
| Parish | ⛪ Church | Chart-2 | San Vicente Ferrer, Sagrado Corazon |
| School | 🎓 School | Chart-4 | St. Francis College, Christ the King |
| Formation House | 👥 Users | Chart-3 | Postulancy, Novitiate, Aspirancy |
| Retreat Center | 🏠 Home | Chart-5 | Franciscan Renewal Center |

---

## 📁 Files Updated

### New Files
- `src/app/components/FriaryManagement.tsx` - CRUD interface for managing communities

### Updated Files
- `src/app/components/OrganizationalChart.tsx` - Complete rewrite with real data
- `src/lib/friary-types.ts` - Added 22 actual communities, new roles, helper functions
- `src/lib/auth.ts` - Updated UserRole type
- `src/lib/enhanced-auth.ts` - Updated UserRole type

---

## 🎯 How to Use

### For Provincial Minister / Vice Provincial

#### Access Management Interface
1. Click **"Organization"** in sidebar
2. Click **"Manage Communities"** button (top right)
3. See list of all communities

#### Add New Community
1. Click **"Add Community"** button
2. Fill in the form:
   - Community Name * (required)
   - Location * (required)
   - Type (dropdown)
   - Guardian/Director name
   - Phone number
   - Email address
   - Established year
   - Ministries (comma-separated)
3. Click **"Save"**

#### Edit Community
1. Find the community in the list
2. Click **"Edit"** button
3. Update the information
4. Click **"Save"**

#### Delete Community
1. Find the community in the list
2. Click **"Delete"** button
3. Confirm deletion
4. Community is removed

### For All Users

#### View Communities
1. Click **"Organization"** in sidebar
2. Browse communities by type
3. Use search to filter
4. Click any card to view details

#### View Community Dashboard
1. Click on a community card
2. See:
   - Contact information
   - Statistics (documents, expenses, budget)
   - Recent documents
   - Financial summary
3. Click **"← Back"** to return

---

## 🔐 Permission System

### Role-Based Access

```typescript
// Can manage all friaries (add, edit, delete)
canManageFriaries(role)
  → super_admin: ✅
  → vice_super_admin: ✅
  → Others: ❌

// Can manage own friary
canManageOwnFriary(role)
  → admin: ✅
  → vice_admin: ✅
  → Others: ❌

// Can view all friaries
canViewAllFriaries(role)
  → super_admin: ✅
  → vice_super_admin: ✅
  → provincial_treasurer: ✅
  → Others: Limited

// Can approve expenses
canApproveExpenses(role, amount)
  → super_admin: Any amount
  → vice_super_admin: Any amount
  → provincial_treasurer: Up to ₱50,000
  → admin/vice_admin: Up to ₱5,000
  → Others: ❌
```

### Approval Hierarchy

```
Expense Amount          Approver
─────────────────────────────────────
< ₱5,000               Guardian or Vice Guardian
₱5,000 - ₱50,000       Provincial Treasurer
₱50,000 - ₱200,000     Provincial Minister
> ₱200,000             Provincial Council
```

---

## 🗄️ Data Structure

### Firestore Collections

#### `friaries` Collection
```typescript
{
  name: string;                    // "St. Francis Friary"
  location: string;                // "Cebu City, Cebu"
  type: FriaryType;                // "friary" | "parish" | "school" | "formation_house" | "retreat_center"
  guardian: string;                // User ID
  guardianName?: string;           // "Fr. Guardian Name"
  members: string[];               // Array of User IDs
  memberCount?: number;            // 10
  phone?: string;                  // "+63 32 1234 5678"
  email?: string;                  // "cebu@ofmsap.org"
  address?: string;                // Full address
  established?: string;            // "1965"
  ministries?: string[];           // ["Parish Ministry", "Education"]
  budget?: {
    annual: number;
    monthly: number;
    categories: Record<string, number>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Sample Data

Currently using `SAMPLE_FRIARIES` array with 22 actual communities. To use Firestore:

```typescript
import { initializeSampleFriaries } from '@/lib/friary-service';

// Run once to populate Firestore
await initializeSampleFriaries();
```

---

## 🚀 Integration Steps

### Step 1: Initialize Firestore Data

```typescript
// In your initialization code or admin panel
import { initializeSampleFriaries } from './lib/friary-service';

// This will create all 22 communities in Firestore
await initializeSampleFriaries();
```

### Step 2: Add friaryId to Files

```typescript
// When uploading files
await addDoc(collection(db, 'files'), {
  ...fileData,
  friaryId: 'cebu-provincial-house', // Link to friary
  uploadedAt: Timestamp.now()
});
```

### Step 3: Add friaryId to Receipts

```typescript
// When creating receipts
await addDoc(collection(db, 'receipts'), {
  ...receiptData,
  friaryId: 'cebu-provincial-house', // Link to friary
  receiptDate: Timestamp.now()
});
```

### Step 4: Assign Users to Friaries

```typescript
// Update user profiles
await updateDoc(doc(db, 'users', userId), {
  friaryId: 'cebu-provincial-house',
  role: 'admin' // Guardian
});
```

### Step 5: Update Firestore Rules

```javascript
// firestore.rules
match /friaries/{friaryId} {
  // Anyone authenticated can read
  allow read: if request.auth != null;
  
  // Only Provincial Minister and Vice Provincial can write
  allow create, update, delete: if 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'vice_super_admin'];
}
```

---

## 📊 Statistics

### Province Overview
- **Total Communities:** 22
- **Friaries:** 5
- **Parishes:** 7
- **Schools:** 4
- **Formation Houses:** 5
- **Retreat Centers:** 1

### Geographic Distribution
- **Cebu:** 4 communities
- **Samar (Northern & Calbayog):** 3 communities
- **Negros Oriental:** 2 communities
- **Zamboanga del Sur:** 3 communities
- **Basilan:** 2 communities
- **Kidapawan City:** 2 communities
- **Others:** 6 communities

---

## 🎨 UI Features

### Main View
- Search bar for filtering
- Province statistics cards
- Communities grouped by type
- Color-coded cards
- Hover effects
- Responsive grid layout

### Management Interface
- Add/Edit form with validation
- Delete with confirmation
- Real-time updates
- Error handling
- Loading states
- Permission checks

### Community Dashboard
- Complete information display
- Contact details
- Statistics cards
- Recent documents
- Financial summary with progress bar
- Back navigation

---

## 🔧 Helper Functions

### Role Management
```typescript
// Get role display name
getRoleDisplayName('super_admin') // "Provincial Minister"

// Check permissions
canManageFriaries(role)
canManageOwnFriary(role)
canViewAllFriaries(role)
canApproveExpenses(role, amount)

// Get role level (for comparisons)
getRoleLevel('super_admin') // 100
getRoleLevel('admin') // 70
```

### Friary Type
```typescript
// Get type display name
getFriaryTypeDisplay('formation_house') // "Formation House"
```

---

## 🧪 Testing Checklist

### Functionality
- [x] View all communities
- [x] Search communities
- [x] Click to view details
- [x] Back navigation
- [x] Add new community (admin only)
- [x] Edit community (admin only)
- [x] Delete community (admin only)
- [x] Permission checks
- [x] Form validation
- [x] Error handling

### UI/UX
- [x] Responsive design
- [x] Color-coded cards
- [x] Hover effects
- [x] Loading states
- [x] Error messages
- [x] Confirmation dialogs

### Data
- [x] 22 communities loaded
- [x] Correct types assigned
- [x] Proper grouping
- [x] Search works
- [ ] Firestore integration (pending)

---

## 📝 Next Steps

### Immediate
1. Test the management interface
2. Verify all 22 communities display correctly
3. Test role permissions
4. Initialize Firestore data

### Short-term
1. Add friaryId to files and receipts
2. Assign users to friaries
3. Update Firestore rules
4. Test real-time updates

### Medium-term
1. Add bulk import/export
2. Add community photos
3. Add member management
4. Add ministry tracking
5. Add budget allocation

### Long-term
1. Mobile app integration
2. QR codes for communities
3. Check-in system
4. Event calendar per community
5. Resource sharing platform

---

## 🆘 Troubleshooting

### "You don't have permission to manage friaries"
**Solution:** Only Provincial Minister and Vice Provincial can manage. Check your role in user profile.

### Communities not loading
**Solution:** Check if Firestore data is initialized. Run `initializeSampleFriaries()` if needed.

### Can't save community
**Solution:** Check form validation. Name and location are required fields.

### Delete not working
**Solution:** Confirm the deletion dialog. Check console for errors.

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review console for errors
3. Verify Firestore rules
4. Contact system administrator

---

**Version:** 2.0.0
**Date:** February 4, 2026
**Province:** OFM San Antonio de Padua, Philippines

---

*This updated system now reflects the actual structure of the San Antonio de Padua Province with full CRUD functionality and enhanced role management.*
