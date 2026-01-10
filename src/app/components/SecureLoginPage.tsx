import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useApp } from '../contexts/AppContext';
import { Fingerprint, Shield, Eye, EyeOff } from 'lucide-react';
import logoImage from '../../assets/bb626b016a1517c6cfff6c8c45abb0b9ac8e523c.png';

interface BiometricSupport {
  available: boolean;
  type: 'fingerprint' | 'face' | 'none';
}

export function SecureLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometric, setBiometric] = useState<BiometricSupport>({ available: false, type: 'none' });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login } = useApp();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometric({
          available,
          type: available ? 'fingerprint' : 'none'
        });
      }
    } catch (error) {
      console.log('Biometric check failed:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometric.available) return;

    setIsLoading(true);
    try {
      // Create credential request for biometric authentication
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "Office OFM" },
          user: {
            id: new TextEncoder().encode("user"),
            name: email || "user@office.com",
            displayName: "Office User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      }) as PublicKeyCredential;

      if (credential) {
        // In real implementation, verify credential with server
        const success = login(email || 'admin@province.ph', 'biometric-auth');
        if (!success) {
          setError('Biometric authentication failed');
        }
      }
    } catch (error) {
      setError('Biometric authentication not available or failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Rate limiting
    if (loginAttempts >= 3) {
      setError('Too many failed attempts. Please wait 5 minutes.');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate network delay for security
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = login(email, password);
      if (!success) {
        setLoginAttempts(prev => prev + 1);
        setError('Invalid credentials. Try: admin@province.ph / password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C9B59A] to-[#6B5447] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Province Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Secure Login
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Province of San Antonio de Padua - Office Management System
          </p>
          {biometric.available && (
            <Badge variant="secondary" className="mx-auto">
              <Fingerprint className="h-3 w-3 mr-1" />
              Biometric Available
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@province.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            {biometric.available && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleBiometricLogin}
                disabled={isLoading}
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Use Biometric Login
              </Button>
            )}
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Demo credentials: admin@province.ph / password</p>
              <p>Login attempts: {loginAttempts}/3</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}