import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Edit, Trash2, X, Save, Users, Shield, Search, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Friary, FriaryType, getFriaryTypeDisplay, canManageFriaries } from '../../lib/friary-types';
import { createFriary, updateFriary, deleteFriary } from '../../lib/friary-service';
import { assignUserToOrganization, getOrganizationAdmin } from '../../lib/organization-roles';
import { authService, UserProfile } from '../../lib/auth';
import { OrganizationRoleManager } from './OrganizationRoleManager';

interface FriaryManagementProps {
    friaries: Friary[];
    onRefresh: () => void;
}

interface FriaryFormData {
    name: string;
    location: string;
    type: FriaryType;
    guardianName: string;
    guardianUserId: string; // NEW: Link to actual user
    phone: string;
    email: string;
    established: string;
    ministries: string;
}

const emptyFormData: FriaryFormData = {
    name: '',
    location: '',
    type: 'friary',
    guardianName: '',
    guardianUserId: '', // NEW
    phone: '',
    email: '',
    established: '',
    ministries: ''
};

export function FriaryManagement({ friaries, onRefresh }: FriaryManagementProps) {
    const { userProfile, user } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FriaryFormData>(emptyFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // NEW: User selection for owner/admin
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // NEW: Role management view
    const [managingRolesFor, setManagingRolesFor] = useState<string | null>(null);

    // Check if user can manage friaries
    const canManage = userProfile && canManageFriaries(userProfile.role as any);

    // NEW: Load available users when needed
    useEffect(() => {
        if ((isAdding || editingId) && availableUsers.length === 0) {
            loadAvailableUsers();
        }
    }, [isAdding, editingId]);

    const loadAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const allUsers = await authService.getAllUsers();
            setAvailableUsers(allUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    if (!canManage) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                        You don't have permission to manage friaries.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Only Provincial Minister and Vice Provincial can manage communities.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // NEW: Show role management view
    if (managingRolesFor) {
        const friary = friaries.find(f => f.id === managingRolesFor);
        if (!friary) {
            setManagingRolesFor(null);
            return null;
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setManagingRolesFor(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Management
                    </button>
                </div>
                <OrganizationRoleManager
                    organizationId={friary.id}
                    organizationName={friary.name}
                    organizationType={friary.type}
                />
            </div>
        );
    }

    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    const selectedUser = formData.guardianUserId
        ? availableUsers.find(u => u.uid === formData.guardianUserId)
        : null;

    const handleInputChange = (field: keyof FriaryFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setError('Friary name is required');
            return false;
        }
        if (!formData.location.trim()) {
            setError('Location is required');
            return false;
        }
        return true;
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData(emptyFormData);
        setError(null);
    };

    const handleEdit = (friary: Friary) => {
        setEditingId(friary.id);
        setIsAdding(false);
        setFormData({
            name: friary.name,
            location: friary.location,
            type: friary.type,
            guardianName: friary.guardianName || '',
            guardianUserId: friary.guardian || '', // NEW: Load existing guardian user ID
            phone: friary.phone || '',
            email: friary.email || '',
            established: friary.established || '',
            ministries: friary.ministries?.join(', ') || ''
        });
        setError(null);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData(emptyFormData);
        setError(null);
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Build friary data, only including defined values
            const friaryData: any = {
                name: formData.name.trim(),
                location: formData.location.trim(),
                type: formData.type,
                guardian: formData.guardianUserId || '',
                members: []
            };

            // Only add optional fields if they have values
            if (formData.guardianName.trim()) {
                friaryData.guardianName = formData.guardianName.trim();
            }
            if (formData.phone.trim()) {
                friaryData.phone = formData.phone.trim();
            }
            if (formData.email.trim()) {
                friaryData.email = formData.email.trim();
            }
            if (formData.established.trim()) {
                friaryData.established = formData.established.trim();
            }
            if (formData.ministries.trim()) {
                friaryData.ministries = formData.ministries.split(',').map(m => m.trim()).filter(m => m);
            }

            let friaryId: string;

            if (editingId) {
                // Update existing friary
                await updateFriary(editingId, friaryData);
                friaryId = editingId;
            } else {
                // Create new friary
                friaryId = await createFriary(friaryData);
            }

            // NEW: Assign owner/admin role if guardian is selected
            if (formData.guardianUserId && formData.guardianName) {
                try {
                    const selectedUser = availableUsers.find(u => u.uid === formData.guardianUserId);
                    if (selectedUser) {
                        await assignUserToOrganization(
                            friaryId,
                            formData.name.trim(),
                            formData.type,
                            selectedUser.uid,
                            selectedUser.name,
                            selectedUser.email,
                            'org_admin', // Assign as admin (owner)
                            user.uid // Assigned by current user
                        );
                        console.log('✅ Owner assigned successfully');
                    }
                } catch (roleError) {
                    console.error('Failed to assign owner role:', roleError);
                    // Don't fail the whole operation if role assignment fails
                    setError('Organization created but failed to assign owner role. You can assign it later.');
                }
            }

            handleCancel();
            onRefresh();
        } catch (err) {
            console.error('Error saving friary:', err);
            setError('Failed to save friary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (friaryId: string, friaryName: string) => {
        if (!confirm(`Are you sure you want to delete "${friaryName}"? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await deleteFriary(friaryId);
            onRefresh();
        } catch (err) {
            console.error('Error deleting friary:', err);
            setError('Failed to delete friary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Friary Management</h2>
                    <p className="text-muted-foreground mt-1">
                        Add, edit, or remove communities
                    </p>
                </div>
                {!isAdding && !editingId && (
                    <Button onClick={handleAdd} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Community
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="py-4">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>
                            {editingId ? 'Edit Community' : 'Add New Community'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">
                                    Community Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., St. Francis Friary"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Location */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder="e.g., Cebu City, Cebu"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Type *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="friary">Friary</option>
                                    <option value="parish">Parish</option>
                                    <option value="school">School</option>
                                    <option value="formation_house">Formation House</option>
                                    <option value="retreat_center">Retreat Center</option>
                                </select>
                            </div>

                            {/* Guardian/Owner Selection - NEW ENHANCED VERSION */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">
                                    Owner/Guardian (Administrator) *
                                </label>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Select a user to be the owner/administrator of this organization. They will have full control.
                                </p>

                                {/* Selected User Display */}
                                {selectedUser ? (
                                    <div className="mb-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {selectedUser.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                                                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        <Shield className="w-3 h-3 inline mr-1" />
                                                        Will be assigned as Administrator
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleInputChange('guardianUserId', '');
                                                    handleInputChange('guardianName', '');
                                                }}
                                                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                                            >
                                                <X size={20} className="text-blue-600" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowUserSelector(!showUserSelector)}
                                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2"
                                    >
                                        <Users size={20} />
                                        <span>Click to select owner/guardian</span>
                                    </button>
                                )}

                                {/* User Selector Dropdown */}
                                {showUserSelector && !selectedUser && (
                                    <div className="mt-3 border border-gray-200 rounded-lg bg-white shadow-lg">
                                        {/* Search */}
                                        <div className="p-3 border-b border-gray-200">
                                            <div className="relative">
                                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={userSearchTerm}
                                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                                    placeholder="Search by name or email..."
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* User List */}
                                        <div className="max-h-64 overflow-y-auto">
                                            {loadingUsers ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users size={32} className="mx-auto mb-2 text-gray-400" />
                                                    <p className="text-sm">
                                                        {userSearchTerm ? 'No users found' : 'No users available'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {filteredUsers.map((user) => (
                                                        <div
                                                            key={user.uid}
                                                            onClick={() => {
                                                                handleInputChange('guardianUserId', user.uid);
                                                                handleInputChange('guardianName', user.name);
                                                                setShowUserSelector(false);
                                                                setUserSearchTerm('');
                                                            }}
                                                            className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                                                        >
                                                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {user.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                                    {user.role.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 You can add more members (vice admin, staff) after creating the organization
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="+63 XX XXXX XXXX"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="friary@ofmsap.org"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Established */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Established Year
                                </label>
                                <input
                                    type="text"
                                    value={formData.established}
                                    onChange={(e) => handleInputChange('established', e.target.value)}
                                    placeholder="e.g., 1950"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Ministries */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">
                                    Ministries (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.ministries}
                                    onChange={(e) => handleInputChange('ministries', e.target.value)}
                                    placeholder="e.g., Parish Ministry, Education, Social Services"
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={loading}
                                className="gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Friaries List */}
            {!isAdding && !editingId && (
                <div className="space-y-3">
                    {friaries.map((friary) => (
                        <Card key={friary.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg">{friary.name}</h3>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                                                {getFriaryTypeDisplay(friary.type)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {friary.location}
                                        </p>
                                        {friary.guardianName && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Guardian: {friary.guardianName}
                                            </p>
                                        )}
                                        {friary.ministries && friary.ministries.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {friary.ministries.map((ministry, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 rounded text-xs bg-accent/20 text-accent-foreground"
                                                    >
                                                        {ministry}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setManagingRolesFor(friary.id)}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            disabled={loading}
                                        >
                                            <Users className="w-4 h-4" />
                                            Manage Roles
                                        </Button>
                                        <Button
                                            onClick={() => handleEdit(friary)}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            disabled={loading}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(friary.id, friary.name)}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 text-destructive hover:text-destructive"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {friaries.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    No communities found. Click "Add Community" to create one.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
