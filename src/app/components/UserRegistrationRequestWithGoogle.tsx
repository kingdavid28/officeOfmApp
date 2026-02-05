import React, { useState } from 'react';
import { authService, UserRole } from '../../lib/auth';
import { GoogleSignInButton } from './GoogleSignInButton';

export const UserRegistrationRequestWithGoogle: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'staff' as UserRole
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.requestUserCreation(formData.email, formData.name, formData.role);
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting request:', error);
            setError('Error submitting request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = () => {
        setSubmitted(true);
    };

    const handleGoogleError = (errorMessage: string) => {
        setError(errorMessage);
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">Request Submitted</h2>
                <p className="text-green-700">
                    Your account request has been submitted for approval. You will be notified once it's processed by an administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Request Account Access</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or register with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            id="google-registration-name"
                            name="google-registration-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="google-registration-email"
                            name="google-registration-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Requested Role
                        </label>
                        <select
                            id="google-registration-role"
                            name="google-registration-role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> All account requests must be approved by an administrator before access is granted.
                    </p>
                </div>
            </div>
        </div>
    );
};