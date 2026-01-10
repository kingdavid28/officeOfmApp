import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from './auth';

export const createMissingUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No authenticated user');
    return;
  }

  // Check if profile already exists
  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  if (profileDoc.exists()) {
    console.log('Profile already exists');
    return;
  }

  // Create admin profile for current user
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    role: 'super_admin', // Set as super_admin
    name: user.displayName || 'Administrator',
    createdAt: new Date(),
    lastLogin: new Date()
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  console.log('User profile created successfully');
};