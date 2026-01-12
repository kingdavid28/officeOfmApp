import React, { useState, useEffect } from 'react';
import { authService, UserProfile } from '../../lib/auth';
import { PendingUser } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EditUserRoleModal } from './EditUserRoleModal';
import { EditProfileModal } from './EditProfileModal';
import { Edit3, Settings } from 'lucide-react';
import { debugAuthState } from '../../utils/debug-auth';

interface RealAdminPanelProps {
  currentUserUid: string;
  userRole: 'admin' | 'super_admin';
}

export const RealAdminPanel: React.FC<RealAdminPanelProps> = ({ currentUserUid, userRole }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff' as 'admin' | 'staff' | 'super_admin'
  });
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

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
      setCurrentUserProfile(userProfile);

      // Load data based on user role
      if (userRole === 'super_admin') {
        // Super admins see all pending users and all users
        const [users, visibleUsers, admins] = await Promise.all([
          authService.getPendingUsers().catch(err => {
            console.error('Error loading pending users:', err);
            return [];
          }),
          authService.getVisibleUsers(userRole).catch(err => {
            console.error('Error loading visible users:', err);
            return [];
          }),
          authService.getAdminUsers().catch(err => {
            console.error('Error loading admin users:', err);
            return [];
          })
        ]);

        setPendingUsers(users);
        setAllUsers(visibleUsers);
        setAdminUsers(admins);
      } else {
        // Regular admins see only their assigned staff and staff requests
        const [pendingForAdmin, staffForAdmin, allVisibleUsers, admins] = await Promise.all([
          authService.getPendingUsersForAdmin(currentUser.uid).catch(err => {
            console.error('Error loading pending users for admin:', err);
            return [];
          }),
          authService.getStaffForAdmin(currentUser.uid).catch(err => {
            console.error('Error loading staff for admin:', err);
            return [];
          }),
          authService.getVisibleUsers(userRole).catch(err => {
            console.error('Error loading visible users:', err);
            return [];
          }),
          authService.getAdminUsers().catch(err => {
            console.error('Error loading admin users:', err);
            return [];
          })
        ]);

        // For admins, show their pending requests and their assigned staff + other admins
        setPendingUsers(pendingForAdmin);

        // Combine their staff with other admins (but not super admins)
        const otherAdmins = allVisibleUsers.filter(user => user.role === 'admin');
        const combinedUsers = [...staffForAdmin, ...otherAdmins];
        setAllUsers(combinedUsers);
        setAdminUsers(admins);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (pendingUserId: string) => {
    // SECURITY: Admins can approve staff, Super admins can approve all roles
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      alert('Error: Only administrators and super administrators can approve user accounts');
      return;
    }

    const pendingUser = pendingUsers.find(u => u.id === pendingUserId);
    if (!pendingUser) return;

    // SECURITY: Regular admins can only approve staff accounts
    if (userRole === 'admin' && pendingUser.role !== 'staff') {
      alert('Error: Administrators can only approve staff accounts. Contact a super admin to approve administrator accounts.');
      return;
    }

    try {
      if (pendingUser.authProvider === 'google') {
        await authService.approveGoogleUser(pendingUserId, currentUserUid);
        const roleText = pendingUser.role === 'super_admin' ? 'Super Administrator' :
          pendingUser.role === 'admin' ? 'Administrator' : 'Staff Member';
        alert(`Google ${roleText} approved successfully. They can now sign in with their Google account.`);
      } else {
        const password = prompt('Enter password for new user:');
        if (!password) return;
        await authService.approveUser(pendingUserId, password, currentUserUid);
        const roleText = pendingUser.role === 'super_admin' ? 'Super Administrator' :
          pendingUser.role === 'admin' ? 'Administrator' : 'Staff Member';
        alert(`${roleText} approved successfully. They can now sign in with their email and the password you set.`);
      }
      await loadData();
    } catch (error) {
      console.error('Error approving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error approving user: ${errorMessage}`);
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
      // SECURITY: Admins can create staff, Super admins can create all roles
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        throw new Error('Only administrators and super administrators can create user accounts');
      }

      // SECURITY: Regular admins can only create staff accounts
      if (userRole === 'admin' && createUserData.role !== 'staff') {
        throw new Error('Administrators can only create staff accounts. Contact a super admin to create administrator accounts.');
      }

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

      const roleText = createUserData.role === 'super_admin' ? 'Super Administrator' :
        createUserData.role === 'admin' ? 'Administrator' : 'Staff Member';

      alert(`${roleText} account created successfully. Admin needs to sign in again.`);
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
    // SECURITY: Additional check to prevent regular admins from deleting super admin accounts
    const targetUser = allUsers.find(u => u.uid === userId);
    if (targetUser?.role === 'super_admin' && userRole !== 'super_admin') {
      alert('Error: Insufficient privileges to delete super administrator accounts');
      return;
    }

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
    // SECURITY: Check if user can edit this profile
    const canEdit = userRole === 'super_admin' ||
      (userRole === 'admin' && (user.role === 'staff' || user.uid === currentUserUid));

    if (!canEdit) {
      alert('Error: You can only edit staff profiles and your own profile.');
      return;
    }

    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleRoleUpdate = async (userId: string, newRole: any) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found. Please sign in again.');
      }

      // SECURITY: Additional check to prevent regular admins from modifying super admin accounts
      // This should never happen due to UI filtering, but adding as defense in depth
      const targetUser = allUsers.find(u => u.uid === userId);
      if (targetUser?.role === 'super_admin' && userRole !== 'super_admin') {
        throw new Error('Insufficient privileges to modify super administrator accounts');
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

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setCurrentUserProfile(updatedProfile);
    // Optionally reload data to reflect changes
    loadData();
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
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );

  // Function to render tab content
  const renderTabContent = () => {
    if (activeTab === 'users') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals ({pendingUsers.length})</CardTitle>
              {userRole === 'admin' && (
                <p className="text-sm text-muted-foreground">
                  As an admin, you can approve staff requests. Super admin requests require super admin approval.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {userRole !== 'admin' && userRole !== 'super_admin' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">ℹ️</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800 mb-1">Admin Required</h3>
                      <p className="text-sm text-blue-700">
                        User approval requires administrator privileges. Contact an admin to approve pending requests.
                      </p>
                      {pendingUsers.length > 0 && (
                        <p className="text-sm text-blue-700 mt-2">
                          <strong>{pendingUsers.length}</strong> user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : pendingUsers.length === 0 ? (
                <p className="text-muted-foreground">No pending user requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user, index) => {
                    const canApprove = userRole === 'super_admin' || (userRole === 'admin' && user.role === 'staff');

                    // Find requested admin for staff requests
                    const requestedAdmin = user.role === 'staff' && user.requestedAdminId
                      ? adminUsers.find(admin => admin.uid === user.requestedAdminId)
                      : null;

                    // Check if this request is for current admin
                    const isRequestForMe = user.role === 'staff' && user.requestedAdminId === currentUserUid;

                    return (
                      <div key={user.id || `pending-user-${index}-${user.email}`}
                        className={`flex items-center justify-between p-4 border rounded transition-all ${isRequestForMe ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                          }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{user.name}</div>
                            {isRequestForMe && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📩 For You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Staff Member'}
                            </Badge>

                            {user.authProvider && (
                              <Badge variant="secondary">
                                {user.authProvider === 'google' ? '🔍 Google' : '📧 Email'}
                              </Badge>
                            )}

                            {/* Admin assignment indicator for staff requests */}
                            {user.role === 'staff' && requestedAdmin && (
                              <Badge variant="outline" className="text-xs">
                                🎯 Wants to work under: {requestedAdmin.name}
                              </Badge>
                            )}

                            {user.role === 'staff' && !requestedAdmin && user.requestedAdminId && (
                              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                                ⚠️ Admin not found
                              </Badge>
                            )}

                            <span className="text-xs text-muted-foreground">
                              Requested: {new Date(user.requestedAt).toLocaleDateString()}
                            </span>

                            {!canApprove && (
                              <Badge variant="outline" className="text-xs">
                                Requires Super Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            disabled={!canApprove}
                            title={!canApprove ? 'Only super admins can approve admin/super admin requests' : ''}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Assignment Overview for Super Admins */}
          {userRole === 'super_admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Staff Assignment Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of staff assignments across all administrators
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminUsers.map((admin) => {
                    const assignedStaff = allUsers.filter(u => u.role === 'staff' && u.assignedAdminId === admin.uid);
                    return (
                      <div key={admin.uid} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">👤</span>
                          </div>
                          <div>
                            <h3 className="font-medium">{admin.name}</h3>
                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Assigned Staff:</span>
                            <Badge variant="outline">{assignedStaff.length}</Badge>
                          </div>
                          {assignedStaff.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {assignedStaff.slice(0, 3).map(staff => staff.name).join(', ')}
                              {assignedStaff.length > 3 && ` +${assignedStaff.length - 3} more`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Unassigned staff summary */}
                  {(() => {
                    const unassignedStaff = allUsers.filter(u => u.role === 'staff' && !u.assignedAdminId);
                    return unassignedStaff.length > 0 && (
                      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 text-sm">⚠️</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-yellow-800">Unassigned Staff</h3>
                            <p className="text-xs text-yellow-600">Need admin assignment</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-700">Count:</span>
                            <Badge variant="outline" className="border-yellow-300">{unassignedStaff.length}</Badge>
                          </div>
                          {unassignedStaff.length > 0 && (
                            <div className="text-xs text-yellow-600">
                              {unassignedStaff.slice(0, 3).map(staff => staff.name).join(', ')}
                              {unassignedStaff.length > 3 && ` +${unassignedStaff.length - 3} more`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Users ({allUsers.length})</CardTitle>
              {userRole === 'admin' && (
                <div className="text-sm text-muted-foreground">
                  <p>You can see your assigned staff and other administrators.</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                      Your Staff ({allUsers.filter(u => u.role === 'staff' && u.assignedAdminId === currentUserUid).length})
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                      Unassigned Staff ({allUsers.filter(u => u.role === 'staff' && !u.assignedAdminId).length})
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user, index) => {
                  // SECURITY: Determine what actions current user can perform
                  const canEdit = userRole === 'super_admin' ||
                    (userRole === 'admin' && (user.role === 'staff' || user.uid === currentUserUid));
                  const canDelete = userRole === 'super_admin' ||
                    (userRole === 'admin' && user.role === 'staff' && user.uid !== currentUserUid);

                  // Find assigned admin for staff members
                  const assignedAdmin = user.role === 'staff' && user.assignedAdminId
                    ? adminUsers.find(admin => admin.uid === user.assignedAdminId)
                    : null;

                  // Check if this staff member belongs to current admin
                  const isMyStaff = user.role === 'staff' && user.assignedAdminId === currentUserUid;
                  const isUnassignedStaff = user.role === 'staff' && !user.assignedAdminId;

                  return (
                    <div key={user.uid || `user-${index}-${user.email}`}
                      className={`flex items-center justify-between p-4 border rounded transition-all ${isMyStaff ? 'border-green-200 bg-green-50' :
                        isUnassignedStaff ? 'border-yellow-200 bg-yellow-50' :
                          'border-gray-200'
                        }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {user.name}
                            {user.uid === currentUserUid && (
                              <span className="text-xs text-blue-600 ml-2">(You)</span>
                            )}
                          </div>

                          {/* Visual indicators for staff assignment */}
                          {isMyStaff && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              👥 Your Staff
                            </span>
                          )}
                          {isUnassignedStaff && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⚠️ Unassigned
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">{user.email}</div>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'Staff Member'}
                          </Badge>

                          {/* Admin assignment indicator for staff */}
                          {user.role === 'staff' && assignedAdmin && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">→</span>
                              <Badge variant="outline" className="text-xs">
                                📋 Reports to: {assignedAdmin.name}
                              </Badge>
                            </div>
                          )}

                          {/* Unassigned staff indicator */}
                          {isUnassignedStaff && (
                            <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                              🔄 Needs Assignment
                            </Badge>
                          )}

                          {/* Staff count for admins */}
                          {user.role === 'admin' && (
                            <Badge variant="outline" className="text-xs">
                              👥 {allUsers.filter(u => u.role === 'staff' && u.assignedAdminId === user.uid).length} Staff
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Edit permissions based on role hierarchy */}
                        {canEdit && user.role !== 'super_admin' && (
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
                        {!canEdit && user.role !== 'super_admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={userRole === 'admin' ? 'You can only edit staff profiles and your own profile' : 'Insufficient privileges'}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Restricted
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.uid)}>
                            Delete
                          </Button>
                        )}
                        {!canDelete && user.role !== 'super_admin' && user.uid !== currentUserUid && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled
                            title={userRole === 'admin' ? 'You can only delete staff accounts' : 'Insufficient privileges'}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (activeTab === 'create') {
      // SECURITY: Admins can create staff, Super admins can create all roles
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">🔒</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-red-800 mb-1">Admin Privileges Required</h3>
                        <p className="text-sm text-red-700">
                          Only administrators and super administrators can create user accounts.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    If you need to create a user account, please contact an administrator.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <p className="text-sm text-muted-foreground">
                {userRole === 'super_admin'
                  ? 'Super Admin Privilege - Create accounts with any role'
                  : 'Admin Privilege - Create staff accounts'
                }
              </p>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <div className="space-y-4">
                  {userRole === 'super_admin' ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">👑</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-800 mb-1">Super Admin Privileges</h3>
                          <p className="text-sm text-blue-700">
                            As a super administrator, you can create accounts with any role including other super admins and administrators.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">⚡</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-green-800 mb-1">Admin Privileges</h3>
                          <p className="text-sm text-green-700">
                            As an administrator, you can create staff member accounts. Contact a super admin to create administrator accounts.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                        onChange={(e) => setCreateUserData({ ...createUserData, role: e.target.value as 'admin' | 'staff' | 'super_admin' })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="staff">Staff Member</option>
                        {userRole === 'super_admin' && (
                          <>
                            <option value="admin">Administrator</option>
                            <option value="super_admin">Super Administrator</option>
                          </>
                        )}
                      </select>
                      {userRole === 'admin' && (
                        <p className="text-xs text-muted-foreground">
                          As an admin, you can only create staff accounts. Contact a super admin to create administrator accounts.
                        </p>
                      )}
                    </div>
                  </div>

                  {createUserData.role === 'super_admin' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-xs">⚠️</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-yellow-800 mb-1">Creating Super Administrator</h3>
                          <p className="text-sm text-yellow-700">
                            You are creating another super administrator account. This user will have complete system access including the ability to manage other super admins.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {createUserData.role === 'admin' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xs">🛡️</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-purple-800 mb-1">Creating Administrator</h3>
                          <p className="text-sm text-purple-700">
                            You are creating an administrator account. This user will be able to manage staff accounts and create new staff members.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {userRole === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
            {currentUserProfile && (
              <span className="text-lg font-medium text-gray-600 ml-2">
                - {currentUserProfile.name}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {currentUserProfile ? (
              <>
                Welcome back, <span className="font-medium">{currentUserProfile.name}</span> ({currentUserProfile.email}) •
                Manage users and system settings
              </>
            ) : (
              'Manage users and system settings'
            )}
          </p>
        </div>

        {currentUserProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="flex space-x-4 border-b">
        {[
          { id: 'users', label: 'User Management' },
          ...(userRole === 'admin' || userRole === 'super_admin' ? [{ id: 'create', label: 'Create User' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'create')}
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