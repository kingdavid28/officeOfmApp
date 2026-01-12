import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { UserRole, UserProfile, authService } from '../../lib/auth';
import { Shield, User, Settings, X, CheckCircle, Users } from 'lucide-react';

interface GoogleRoleSelectionModalProps {
    isOpen: boolean;
    userEmail: string;
    userName: string;
    onRoleSelect: (role: UserRole, selectedAdminId?: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export const GoogleRoleSelectionModal: React.FC<GoogleRoleSelectionModalProps> = ({
    isOpen,
    userEmail,
    userName,
    onRoleSelect,
    onCancel,
    loading = false
}) => {
    const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAdminUsers();
        }
    }, [isOpen]);

    const loadAdminUsers = async () => {
        setLoadingAdmins(true);
        try {
            const admins = await authService.getAdminUsers();
            setAdminUsers(admins);
            if (admins.length > 0) {
                setSelectedAdminId(admins[0].uid); // Default to first admin
            }
        } catch (error) {
            console.error('Error loading admin users:', error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    if (!isOpen) return null;

    const roles = [
        {
            value: 'staff' as UserRole,
            label: 'Staff Member',
            description: 'Basic access to tasks, receipts, and files. Will be assigned to a specific administrator.',
            icon: User,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            value: 'admin' as UserRole,
            label: 'Administrator',
            description: 'Full access including user management and system settings',
            icon: Settings,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    ];

    const handleSubmit = () => {
        onRoleSelect(selectedRole, selectedRole === 'staff' ? selectedAdminId : undefined);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="relative">
                    <button
                        onClick={onCancel}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Google Sign-In Successful</CardTitle>
                            <p className="text-sm text-gray-600">Choose your requested role</p>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">{userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                            Select the role you're requesting:
                        </Label>

                        <div className="space-y-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.value;

                                return (
                                    <div
                                        key={role.value}
                                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${isSelected
                                            ? `${role.borderColor} ${role.bgColor}`
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedRole(role.value)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${isSelected ? role.bgColor : 'bg-gray-50'}`}>
                                                <Icon className={`w-5 h-5 ${isSelected ? role.color : 'text-gray-600'}`} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-medium ${isSelected ? role.color : 'text-gray-900'}`}>
                                                        {role.label}
                                                    </h3>
                                                    {isSelected && (
                                                        <div className={`w-2 h-2 rounded-full ${role.color.replace('text-', 'bg-')}`} />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {role.description}
                                                </p>
                                            </div>
                                        </div>

                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={isSelected}
                                            onChange={() => setSelectedRole(role.value)}
                                            className="absolute top-4 right-4 w-4 h-4 text-blue-600"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedRole === 'staff' && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">
                                Select the administrator you'd like to work under:
                            </Label>

                            {loadingAdmins ? (
                                <div className="p-4 text-center text-gray-500">
                                    Loading administrators...
                                </div>
                            ) : adminUsers.length === 0 ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        No administrators available. Your request will be assigned to the approving administrator.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {adminUsers.map((admin) => (
                                        <div
                                            key={admin.uid}
                                            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${selectedAdminId === admin.uid
                                                ? 'border-blue-200 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedAdminId(admin.uid)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedAdminId === admin.uid ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                                    <Users className={`w-4 h-4 ${selectedAdminId === admin.uid ? 'text-blue-600' : 'text-gray-600'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-medium ${selectedAdminId === admin.uid ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {admin.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {admin.email}
                                                    </p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="admin"
                                                    value={admin.uid}
                                                    checked={selectedAdminId === admin.uid}
                                                    onChange={() => setSelectedAdminId(admin.uid)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Your request will be reviewed by an administrator.
                            {selectedRole === 'staff' && selectedAdminId && (
                                <span> You will be assigned to {adminUsers.find(a => a.uid === selectedAdminId)?.name}.</span>
                            )}
                            {selectedRole === 'admin' && (
                                <span> Administrator requests require additional approval.</span>
                            )}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};