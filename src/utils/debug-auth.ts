import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const debugAuthState = async () => {
  const user = auth.currentUser;
  console.log('Current user:', user?.uid, user?.email);
  
  if (user) {
    try {
      const profileDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('User profile exists:', profileDoc.exists());
      if (profileDoc.exists()) {
        console.log('User profile data:', profileDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }
};