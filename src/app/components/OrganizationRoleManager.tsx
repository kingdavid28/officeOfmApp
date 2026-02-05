import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, UserPlus, Shield, ShieldCheck, User, X, Edit2, Trash2, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    OrganizationMember,
    OrganizationRole,
    assignUserToOrganization,
    removeUserFromOrganization,
    updateUserRole,
    getOrganizationMembers,
    getOrganizationAdmin,
    getOrganizationViceAdmin,
    getOrganizationStaff,
    canManageOrganization,
    getDefaultPermissions
} from '../../lib/organization-roles';
import { authService, UserProfile } from '../../lib/auth';

interface OrganizationRoleManagerProps {
    organizationId: string;
    organizationName: string;
    organizationType: string;
}

export function OrganizationRoleManager({
    organizationId,
    organizationName,
    organizationType
}: OrganizationRoleManagerProps) {
    const { user, userProfile } = useAuth();

    const [admin, setAdmin] = useState<OrganizationMember | null>(null);
    const [viceAdmin, setViceAdmin] = useState<OrganizationMember | null>(null);
    const [staff, setStaff] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [canManage, setCanManage] = useState(false);

    // Add member modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<OrganizationRole>('org_staff');
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadMembers();
        checkManagePermission();
    }, [organizationId, user?.uid]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const [adminData, viceAdminData, staffData] = await Promise.all([
                getOrganizationAdmin(organizationId),
                getOrganizationViceAdmin(organizationId),
                getOrganizationStaff(organizationId)
            ]);

            setAdmin(adminData);
            setViceAdmin(viceAdminData);
            setStaff(staffData);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkManagePermission = async () => {
        if (!user?.uid) return;
        const hasPermission = await canManageOrganization(organizationId, user.uid);
        setCanManage(hasPermission);
    };

    const loadAvailableUsers = async () => {
        try {
            const allUsers = await authService.getAllUsers();
            // Filter out users already in this organization
            const existingUserIds = [
                admin?.userId,
                viceAdmin?.userId,
                ...staff.map(s => s.userId)
            ].filter(Boolean);

            const available = allUsers.filter(u => !existingUserIds.includes(u.uid));
            setAvailableUsers(available);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUser || !user || adding) return;

        setAdding(true);
        try {
            const selectedUserData = availableUsers.find(u => u.uid === selectedUser);
            if (!selectedUserData) {
                throw new Error('Selected user not found');
            }

            await assignUserToOrganization(
                organizationId,
                organizationName,
                organizationType,
                selectedUserData.uid,
                selectedUserData.name,
                selectedUserData.email,
                selectedRole,
                user.uid
            );

            await loadMembers();
            setShowAddModal(false);
            setSelectedUser(null);
            setUserSearchTerm('');
            alert('Member added successfully!');
        } catch (error) {
            console.error('Failed to add member:', error);
            alert(error instanceof Error ? error.message : 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (!user) return;

        if (!confirm(`Remove ${userName} from this organization?`)) return;

        try {
            await removeUserFromOrganization(organizationId, userId, user.uid);
            await loadMembers();
            alert('Member removed successfully!');
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove member');
        }
    };

    const handleChangeRole = async (userId: string, userName: string, currentRole: OrganizationRole) => {
        if (!user) return;

        const newRole = prompt(
            `Change role for ${userName}\n\nCurrent: ${getRoleDisplay(currentRole)}\n\nEnter new role:\n1 = Admin\n2 = Vice Admin\n3 = Staff\n4 = Viewer`,
            currentRole === 'org_admin' ? '1' : currentRole === 'org_vice_admin' ? '2' : currentRole === 'org_staff' ? '3' : '4'
        );

        if (!newRole) return;

        const roleMap: { [key: string]: OrganizationRole } = {
            '1': 'org_admin',
            '2': 'org_vice_admin',
            '3': 'org_staff',
            '4': 'org_viewer'
        };

        const selectedNewRole = roleMap[newRole];
        if (!selectedNewRole) {
            alert('Invalid role selection');
            return;
        }

        try {
            await updateUserRole(organizationId, userId, selectedNewRole, user.uid);
            await loadMembers();
            alert('Role updated successfully!');
        } catch (error) {
            console.error('Failed to update role:', error);
            alert(error instanceof Error ? error.message : 'Failed to update role');
        }
    };

    const getRoleDisplay = (role: OrganizationRole): string => {
        const displays: Record<OrganizationRole, string> = {
            org_admin: 'Administrator',
            org_vice_admin: 'Vice Administrator',
            org_staff: 'Staff',
            org_viewer: 'Viewer'
        };
        return displays[role];
    };

    const getRoleIcon = (role: OrganizationRole) => {
        switch (role) {
            case 'org_admin':
                return <Shield className="w-4 h-4 text-blue-600" />;
            case 'org_vice_admin':
                return <ShieldCheck className="w-4 h-4 text-green-600" />;
            case 'org_staff':
                return <User className="w-4 h-4 text-gray-600" />;
            case 'org_viewer':
                return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRoleBadgeColor = (role: OrganizationRole): string => {
        switch (role) {
            case 'org_admin':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'org_vice_admin':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'org_staff':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'org_viewer':
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Organization Members
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage roles and permissions for {organizationName}
                            </p>
                        </div>
                        {canManage && (
                            <Button
                                onClick={() => {
                                    loadAvailableUsers();
                                    setShowAddModal(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <UserPlus size={16} />
                                Add Member
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Administrator */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Administrator
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {admin ? (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {admin.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{admin.userName}</p>
                                    <p className="text-sm text-gray-600">{admin.userEmail}</p>
                                </div>
                            </div>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangeRole(admin.userId, admin.userName, admin.role)}
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveMember(admin.userId, admin.userName)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Shield size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No administrator assigned</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Vice Administrator */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        Vice Administrator
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {viceAdmin ? (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {viceAdmin.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{viceAdmin.userName}</p>
                                    <p className="text-sm text-gray-600">{viceAdmin.userEmail}</p>
                                </div>
                            </div>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleChangeRole(viceAdmin.userId, viceAdmin.userName, viceAdmin.role)}
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveMember(viceAdmin.userId, viceAdmin.userName)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ShieldCheck size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No vice administrator assigned</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Staff Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        Staff Members ({staff.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {staff.length > 0 ? (
                        <div className="space-y-2">
                            {staff.map((member) => (
                                <div
                                    key={member.userId}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {member.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.userName}</p>
                                            <p className="text-sm text-gray-600">{member.userEmail}</p>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleChangeRole(member.userId, member.userName, member.role)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.userId, member.userName)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No staff members assigned</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h3 className="text-xl font-semibold">Add Member</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Assign a user to {organizationName}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedUser(null);
                                    setUserSearchTerm('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Role
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['org_admin', 'org_vice_admin', 'org_staff', 'org_viewer'] as OrganizationRole[]).map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`p-3 rounded-lg border-2 transition-all ${selectedRole === role
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {getRoleIcon(role)}
                                                <span className="text-sm font-medium">{getRoleDisplay(role)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User
                                </label>
                                <div className="relative mb-3">
                                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users size={32} className="mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">No users available</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredUsers.map((user) => (
                                                <div
                                                    key={user.uid}
                                                    onClick={() => setSelectedUser(user.uid)}
                                                    className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${selectedUser === user.uid
                                                            ? 'bg-blue-50'
                                                            : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${selectedUser === user.uid ? 'bg-blue-600' : 'bg-gray-400'
                                                        }`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                    {selectedUser === user.uid && (
                                                        <Check size={20} className="text-blue-600" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedUser(null);
                                    setUserSearchTerm('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddMember}
                                disabled={!selectedUser || adding}
                            >
                                {adding ? 'Adding...' : 'Add Member'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
