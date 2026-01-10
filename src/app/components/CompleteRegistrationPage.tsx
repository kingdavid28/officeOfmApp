import React, { useState } from 'react';
import { authService, UserRole } from '../../lib/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2, User, Mail, Shield } from 'lucide-react';

export const CompleteRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'staff' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    name: ''
  });

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Name can only contain letters and spaces';
    }
    return '';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [field]: ''
      });
    }

    // Clear general error
    if (error) setError('');
  };

  const validateForm = () => {
    const emailError = validateEmail(formData.email);
    const nameError = validateName(formData.name);

    setValidationErrors({
      email: emailError,
      name: nameError
    });

    return !emailError && !nameError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting registration request:', formData);
      await authService.requestUserCreation(formData.email, formData.name, formData.role);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting request:', error);

      let errorMessage = 'Error submitting request. Please try again.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please try again or contact support.';
      } else if (error.message?.includes('already pending')) {
        errorMessage = 'A request for this email is already pending approval.';
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C9B59A] to-[#6B5447] p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-800">Request Submitted Successfully</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm text-center">
                Your account request has been submitted for approval. You will be notified via email once it's processed by an administrator.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Please check your email for updates on your request status.</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C9B59A] to-[#6B5447] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Request access to the Office Management System
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}

          <div>
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => {
                  const error = validateName(formData.name);
                  setValidationErrors({ ...validationErrors, name: error });
                }}
                className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                required
                autoComplete="name"
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => {
                  const error = validateEmail(formData.email);
                  setValidationErrors({ ...validationErrors, email: error });
                }}
                className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
                required
                autoComplete="email"
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Requested Role
              </Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Administrator requests require additional approval
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !!validationErrors.email || !!validationErrors.name}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> All account requests must be approved by an administrator before access is granted. You will receive an email notification once your request is processed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};