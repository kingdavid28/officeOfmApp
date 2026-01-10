import React from 'react';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const GoogleSignInTest: React.FC = () => {
  const testGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user);
      alert(`Signed in as: ${result.user.email}`);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded mb-4">
      <h3 className="text-lg font-semibold mb-2">Google Auth Test</h3>
      <button
        onClick={testGoogleSignIn}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Google Sign-In
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Click to test Google authentication setup
      </p>
    </div>
  );
};