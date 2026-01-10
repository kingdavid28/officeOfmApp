import React, { useState, useEffect } from 'react';
import { authService, UserProfile } from '../../lib/auth';
import { organizationService } from '../../lib/organization-service';
import { PendingOrganization } from '../../lib/organization-types';
import { PendingUser } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EditUserRoleModal } from './EditUserRoleModal';
import { Edit3 } from 'lucide-react';
import { debugAuthState } from '../../utils/debug-auth';

interface RealAdminPanelProps {
  currentUserUid: string;
  userRole: 'admin' | 'super_admin';
}

export const RealAdminPanel: React.FC<RealAdminPanelProps> = ({ currentUserUid, userRole }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'create'>('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff' as 'admin' | 'staff'
  });
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Debug authentication state
      await debugAuthState();

      // Check if user has admin privileges before loading data
      if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
        console.error('Insufficient privileges for admin panel');
        return;
      }

      // Verify user profile exists before making admin calls
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.error('No authenticated user found');
        return;
      }

      const userProfile = await authService.getUserProfile(currentUser.uid);
      if (!userProfile) {
        console.error('User profile not found in Firestore');
        alert('User profile not found. Please contact administrator.');
        return;
      }

      console.log('User profile verified:', userProfile.role);

      const [users, orgs, allUsersData] = await Promise.all([
        authService.getPendingUsers().catch(err => {
          console.error('Error loading pending users:', err);
          return [];
        }),
        organizationService.getPendingOrganizations().catch(err => {
          console.error('Error loading pending organizations:', err);
          return [];
        }),
        authService.getAllUsers().catch(err => {
          console.error('Error loading all users:', err);
          return [];
        })
      ]);

      setPendingUsers(users);
      setPendingOrgs(orgs);
      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (pendingUserId: string) => {
    const pendingUser = pendingUsers.find(u => u.id === pendingUserId);
    if (!pendingUser) return;

    try {
      if (pendingUser.authProvider === 'google') {
        await authService.approveGoogleUser(pendingUserId, currentUserUid);
        alert('Google user approved successfully. They can now sign in with their Google account.');
      } else {
        const password = prompt('Enter password for new user:');
        if (!password) return;
        await authService.approveUser(pendingUserId, password, currentUserUid);
        alert('User approved successfully. They can now sign in with their email and the password you set.');
      }
      await loadData();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  };

  const handleRejectUser = async (pendingUserId: string) => {
    const reason = prompt('Enter rejection reason (optional):');

    try {
      await authService.rejectUser(pendingUserId, reason || 'Request denied', currentUserUid);
      alert('User request rejected');
      await loadData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Ensure we have a valid current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      // Use Firebase Auth directly instead of API service
      await authService.createUser(
        createUserData.email,
        createUserData.password,
        createUserData.name,
        createUserData.role,
        currentUser.uid
      );

      setCreateUserData({ email: '', name: '', password: '', role: 'staff' });
      setShowCreateForm(false);

      alert('User created successfully. Admin needs to sign in again.');
      await loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating user: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      // Ensure we have a valid current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      await authService.deleteUser(userId, currentUser.uid);
      alert('User deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleEditUserRole = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleRoleUpdate = async (userId: string, newRole: any) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      await authService.updateUserRole(userId, newRole, currentUser.uid);
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  if (loading) return <div>Loading admin panel...</div>;

  // Function to render tab content
  const renderTabContent = () => {
    if (activeTab === 'users') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals ({pendingUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-muted-foreground">No pending user requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user, index) => (
                    <div key={user.id || `pending-user-${index}-${user.email}`} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          {user.authProvider && (
                            <Badge variant="secondary">
                              {user.authProvider === 'google' ? '🔍 Google' : '📧 Email'}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Requested: {new Date(user.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(user.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({allUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user, index) => (
                  <div key={user.uid || `user-${index}-${user.email}`} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {/* Super admin roles cannot be edited for security reasons */}
                      {user.role !== 'super_admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUserRole(user)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      )}
                      {user.role === 'super_admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Super admin roles cannot be modified for security reasons"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Protected
                        </Button>
                      )}
                      {user.role !== 'super_admin' && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.uid)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (activeTab === 'organizations') {
      return (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pending Organizations ({pendingOrgs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrgs.length === 0 ? (
                <p className="text-muted-foreground">No pending organization requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingOrgs.map((org, index) => (
                    <div key={org.id || `pending-org-${index}-${org.email}`} className="p-4 border rounded">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-muted-foreground">{org.email}</div>
                      <div className="text-sm text-muted-foreground">Contact: {org.contactPerson}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else if (activeTab === 'create') {
      return (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Create a new user account with email and password authentication.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create New User
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <input
                        type="text"
                        required
                        value={createUserData.name}
                        onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input
                        type="email"
                        required
                        value={createUserData.email}
                        onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <input
                        type="password"
                        required
                        value={createUserData.password}
                        onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <select
                        value={createUserData.role}
                        onChange={(e) => setCreateUserData({ ...createUserData, role: e.target.value as 'admin' | 'staff' })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="staff">Staff Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCreateUserData({ email: '', name: '', password: '', role: 'staff' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {userRole === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
        </h2>
        <p className="text-muted-foreground">
          Manage users and system settings
        </p>
      </div>

      <div className="flex space-x-4 border-b">
        {[
          { id: 'users', label: 'User Management' },
          { id: 'organizations', label: 'Organizations' },
          { id: 'create', label: 'Create User' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'organizations' | 'create')}
            className={`px-4 py-2 ${activeTab === tab.id ? 'border-b-2 border-blue-500' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single renderTabContent call - returns only one element */}
      {renderTabContent()}

      {/* Edit User Role Modal */}
      {editingUser && (
        <EditUserRoleModal
          isOpen={showEditModal}
          user={editingUser}
          currentUserRole={userRole}
          onRoleUpdate={handleRoleUpdate}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};