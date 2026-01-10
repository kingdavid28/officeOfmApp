import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// This would be a Firebase Cloud Function to create users without signing them in
export const createUserServerSide = httpsCallable(functions, 'createUser');

// Alternative client-side method that handles auth state properly
export const createUserClientSide = async (email: string, password: string, name: string, role: string, createdBy: string) => {
  // Store current auth state
  const currentUser = auth.currentUser;
  
  try {
    // Create user
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create profile
    const profile = {
      uid: result.user.uid,
      email,
      role,
      name,
      createdAt: new Date(),
      lastLogin: new Date(),
      approvedBy: createdBy,
      approvedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', result.user.uid), profile);
    
    // Sign out new user immediately
    await signOut(auth);
    
    return { success: true, userId: result.user.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};