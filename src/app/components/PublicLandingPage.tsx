import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Building2, Shield, BarChart3, Receipt, Users, Lock, ArrowRight, CheckCircle, Star, Heart, Brain, Zap, Globe, Award } from 'lucide-react';

interface PublicLandingPageProps {
    onSignInClick: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onSignInClick }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
                                <Heart className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">OFM-South AI</h1>
                                <p className="text-xs text-gray-600">Financial Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
                            <Button
                                onClick={onSignInClick}
                                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                            >
                                Sign In
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Franciscan Background */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('data:image/svg+xml;base64,${btoa(`
              <svg width="1024" height="576" viewBox="0 0 1024 576" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#8B4513;stop-opacity:0.9" />
                    <stop offset="50%" style="stop-color:#A0522D;stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:#D2691E;stop-opacity:0.7" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)" />
                <text x="512" y="200" text-anchor="middle" fill="white" font-size="48" font-family="serif" opacity="0.3">Order of Friars Minor</text>
                <text x="512" y="280" text-anchor="middle" fill="white" font-size="32" font-family="serif" opacity="0.3">Province of San Antonio de Padua</text>
                <text x="512" y="350" text-anchor="middle" fill="white" font-size="24" font-family="serif" opacity="0.2">Philippines</text>
              </svg>
            `)}`
                    }}
                />

                {/* Dark Overlay for Better Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-8">
                        <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                            <Star className="w-4 h-4 mr-2 text-amber-400" />
                            Serving the Order of Friars Minor - Province of San Antonio de Padua
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                            OFM-South AI
                        </span>
                        <br />
                        <span className="text-3xl md:text-4xl font-normal text-white/90">
                            Financial Management System
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-10 leading-relaxed">
                        AI-powered financial management designed for religious communities,
                        following Franciscan values and OFM South Province Phil accounting standards.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={onSignInClick}
                            size="lg"
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 transform hover:scale-105"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Learn More
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/70">
                        <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span>Secure & Compliant</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span>AI-Powered Recognition</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span>Franciscan Standards</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Powerful Features for Religious Communities
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Built specifically for friaries with AI-powered tools that understand your unique needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* AI Receipt Recognition */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">AI Receipt Recognition</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Advanced AI technology that reads handwritten and printed receipts, automatically categorizing
                                    expenses according to friary accounting standards.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Financial Reporting */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Comprehensive Reporting</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Generate detailed financial reports following OFM South Province Phil format,
                                    with Excel export and transaction-level tracking.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Role-Based Access */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Role-Based Access</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Secure access control with different permission levels for staff, admin, and super admin,
                                    ensuring proper financial oversight.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Security & Compliance */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Security & Compliance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Enterprise-grade security with complete audit trails, ensuring compliance with
                                    financial regulations and religious community standards.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Real-time Processing */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Real-time Processing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Instant receipt processing and categorization with real-time financial dashboards
                                    and notifications for important transactions.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Cloud-Based */}
                        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Globe className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Cloud-Based Access</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">
                                    Access your financial data securely from anywhere with automatic backups
                                    and synchronization across all devices.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-full text-amber-800 text-sm font-medium mb-6">
                                <Award className="w-4 h-4 mr-2" />
                                Trusted by Religious Communities
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                About OFM-South AI
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                OFM-South AI Office and Financial Management System is a specialized financial management
                                solution designed specifically for religious communities, particularly friaries following
                                the Franciscan tradition.
                            </p>
                            <p className="text-lg text-gray-600 mb-8">
                                Our system provides comprehensive tools for receipt management, financial reporting, and
                                administrative oversight while maintaining the highest standards of security and compliance.
                                We follow the accounting standards established by OFM South Province Phil, ensuring
                                that your financial management processes align with traditional religious community practices
                                while leveraging modern AI technology for efficiency and accuracy.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-amber-600 mb-2">100%</div>
                                    <div className="text-gray-600">Secure & Compliant</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-amber-600 mb-2">AI</div>
                                    <div className="text-gray-600">Powered Recognition</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-2xl shadow-2xl p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                            <Heart className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Franciscan Values</h3>
                                            <p className="text-gray-600">Built with simplicity and transparency</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                            <Brain className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">AI Technology</h3>
                                            <p className="text-gray-600">Advanced machine learning capabilities</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                            <Shield className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                                            <p className="text-gray-600">Bank-level security and encryption</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-amber-600 to-amber-700">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Financial Management?
                    </h2>
                    <p className="text-xl text-amber-100 mb-10">
                        Join religious communities worldwide who trust OFM-South AI for their financial operations.
                    </p>
                    <Button
                        onClick={onSignInClick}
                        size="lg"
                        className="bg-white text-amber-700 hover:bg-amber-50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                        Start Your Journey
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
                                    <Heart className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">OFM-South AI</h3>
                                    <p className="text-gray-400 text-sm">Financial Management System</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4 max-w-md">
                                Serving the Order of Friars Minor with AI-powered financial management solutions
                                that honor Franciscan values and traditions.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><button onClick={onSignInClick} className="hover:text-white transition-colors">Sign In</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>Email: support@ofmsouth.com</li>
                                <li>Privacy: privacy@ofmsouth.com</li>
                                <li>Philippines</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 OFM-South AI Office and Financial Management System. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};