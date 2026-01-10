import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authService } from '../../lib/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import logoImage from '../../assets/bb626b016a1517c6cfff6c8c45abb0b9ac8e523c.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  useEffect(() => {
    // Check if there's already a signed-in user
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Add global helper for development
    if (typeof window !== 'undefined') {
      (window as any).forceSignOut = async () => {
        try {
          await authService.signOut();
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        } catch (error) {
          console.error('Error signing out:', error);
        }
      };

      (window as any).debugAuth = () => {
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        return user;
      };
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
      setError('');
      setResetMessage('Signed out successfully. You can now sign in as a different user.');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Error signing out. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signIn(email, password);
      console.log('Sign in successful:', result.user.uid);
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'An error occurred during sign in';

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Contact administrator.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address first');
      return;
    }

    setLoading(true);
    setError('');
    setResetMessage('');

    try {
      await authService.sendPasswordReset(email);
      setResetMessage('Password reset email sent! Check your inbox and spam folder.');
      setShowForgotPassword(false);
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    console.log('Google Sign-In success callback triggered');
    // This could mean either:
    // 1. Existing user signed in successfully (handled by AuthContext)
    // 2. New user completed role selection and needs to see pending approval
    // The AuthContext will handle the appropriate state
  };

  const handleGoogleError = (errorMessage: string) => {
    console.error('Google Sign-In error:', errorMessage);
    setError(errorMessage);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C9B59A] to-[#6B5447] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Province Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Province of San Antonio de Padua
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Office Management System
          </p>
        </CardHeader>
        <CardContent>
          {currentUser && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800">
                    Already signed in as: <strong>{currentUser.email}</strong>
                  </p>
                  <p className="text-xs text-yellow-600">
                    Sign out to login as a different user
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@province.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    className={emailError ? 'border-red-500 focus:border-red-500' : ''}
                    required
                    autoComplete="email"
                  />
                  {emailError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={() => validatePassword(password)}
                    className={passwordError ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {resetMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {resetMessage}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                >
                  Forgot Password?
                </Button>
              </div>

              {showForgotPassword && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3">
                    Enter your email address and we'll send you a password reset link.
                  </p>
                  <Button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || !email || !!emailError}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/register'}
              >
                Request Account Access
              </Button>

              <div className="text-xs text-muted-foreground text-center mt-4">
                Contact administrator for account access
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}