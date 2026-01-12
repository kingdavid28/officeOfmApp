import React, { useState, useEffect } from 'react';
import { authService } from '../../lib/auth';
import { PendingUser } from '../../lib/types';
import { EditProfileModal } from './EditProfileModal';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface SuperAdminPanelProps {
  currentUserUid: string;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ currentUserUid }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const [users, currentProfile] = await Promise.all([
        authService.getPendingUsers(),
        authService.getUserProfile(currentUserUid)
      ]);
      setPendingUsers(users);
      setCurrentUserProfile(currentProfile);
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

  const handleProfileUpdate = (updatedProfile: any) => {
    setCurrentUserProfile(updatedProfile);
    // Optionally reload data to reflect changes
    loadPendingUsers();
  };

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleCloseEditProfileModal = () => {
    setShowEditProfileModal(false);
  };

  if (loading || !currentUserProfile) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading super admin panel...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Super Admin Panel
          {currentUserProfile && (
            <span className="text-lg font-medium text-gray-600 ml-2">
              - {currentUserProfile.name}
            </span>
          )}
        </h2>
        <p className="text-muted-foreground mt-1">
          {currentUserProfile ? (
            <>
              Welcome back, <span className="font-medium">{currentUserProfile.name}</span> ({currentUserProfile.email}) •
              Manage all users and system settings
            </>
          ) : (
            'Manage all users and system settings'
          )}
        </p>
      </div>

      {currentUserProfile && (
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      )}

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

      {/* Edit Profile Modal */}
      {currentUserProfile && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          userProfile={currentUserProfile}
          onProfileUpdate={handleProfileUpdate}
          onClose={handleCloseEditProfileModal}
        />
      )}
    </div>
  );
};