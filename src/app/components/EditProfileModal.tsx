import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserProfile, authService } from '../../lib/auth';
import { X, User, Save, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
    isOpen: boolean;
    userProfile: UserProfile;
    onProfileUpdate: (updatedProfile: UserProfile) => void;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isOpen,
    userProfile,
    onProfileUpdate,
    onClose
}) => {
    const [name, setName] = useState(userProfile.name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate name
            if (!name.trim()) {
                throw new Error('Name cannot be empty');
            }

            if (name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters long');
            }

            if (name.trim().length > 50) {
                throw new Error('Name cannot exceed 50 characters');
            }

            // Update the profile
            await authService.updateUserProfile(userProfile.uid, { name: name.trim() });

            // Create updated profile object
            const updatedProfile: UserProfile = {
                ...userProfile,
                name: name.trim(),
                updatedAt: new Date()
            };

            onProfileUpdate(updatedProfile);
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(userProfile.name); // Reset to original name
        setError(null);
        onClose();
    };

    const hasChanges = name.trim() !== userProfile.name;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="relative">
                    <button
                        onClick={handleCancel}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Edit Profile</CardTitle>
                            <p className="text-sm text-gray-600">Update your personal information</p>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">{userProfile.email}</p>
                        <p className="text-xs text-gray-500 capitalize">
                            {userProfile.role === 'super_admin' ? 'Super Administrator' :
                                userProfile.role === 'admin' ? 'Administrator' : 'Staff Member'}
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                disabled={loading}
                                className="w-full"
                                maxLength={50}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                This name will be displayed throughout the application
                            </p>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-blue-600 text-xs">ℹ️</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-blue-800">Profile Information</h3>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Your email address and role cannot be changed. Contact a super administrator
                                        if you need to modify these details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={loading || !hasChanges}
                                className="flex-1 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>

                        {hasChanges && (
                            <p className="text-xs text-amber-600 text-center">
                                You have unsaved changes
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};