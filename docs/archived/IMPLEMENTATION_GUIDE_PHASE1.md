# Phase 1 Implementation Guide
## Immediate Franciscan Integration (Week 1-2)

## 🎯 Priority Features to Implement

### 1. Update Financial Categories (Day 1-2)

#### Current Categories:
```typescript
// Generic categories
'food', 'officeSupplies', 'houseLaundrySupplies', etc.
```

#### New Franciscan Categories:
```typescript
export const franciscanCategories = {
  // Income
  income: {
    stipends: 'Mass Stipends & Offerings',
    donations: 'Donations & Benefactors',
    ministry: 'Ministry Income',
    property: 'Property Income',
    other: 'Other Income'
  },
  
  // Expenses
  expenses: {
    // Community Living
    communityLiving: {
      food: 'Food & Household Supplies',
      utilities: 'Utilities (Water, Electric, Internet)',
      maintenance: 'House Maintenance & Repairs',
      transportation: 'Community Transportation'
    },
    
    // Ministry & Apostolate
    ministry: {
      parish: 'Parish Operations',
      education: 'Education Programs',
      social: 'Social Services & Outreach',
      formation: 'Formation & Vocation'
    },
    
    // Formation & Education
    formation: {
      seminary: 'Seminary Expenses',
      education: 'Continuing Education',
      books: 'Books & Resources',
      retreats: 'Retreats & Spiritual Programs'
    },
    
    // Healthcare & Welfare
    healthcare: {
      medical: 'Medical & Dental',
      insurance: 'Health Insurance',
      retirement: 'Retirement Fund Contribution',
      emergency: 'Emergency Assistance'
    },
    
    // Province Administration
    administration: {
      office: 'Office Operations',
      communications: 'Communications & IT',
      travel: 'Travel & Meetings',
      legal: 'Legal & Professional Fees'
    }
  }
};
```

**Files to Update:**
- `src/lib/friary-financial-categories.ts` (create new)
- `src/lib/receipt-service.ts` (update categories)
- `src/app/components/DetailedTransactionEntryForm.tsx` (update dropdown)

### 2. Add Friary Management (Day 3-4)

