import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Mail, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import logoImage from '../../assets/bb626b016a1517c6cfff6c8c45abb0b9ac8e523c.png';

interface PendingApprovalPageProps {
    userEmail?: string;
    onRetry?: () => void;
    onSignOut?: () => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
    userEmail,
    onRetry,
    onSignOut
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C9B59A] to-[#6B5447] p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <img
                            src={logoImage}
                            alt="Province Logo"
                            className="h-20 w-20 object-contain"
                        />
                    </div>
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <CardTitle className="text-xl text-yellow-800">
                        Waiting for Admin Approval
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="text-center space-y-3">
                        <p className="text-gray-700">
                            Your account request is currently being reviewed by an administrator.
                        </p>

                        {userEmail && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-center gap-2 text-blue-700">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm font-medium">{userEmail}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div className="text-sm text-gray-700">
                                <p className="font-medium mb-1">What happens next?</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• An administrator will review your request</li>
                                    <li>• You'll receive an email notification when approved</li>
                                    <li>• Once approved, you can sign in normally</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Need immediate access?</strong> Contact your administrator directly.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {onRetry && (
                            <Button
                                onClick={onRetry}
                                variant="outline"
                                className="w-full"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Check Again
                            </Button>
                        )}

                        <Button
                            onClick={onSignOut || (() => window.location.href = '/')}
                            variant="outline"
                            className="w-full"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            This page will automatically refresh when your account is approved.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};