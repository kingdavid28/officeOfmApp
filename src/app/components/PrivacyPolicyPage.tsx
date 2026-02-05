import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
    onBackClick: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBackClick }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-6">
                        <Button variant="ghost" onClick={onBackClick} className="mr-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex items-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                            <h1 className="ml-2 text-xl font-bold text-gray-900">OFM-South AI Office and Financial Management System</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Privacy Policy Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
                        <p className="text-gray-600">Last updated: January 2024</p>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                        <div className="space-y-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                                <p className="text-gray-700">
                                    OFM-South AI Office and Financial Management System ("we," "our," or "us") is committed to protecting your privacy.
                                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                                    you use our AI-powered financial management application designed for religious communities.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
                                <ul className="list-disc list-inside text-gray-700 mb-4">
                                    <li>Name and email address for account creation</li>
                                    <li>Role and position within your religious community</li>
                                    <li>Authentication information (encrypted passwords)</li>
                                </ul>

                                <h3 className="text-lg font-medium text-gray-800 mb-2">Financial Data</h3>
                                <ul className="list-disc list-inside text-gray-700 mb-4">
                                    <li>Receipt images and transaction data</li>
                                    <li>Financial reports and summaries</li>
                                    <li>Budget and expense categorizations</li>
                                </ul>

                                <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Information</h3>
                                <ul className="list-disc list-inside text-gray-700">
                                    <li>Log data and system usage patterns</li>
                                    <li>Device information and browser type</li>
                                    <li>IP addresses and access times</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                                <ul className="list-disc list-inside text-gray-700">
                                    <li>Provide and maintain our financial management services</li>
                                    <li>Process and categorize financial transactions</li>
                                    <li>Generate financial reports and analytics</li>
                                    <li>Ensure system security and prevent unauthorized access</li>
                                    <li>Communicate with you about your account and services</li>
                                    <li>Improve our application and user experience</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
                                <p className="text-gray-700 mb-4">
                                    We implement appropriate technical and organizational security measures to protect your
                                    personal information against unauthorized access, alteration, disclosure, or destruction:
                                </p>
                                <ul className="list-disc list-inside text-gray-700">
                                    <li>End-to-end encryption for sensitive financial data</li>
                                    <li>Secure authentication and authorization systems</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Role-based access controls</li>
                                    <li>Secure cloud infrastructure (Firebase/Google Cloud)</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
                                <p className="text-gray-700 mb-4">
                                    We do not sell, trade, or otherwise transfer your personal information to third parties, except:
                                </p>
                                <ul className="list-disc list-inside text-gray-700">
                                    <li>With your explicit consent</li>
                                    <li>To comply with legal obligations</li>
                                    <li>To protect our rights and safety</li>
                                    <li>With trusted service providers who assist in operating our application</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
                                <p className="text-gray-700">
                                    We retain your personal information only for as long as necessary to fulfill the purposes
                                    outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and
                                    enforce our agreements. Financial records may be retained for extended periods as required
                                    by accounting and regulatory standards.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                                <p className="text-gray-700 mb-4">You have the right to:</p>
                                <ul className="list-disc list-inside text-gray-700">
                                    <li>Access your personal information</li>
                                    <li>Correct inaccurate or incomplete data</li>
                                    <li>Request deletion of your personal information</li>
                                    <li>Object to processing of your personal information</li>
                                    <li>Request data portability</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
                                <p className="text-gray-700">
                                    We use cookies and similar tracking technologies to enhance your experience, analyze usage
                                    patterns, and maintain your session. You can control cookie settings through your browser
                                    preferences.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
                                <p className="text-gray-700">
                                    We may update this Privacy Policy from time to time. We will notify you of any changes by
                                    posting the new Privacy Policy on this page and updating the "Last updated" date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
                                <p className="text-gray-700">
                                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                                </p>
                                <div className="bg-gray-100 p-4 rounded-lg mt-4">
                                    <p className="text-gray-700">
                                        <strong>OFM-South AI Office and Financial Management System</strong><br />
                                        Email: privacy@ofmsouth.com<br />
                                        Address: [Your Organization Address]
                                    </p>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};