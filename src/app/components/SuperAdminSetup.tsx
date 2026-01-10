import React, { useState } from 'react';
import { authService } from '../../lib/auth';

export const SuperAdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const initializeSuperAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await authService.initializeSuperAdmin();
      if (result) {
        setMessage('Super admin created successfully! You can now sign in.');
      } else {
        setMessage('Super admin already exists.');
      }
    } catch (error: any) {
      console.error('Error initializing super admin:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-yellow-200 rounded mb-4 bg-yellow-50">
      <h3 className="text-lg font-semibold mb-2">Super Admin Setup</h3>
      <button
        onClick={initializeSuperAdmin}
        disabled={loading}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Initialize Super Admin'}
      </button>
      {message && (
        <p className="text-sm mt-2 text-yellow-800">{message}</p>
      )}
      <p className="text-xs text-yellow-700 mt-1">
        Email: reycelrcentino@gmail.com | Password: SuperAdmin123!
      </p>
    </div>
  );
};