import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { UserRole, UserProfile } from '../../lib/auth';
import { Shield, User, Settings, X, Edit3, AlertTriangle } from 'lucide-react';

interface EditUserRoleModalProps {
    isOpen: boolean;
    user: UserProfile;
    currentUserRole: 'admin' | 'super_admin';
    onRoleUpdate: (userId: string, newRole: UserRole) => Promise<void>;
    onClose: () => void;
    loading?: boolean;
}

export const EditUserRoleModal: React.FC<EditUserRoleModalProps> = ({
    isOpen,
    user,
    currentUserRole,
    onRoleUpdate,
    onClose,
    loading = false
}) => {
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const availableRoles = [
        {
            value: 'staff' as UserRole,
            label: 'Staff Member',
            description: 'Basic access to tasks, receipts, and files',
            icon: User,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            canAssign: true
        },
        {
            value: 'admin' as UserRole,
            label: 'Administrator',
            description: 'Full access including user management and system settings',
            icon: Settings,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            canAssign: true
        },
        {
            value: 'super_admin' as UserRole,
            label: 'Super Administrator',
            description: 'Complete system control and user management',
            icon: Shield,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            canAssign: currentUserRole === 'super_admin'
        }
    ];

    const handleSubmit = async () => {
        if (selectedRole === user.role) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            await onRoleUpdate(user.uid, selectedRole);
            onClose();
        } catch (error) {
            console.error('Error updating user role:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCurrentUser = user.role === 'super_admin' && currentUserRole === 'super_admin';
    const hasChanges = selectedRole !== user.role;
    const isSuperAdminUser = user.role === 'super_admin';

    // Super admin roles cannot be changed for security reasons
    if (isSuperAdminUser) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="relative">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Super Administrator</CardTitle>
                                <p className="text-sm text-gray-600">Role cannot be modified</p>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">Role:</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                    Super Administrator
                                </span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-800 mb-1">Role Protected</h3>
                                    <p className="text-sm text-red-700">
                                        Super administrator roles cannot be modified for security reasons.
                                        This ensures system integrity and prevents accidental privilege escalation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Security Best Practice:</strong> Super admin privileges are permanent
                                and cannot be changed through the user interface.
                            </p>
                        </div>

                        <Button
                            onClick={onClose}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        disabled={loading || isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Edit User Role</CardTitle>
                            <p className="text-sm text-gray-600">Change user permissions</p>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Current role:</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {user.role === 'super_admin' ? 'Super Admin' :
                                    user.role === 'admin' ? 'Administrator' : 'Staff Member'}
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {isCurrentUser && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <p className="text-sm text-yellow-800">
                                    <strong>Warning:</strong> You are editing your own super admin role.
                                    Be careful not to remove your own access.
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                            Select new role:
                        </Label>

                        <div className="space-y-3">
                            {availableRoles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.value;
                                const isDisabled = !role.canAssign;

                                return (
                                    <div
                                        key={role.value}
                                        className={`relative rounded-lg border-2 p-4 transition-all ${isDisabled
                                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                            : isSelected
                                                ? `${role.borderColor} ${role.bgColor} cursor-pointer`
                                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                            }`}
                                        onClick={() => !isDisabled && setSelectedRole(role.value)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${isDisabled ? 'bg-gray-100' :
                                                isSelected ? role.bgColor : 'bg-gray-50'
                                                }`}>
                                                <Icon className={`w-5 h-5 ${isDisabled ? 'text-gray-400' :
                                                    isSelected ? role.color : 'text-gray-600'
                                                    }`} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-medium ${isDisabled ? 'text-gray-400' :
                                                        isSelected ? role.color : 'text-gray-900'
                                                        }`}>
                                                        {role.label}
                                                    </h3>
                                                    {isSelected && !isDisabled && (
                                                        <div className={`w-2 h-2 rounded-full ${role.color.replace('text-', 'bg-')}`} />
                                                    )}
                                                    {isDisabled && (
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                            Restricted
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    {role.description}
                                                </p>
                                            </div>
                                        </div>

                                        {!isDisabled && (
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role.value}
                                                checked={isSelected}
                                                onChange={() => setSelectedRole(role.value)}
                                                className="absolute top-4 right-4 w-4 h-4 text-blue-600"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {currentUserRole !== 'super_admin' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Only super administrators can assign super admin roles.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || isSubmitting || !hasChanges}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Updating...' : hasChanges ? 'Update Role' : 'No Changes'}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={loading || isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};