import React, { useState, useEffect } from 'react';
import { authService } from '../../lib/auth';
import { PendingUser } from '../../lib/types';

interface SuperAdminPanelProps {
  currentUserUid: string;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ currentUserUid }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await authService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pendingUserId: string) => {
    const password = prompt('Enter password for new user:');
    if (!password) return;

    setProcessingId(pendingUserId);
    try {
      await authService.approveUser(pendingUserId, password, currentUserUid);
      await loadPendingUsers();
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (pendingUserId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessingId(pendingUserId);
    try {
      await authService.rejectUser(pendingUserId, reason, currentUserUid);
      await loadPendingUsers();
      alert('User rejected');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Super Admin Panel</h2>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Pending User Approvals</h3>
        </div>
        
        {pendingUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending user requests
          </div>
        ) : (
          <div className="divide-y">
            {pendingUsers.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-sm text-gray-500">Role: {user.role}</div>
                  <div className="text-sm text-gray-500">
                    Requested: {user.requestedAt.toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={processingId === user.id}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId === user.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={processingId === user.id}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};