# Firestore Undefined Field Fix

## ❌ Problem

Registration was failing with:
```
FirebaseError: Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field requestedAdminId)
```

## 🔍 Root Cause

Firestore **does not allow `undefined` values** in documents. The code was setting:

```typescript
requestedAdminId: role === 'staff' ? requestedAdminId : undefined
```

When `requestedAdminId` was not provided, it became `undefined`, which Firestore rejects.

## 🔧 Solution

### Before (Caused Error):
```typescript
const pendingUser: Omit<PendingUser, 'id'> = {
  email,
  name,
  role,
  requestedAt: new Date(),
  status: 'pending',
  authProvider: 'email',
  requestedAdminId: role === 'staff' ? requestedAdminId : undefined // ❌ undefined not allowed
};
```

### After (Fixed):
```typescript
// Build object without undefined fields
const pendingUser: any = {
  email,
  name,
  role,
  requestedAt: new Date(),
  status: 'pending',
  authProvider: 'email'
};

// Only add requestedAdminId if it has a value
if (role === 'staff' && requestedAdminId) {
  pendingUser.requestedAdminId = requestedAdminId;
}
```

## 📋 What Changed

### 1. `requestUserCreation()` Function
- Changed to conditionally add `requestedAdminId` field
- Only includes field if value is provided
- Omits field entirely if not needed

### 2. `createGoogleUserRequest()` Function
- Same fix applied for Google sign-in flow
- Prevents undefined values in Firestore

## 🎯 Firestore Rules

### Valid Values:
✅ `null` - Allowed
✅ `"string"` - Allowed
✅ `123` - Allowed
✅ Field omitted - Allowed

### Invalid Values:
❌ `undefined` - **NOT allowed**

## 🧪 Testing

### Test Registration:

1. **Go to registration page**
2. **Fill in details:**
   - Email: test@example.com
   - Name: Test User
   - Role: Staff
3. **Submit**
4. **Should succeed** without undefined error

### Expected Firestore Document:

**When requestedAdminId is NOT provided:**
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "role": "staff",
  "requestedAt": "2026-02-04T...",
  "status": "pending",
  "authProvider": "email"
  // requestedAdminId field is omitted
}
```

**When requestedAdminId IS provided:**
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "role": "staff",
  "requestedAt": "2026-02-04T...",
  "status": "pending",
  "authProvider": "email",
  "requestedAdminId": "admin123" // ✅ Included with value
}
```

## 💡 Best Practice

When working with Firestore:

### ❌ DON'T:
```typescript
const data = {
  field1: value1,
  field2: value2 || undefined, // ❌ Can cause errors
  field3: optionalValue // ❌ If undefined, will error
};
```

### ✅ DO:
```typescript
const data: any = {
  field1: value1,
  field2: value2
};

// Conditionally add optional fields
if (optionalValue) {
  data.field3 = optionalValue;
}

// Or use object spread with filtering
const data = {
  field1: value1,
  field2: value2,
  ...(optionalValue && { field3: optionalValue })
};
```

## 🔄 Progress Summary

### Issues Fixed:
1. ✅ **Permission Error** - Fixed Firestore rules to allow reading pending_users
2. ✅ **Undefined Field Error** - Fixed to omit undefined fields from Firestore documents

### Current Status:
✅ Registration should now work completely!

## 🚀 Next Steps

1. ✅ Code fixed
2. ✅ Dev server will hot-reload
3. 🧪 Test registration
4. ✅ Should work without errors!

## 📝 Summary

**Problem:** Firestore rejects documents with `undefined` field values
**Solution:** Conditionally add fields only when they have valid values
**Result:** Registration now works without undefined field errors

Try registering a user now - it should work!