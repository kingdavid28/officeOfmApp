# Firebase Storage Best Practices & CORS Solutions

## Root Cause Analysis

The CORS error you encountered happens because:
- Firebase Storage has strict CORS policies
- Local development (localhost:5174) isn't in Firebase's allowed origins
- Authentication tokens might not be properly attached to requests

## Best Practices Solutions

### 1. Environment-Specific Configuration

```typescript
// src/lib/firebase-config.ts
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const firebaseConfig = {
  // Use different projects for dev/prod if needed
  projectId: isDevelopment ? 'your-dev-project' : 'your-prod-project',
  storageBucket: isDevelopment ? 'your-dev-bucket' : 'your-prod-bucket',
  // ... other config
};
```

### 2. Firebase Storage Rules Best Practices

```javascript
// storage.rules - Production Ready
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Organized by user and access level
    match /users/{userId}/{category}/{fileName} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || hasAdminRole());
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidFileType() &&
        isValidFileSize();
      allow delete: if request.auth != null && 
        (request.auth.uid == userId || hasAdminRole());
    }
    
    // Shared organizational files
    match /organization/{category}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && hasStaffRole();
      allow delete: if request.auth != null && hasAdminRole();
    }
    
    // Helper functions
    function hasAdminRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
    
    function hasStaffRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['staff', 'admin', 'super_admin'];
    }
    
    function isValidFileType() {
      return request.resource.contentType.matches('application/pdf') ||
             request.resource.contentType.matches('application/vnd.ms-excel') ||
             request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.*') ||
             request.resource.contentType.matches('image/.*') ||
             request.resource.contentType.matches('text/.*');
    }
    
    function isValidFileSize() {
      return request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
  }
}
```

### 3. Proper Authentication Flow

```typescript
// src/lib/firebase-storage-service.ts
export class FirebaseStorageService {
  
  static async uploadFile(file: File, category: string): Promise<UploadResult> {
    // 1. Ensure user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // 2. Wait for auth token to be ready
    await user.getIdToken(true); // Force refresh

    // 3. Validate file before upload
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 4. Use proper path structure
    const path = `users/${user.uid}/${category}/${Date.now()}_${file.name}`;
    
    // 5. Upload with proper error handling
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
          },
          (error) => {
            // Specific error handling
            if (error.code === 'storage/unauthorized') {
              reject(new Error('Upload unauthorized. Check your permissions.'));
            } else if (error.code === 'storage/canceled') {
              reject(new Error('Upload was canceled.'));
            } else {
              reject(error);
            }
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ success: true, url: downloadURL });
          }
        );
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}
```

### 4. Development vs Production Strategy

```typescript
// src/lib/storage-strategy.ts
export class StorageStrategy {
  
  static async uploadFile(file: File, category: string): Promise<UploadResult> {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      // Development: Use Firebase Emulator or fallback
      return this.uploadToEmulator(file, category);
    } else {
      // Production: Use Firebase Storage
      return this.uploadToFirebaseStorage(file, category);
    }
  }
  
  private static async uploadToEmulator(file: File, category: string): Promise<UploadResult> {
    // Use Firebase Emulator Suite for development
    // Or implement a simple local storage solution
  }
  
  private static async uploadToFirebaseStorage(file: File, category: string): Promise<UploadResult> {
    // Production Firebase Storage upload
  }
}
```

### 5. Firebase Emulator Setup (Recommended for Development)

```json
// firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

```typescript
// src/lib/firebase.ts
import { connectStorageEmulator } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// Connect to emulator in development
if (import.meta.env.DEV && !storage._delegate._location) {
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### 6. Error Handling & User Experience

```typescript
export class FileUploadService {
  
  static async uploadWithRetry(file: File, category: string, maxRetries = 3): Promise<UploadResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadFile(file, category);
      } catch (error) {
        lastError = error;
        
        if (this.isRetryableError(error)) {
          console.log(`Upload attempt ${attempt} failed, retrying...`);
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        } else {
          // Non-retryable error, fail immediately
          throw error;
        }
      }
    }
    
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }
  
  private static isRetryableError(error: any): boolean {
    return error.code === 'storage/retry-limit-exceeded' ||
           error.code === 'storage/server-file-wrong-size' ||
           error.message.includes('network');
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 7. File Organization Best Practices

```typescript
// Organized file structure
const getStoragePath = (userId: string, category: string, fileName: string): string => {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Organize by year/month for better performance
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `users/${userId}/${category}/${year}/${month}/${timestamp}_${sanitizedName}`;
};
```

### 8. Security Best Practices

```typescript
// File validation
export const validateFile = (file: File): ValidationResult => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png'
  ];
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file name
  if (file.name.length > 255) {
    return { valid: false, error: 'File name too long' };
  }
  
  // Scan for malicious content (basic check)
  if (file.name.includes('../') || file.name.includes('..\\')) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  return { valid: true };
};
```

## Recommended Solution for Your Project

1. **Immediate Fix**: Use Firebase Emulator Suite for development
2. **Production**: Deploy to Firebase Hosting (eliminates CORS issues)
3. **Fallback**: Keep the data URL fallback for emergency cases
4. **Long-term**: Implement proper file organization and security rules

## Commands to Set Up Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

This approach gives you a proper development environment that mirrors production behavior without CORS issues.