#### Database Schema:
```typescript
// firestore collection: friaries
interface Friary {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    province: string;
    region: string;
  };
  guardian: string; // User ID of Guardian
  treasurer: string; // User ID of Treasurer
  members: string[]; // Array of User IDs
  establishedDate: Date;
  contactInfo: {
    phone: string;
    email: string;
  };
  budget: {
    annual: number;
    monthly: number;
    categories: Record<string, number>;
  };
  ministries: string[]; // Array of Ministry IDs
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Component to Create:
```typescript
// src/app/components/FriaryManager.tsx
export function FriaryManager() {
  // List all friaries
  // Add/Edit/Delete friaries
  // Assign guardians and treasurers
  // View friary members
  // Manage friary budgets
}
```

### 3. Ministry/Apostolate Tracking (Day 5-6)

#### Database Schema:
```typescript
// firestore collection: ministries
interface Ministry {
  id: string;
  name: string;
  type: 'parish' | 'education' | 'social' | 'formation' | 'healthcare' | 'other';
  friaryId: string;
  coordinator: string; // User ID
  description: string;
  location: string;
  budget: {
    annual: number;
    allocated: number;
    spent: number;
  };
  beneficiaries: {
    count: number;
    description: string;
  };
  startDate: Date;
  status: 'active' | 'planned' | 'completed' | 'suspended';
  reports: {
    monthly: boolean;
    quarterly: boolean;
    annual: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Component to Create:
```typescript
// src/app/components/MinistryManager.tsx
export function MinistryManager() {
  // List all ministries
  // Add/Edit/Delete ministries
  // Assign coordinators
  // Track budget allocation
  // Generate ministry reports
}
```

### 4. Province Dashboard (Day 7-8)

#### Enhanced Dashboard:
```typescript
// src/app/components/ProvinceDashboard.tsx
export function ProvinceDashboard() {
  return (
    <div className="province-dashboard">
      {/* Financial Overview */}
      <FinancialSummary 
        totalIncome={...}
        totalExpenses={...}
        byFriary={...}
        byMinistry={...}
      />
      
      {/* Community Status */}
      <CommunityStatus
        totalFriars={...}
        activeFriaries={...}
        activeMinistries={...}
        formationStudents={...}
      />
      
      {/* Pending Approvals */}
      <PendingApprovals
        count={...}
        urgent={...}
      />
      
      {/* Recent Activities */}
      <RecentActivities
        transactions={...}
        approvals={...}
        updates={...}
      />
    </div>
  );
}
```

### 5. Multi-Level Approval System (Day 9-10)

#### Approval Workflow:
```typescript
// src/lib/approval-workflow.ts
export class ApprovalWorkflow {
  static getApprovalChain(amount: number, friaryId: string): string[] {
    if (amount < 5000) {
      return ['guardian']; // Guardian approval only
    } else if (amount < 50000) {
      return ['guardian', 'provincial_treasurer'];
    } else if (amount < 200000) {
      return ['guardian', 'provincial_treasurer', 'provincial_minister'];
    } else {
      return ['guardian', 'provincial_treasurer', 'provincial_minister', 'provincial_council'];
    }
  }
  
  static async submitForApproval(
    transactionId: string,
    amount: number,
    friaryId: string
  ): Promise<void> {
    const approvalChain = this.getApprovalChain(amount, friaryId);
    
    await addDoc(collection(db, 'approval_requests'), {
      transactionId,
      amount,
      friaryId,
      approvalChain,
      currentStep: 0,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Send notification to first approver
    await this.notifyApprover(approvalChain[0], transactionId);
  }
}
```

### 6. Franciscan Branding (Day 11-12)

#### Theme Updates:
```typescript
// src/styles/franciscan-theme.css
:root {
  /* Franciscan Colors */
  --franciscan-brown: #6B5447;
  --franciscan-gold: #C9B59A;
  --franciscan-blue: #4A90E2;
  --franciscan-cream: #F5F5DC;
  --franciscan-green: #4CAF50;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-heading: 'Merriweather', serif;
}

.franciscan-header {
  background: linear-gradient(135deg, var(--franciscan-brown), var(--franciscan-gold));
  color: white;
}

.franciscan-card {
  border-left: 4px solid var(--franciscan-brown);
  background: var(--franciscan-cream);
}
```

#### Logo Integration:
```typescript
// Update PublicLandingPage.tsx
<div className="province-header">
  <img src={provinceLogo} alt="OFM San Antonio de Padua" />
  <h1>Office of the Provincial Treasurer</h1>
  <p>OFM Province of San Antonio de Padua, Philippines</p>
</div>
```

## 🗂️ File Structure

```
src/
├── lib/
│   ├── friary-service.ts (NEW)
│   ├── ministry-service.ts (NEW)
│   ├── approval-workflow.ts (NEW)
│   ├── franciscan-categories.ts (NEW)
│   └── province-reports.ts (NEW)
├── app/
│   └── components/
│       ├── FriaryManager.tsx (NEW)
│       ├── MinistryManager.tsx (NEW)
│       ├── ProvinceDashboard.tsx (NEW)
│       ├── ApprovalQueue.tsx (NEW)
│       └── FranciscanTheme.tsx (NEW)
└── styles/
    └── franciscan-theme.css (NEW)
```

## 🔐 Security Rules Updates

```javascript
// firestore.rules additions
match /friaries/{friaryId} {
  allow read: if isAuthenticated();
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin() || 
                   isGuardian(friaryId) || 
                   isTreasurer(friaryId);
  allow delete: if isSuperAdmin();
}

match /ministries/{ministryId} {
  allow read: if isAuthenticated();
  allow create: if isAdmin();
  allow update: if isAdmin() || 
                   isMinistryCoordinator(ministryId);
  allow delete: if isAdmin();
}

match /approval_requests/{requestId} {
  allow read: if isAuthenticated() && 
                 (isApprover(requestId) || 
                  isRequestor(requestId));
  allow create: if isAuthenticated();
  allow update: if isApprover(requestId);
  allow delete: if isSuperAdmin();
}
```

## 📊 Testing Checklist

### Financial Categories:
- [ ] Categories display correctly in dropdowns
- [ ] Old receipts still accessible
- [ ] New categories save properly
- [ ] Reports group by new categories

### Friary Management:
- [ ] Can create new friary
- [ ] Can assign guardian and treasurer
- [ ] Can add/remove members
- [ ] Budget allocation works
- [ ] Friary dashboard displays correctly

### Ministry Tracking:
- [ ] Can create new ministry
- [ ] Can assign coordinator
- [ ] Budget tracking works
- [ ] Ministry reports generate

### Approval Workflow:
- [ ] Correct approvers identified
- [ ] Notifications sent
- [ ] Approval/rejection works
- [ ] Status updates correctly

### Province Dashboard:
- [ ] All metrics display
- [ ] Data refreshes
- [ ] Charts render correctly
- [ ] Responsive on mobile

## 🚀 Deployment Steps

1. **Database Migration:**
```bash
# Run migration script to update categories
node scripts/migrate-categories.js

# Initialize friaries collection
node scripts/init-friaries.js
```

2. **Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

3. **Deploy Application:**
```bash
npm run build
firebase deploy --only hosting
```

4. **User Training:**
- Schedule training sessions
- Provide user manual
- Set up support channel

## 📝 Documentation to Create

1. **User Guide** (Tagalog & English)
   - How to submit expenses
   - How to approve requests
   - How to generate reports

2. **Admin Guide**
   - Friary setup
   - Ministry management
   - User management

3. **Financial Procedures**
   - Approval thresholds
   - Budget allocation
   - Reporting requirements

## 💡 Quick Wins

### Immediate Impact:
1. ✅ Update categories → Better organization
2. ✅ Add friary structure → Clear hierarchy
3. ✅ Implement approvals → Better governance
4. ✅ Franciscan branding → Cultural alignment

### User Benefits:
- Clearer expense categories
- Transparent approval process
- Better financial visibility
- Culturally appropriate interface

## 🎯 Success Criteria

- [ ] All friaries registered in system
- [ ] Financial categories reflect Franciscan life
- [ ] Approval workflow functioning
- [ ] Province dashboard operational
- [ ] Positive feedback from users
- [ ] 100% of transactions categorized correctly

---

## Next Steps After Phase 1

1. **Phase 2:** Council management, prayer intentions
2. **Phase 3:** Mobile app, donor portal
3. **Phase 4:** Advanced analytics, integrations

**Start with Day 1-2 (Financial Categories) and build from there!**
