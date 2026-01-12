import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Building2, Upload, Globe, Users, MapPin } from 'lucide-react';
import { Organization, OrganizationStatus } from '../../lib/organization-types';

interface OrganizationSetupProps {
    onComplete: (organization: Partial<Organization>) => void;
    onCancel: () => void;
    loading?: boolean;
}

export const OrganizationSetup: React.FC<OrganizationSetupProps> = ({
    onComplete,
    onCancel,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        domain: '',
        industry: '',
        size: 'small' as 'startup' | 'small' | 'medium' | 'large' | 'enterprise',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
        },
        contactInfo: {
            email: '',
            phone: '',
            website: ''
        }
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const industries = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Manufacturing',
        'Retail',
        'Consulting',
        'Non-profit',
        'Government',
        'Other'
    ];

    const companySizes = [
        { value: 'startup', label: '1-10 employees', description: 'Startup or very small team' },
        { value: 'small', label: '11-50 employees', description: 'Small business' },
        { value: 'medium', label: '51-250 employees', description: 'Medium-sized company' },
        { value: 'large', label: '251-1000 employees', description: 'Large company' },
        { value: 'enterprise', label: '1000+ employees', description: 'Enterprise organization' }
    ];

    const handleInputChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof typeof prev],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        const organizationData: Partial<Organization> = {
            name: formData.name,
            displayName: formData.displayName || formData.name,
            slug: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            domain: formData.domain,
            address: formData.address,
            contactInfo: formData.contactInfo,
            status: 'active' as OrganizationStatus,
            metadata: {
                industry: formData.industry,
                size: formData.size,
                description: formData.description,
                tags: []
            },
            settings: {
                general: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    dateFormat: 'MM/DD/YYYY',
                    timeFormat: '12h',
                    currency: 'USD',
                    language: 'en',
                    weekStart: 'monday',
                    fiscalYearStart: 1
                },
                security: {
                    passwordPolicy: {
                        minLength: 8,
                        requireUppercase: true,
                        requireLowercase: true,
                        requireNumbers: true,
                        requireSpecialChars: false,
                        preventReuse: 3,
                        maxAge: 90
                    },
                    mfaRequired: false,
                    mfaGracePeriod: 7,
                    sessionTimeout: 480,
                    ipWhitelist: [],
                    allowedDomains: formData.domain ? [formData.domain] : [],
                    ssoRequired: false,
                    auditLogRetention: 365
                },
                features: {
                    enabledModules: ['projects', 'documents', 'messaging', 'analytics'],
                    customFields: [],
                    workflows: [],
                    automations: []
                },
                integrations: {
                    emailProvider: {
                        provider: 'smtp',
                        config: {},
                        enabled: false
                    },
                    calendarSync: {
                        provider: 'google',
                        config: {},
                        enabled: false
                    },
                    fileStorage: {
                        provider: 'local',
                        config: {},
                        enabled: true
                    },
                    webhooks: [],
                    apiKeys: []
                },
                branding: {
                    primaryColor: '#3B82F6',
                    secondaryColor: '#64748B',
                    accentColor: '#10B981'
                },
                billing: {
                    plan: {
                        id: 'starter',
                        name: 'Starter',
                        description: 'Perfect for small teams',
                        maxUsers: 25,
                        maxStorage: 10,
                        maxProjects: 10,
                        maxDepartments: 3,
                        features: ['basic_projects', 'document_sharing', 'team_messaging'],
                        price: {
                            monthly: 0,
                            yearly: 0,
                            currency: 'USD'
                        },
                        limits: {
                            apiCalls: 1000,
                            fileUploadSize: 25,
                            videoCallMinutes: 0,
                            customFields: 5,
                            workflows: 3,
                            integrations: 2
                        }
                    }
                }
            },
            subscription: {
                planId: 'starter',
                status: 'trial',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                cancelAtPeriodEnd: false,
                usage: {
                    users: 1,
                    storage: 0,
                    projects: 0,
                    departments: 1,
                    apiCalls: 0,
                    lastUpdated: new Date()
                }
            }
        };

        onComplete(organizationData);
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.name.trim() !== '' && formData.contactInfo.email.trim() !== '';
            case 2:
                return formData.industry !== '' && formData.size !== '';
            case 3:
                return true; // Address is optional
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
                            <p className="text-gray-600">Let's start with the basic information about your organization</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Organization Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter your organization name"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                                    placeholder="How should we display your organization name?"
                                    className="mt-1"
                                />
                                <p className="text-sm text-gray-500 mt-1">Leave empty to use the organization name</p>
                            </div>

                            <div>
                                <Label htmlFor="email">Contact Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.contactInfo.email}
                                    onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                                    placeholder="contact@yourcompany.com"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="domain">Company Domain</Label>
                                <Input
                                    id="domain"
                                    value={formData.domain}
                                    onChange={(e) => handleInputChange('domain', e.target.value)}
                                    placeholder="yourcompany.com"
                                    className="mt-1"
                                />
                                <p className="text-sm text-gray-500 mt-1">Users with this email domain will be automatically assigned to your organization</p>
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.contactInfo.phone}
                                    onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={formData.contactInfo.website}
                                    onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
                                    placeholder="https://yourcompany.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Organization Profile</h2>
                            <p className="text-gray-600">Tell us more about your organization</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="industry">Industry *</Label>
                                <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select your industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map((industry) => (
                                            <SelectItem key={industry} value={industry}>
                                                {industry}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="size">Company Size *</Label>
                                <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select company size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companySizes.map((size) => (
                                            <SelectItem key={size.value} value={size.value}>
                                                <div>
                                                    <div className="font-medium">{size.label}</div>
                                                    <div className="text-sm text-gray-500">{size.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Brief description of your organization..."
                                    className="mt-1"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
                            <p className="text-gray-600">Add your organization's address (optional)</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={formData.address.street}
                                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                                    placeholder="123 Main Street"
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.address.city}
                                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                                        placeholder="New York"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State/Province</Label>
                                    <Input
                                        id="state"
                                        value={formData.address.state}
                                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                                        placeholder="NY"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="postalCode">Postal Code</Label>
                                    <Input
                                        id="postalCode"
                                        value={formData.address.postalCode}
                                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                                        placeholder="10001"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.address.country}
                                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                                        placeholder="United States"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Setup Your Organization</CardTitle>
                        <div className="text-sm text-gray-500">
                            Step {currentStep} of {totalSteps}
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </CardHeader>

                <CardContent>
                    {renderStep()}

                    <div className="flex justify-between mt-8">
                        <Button
                            variant="outline"
                            onClick={currentStep === 1 ? onCancel : handlePrevious}
                            disabled={loading}
                        >
                            {currentStep === 1 ? 'Cancel' : 'Previous'}
                        </Button>

                        <Button
                            onClick={currentStep === totalSteps ? handleSubmit : handleNext}
                            disabled={!isStepValid() || loading}
                        >
                            {loading ? 'Creating...' : currentStep === totalSteps ? 'Create Organization' : 'Next'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};