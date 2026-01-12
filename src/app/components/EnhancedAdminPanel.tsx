import React, { useState, useEffect } from 'react';
import { authService, UserProfile, UserRole, UserStatus, AuditLogEntry } from '../../lib/enhanced-auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EditProfileModal } from './EditProfileModal';
import { Shield, UserPlus, Users, History, Settings, Mail, Key } from 'lucide-react';

interface EnhancedAdminPanelProps {
  currentUserUid: string;
  userRole: 'admin' | 'super_admin';
}

export const EnhancedAdminPanel: React.FC<EnhancedAdminPanelProps> = ({ currentUserUid, userRole }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    email: '', name: '', password: '', role: 'staff' as UserRole
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, auditData, currentProfile] = await Promise.all([
        authService.getAllUsers(),
        authService.getAuditLogs(100),
        authService.getUserProfile(currentUserUid)
      ]);
      setUsers(usersData);
      setAuditLogs(auditData);
      setCurrentUserProfile(currentProfile);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createUser(
        createUserData.email,
        createUserData.password,
        createUserData.name,
        createUserData.role,
        currentUserUid
      );
      setCreateUserData({ email: '', name: '', password: '', role: 'staff' });
      setShowCreateForm(false);
      await loadData();
      alert('User created successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(userId, newRole, currentUserUid);
      await loadData();
      alert('Role updated successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await authService.updateUserStatus(userId, newStatus, currentUserUid);
      await loadData();
      alert('Status updated successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await authService.resetUserPassword(email, currentUserUid);
      alert('Password reset email sent');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'disabled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading || !currentUserProfile) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
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

        <div className="flex items-center gap-2">
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

          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      required
                      value={createUserData.name}
                      onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={createUserData.password}
                      onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={createUserData.role} onValueChange={(value: UserRole) => setCreateUserData({ ...createUserData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create User</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.role !== 'super_admin' && (
                          <>
                            <Select
                              value={user.role}
                              onValueChange={(value: UserRole) => handleRoleChange(user.uid, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={user.status}
                              onValueChange={(value: UserStatus) => handleStatusChange(user.uid, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePasswordReset(user.email)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{log.action.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.targetUserEmail && `Target: ${log.targetUserEmail}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          By: {log.performedByEmail} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
    </div>
  );
};