import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Building2, School, Users, FileText, DollarSign, MapPin, Phone, Mail, ChevronRight, Settings, Church, Home, MessageCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Friary, getFriaryTypeDisplay, canManageFriaries } from '../../lib/friary-types';
import { getAllFriaries, getFriaryStats } from '../../lib/friary-service';
import { FriaryManagement } from './FriaryManagement';
import { RealtimeMessagingService } from '../../lib/realtime-messaging-service';
import { OrganizationFiles } from './organization/OrganizationFiles';

interface FriaryDashboardProps {
    friary: Friary;
    onBack: () => void;
}

interface FriaryStatsData {
    totalFiles: number;
    totalExpenses: number;
    monthlyBudget: number;
    budgetUtilization: number;
    recentDocuments: any[];
    recentExpenses: any[];
    memberCount: number;
}

function FriaryDashboard({ friary, onBack }: FriaryDashboardProps) {
    const [stats, setStats] = useState<FriaryStatsData>({
        totalFiles: 0,
        totalExpenses: 0,
        monthlyBudget: 50000,
        budgetUtilization: 0,
        recentDocuments: [],
        recentExpenses: [],
        memberCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'files'>('overview');

    useEffect(() => {
        loadFriaryData();
    }, [friary.id]);

    const loadFriaryData = async () => {
        try {
            setLoading(true);
            const friaryStats = await getFriaryStats(friary.id);
            setStats(friaryStats);
        } catch (error) {
            console.error('Error loading friary data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const getTypeIcon = () => {
        switch (friary.type) {
            case 'school':
                return <School className="w-12 h-12 text-primary" />;
            case 'parish':
                return <Church className="w-12 h-12 text-primary" />;
            case 'retreat_center':
                return <Home className="w-12 h-12 text-primary" />;
            case 'formation_house':
                return <Users className="w-12 h-12 text-primary" />;
            default:
                return <Building2 className="w-12 h-12 text-primary" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Organization
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'overview'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'financial'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Financial
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'files'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Files & Documents
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'files' ? (
                <OrganizationFiles
                    organizationId={friary.id}
                    organizationName={friary.name}
                    organizationType={friary.type}
                />
            ) : (
                <>
                    {/* Friary Info Card */}
                    <Card className="border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {getTypeIcon()}
                                    <div>
                                        <CardTitle className="text-2xl">{friary.name}</CardTitle>
                                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {friary.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                        {getFriaryTypeDisplay(friary.type)}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {friary.guardianName && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Guardian/Director</p>
                                        <p className="font-medium">{friary.guardianName}</p>
                                    </div>
                                )}
                                {friary.memberCount !== undefined && friary.memberCount > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Members</p>
                                        <p className="font-medium">{friary.memberCount} Friars</p>
                                    </div>
                                )}
                                {friary.established && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Established</p>
                                        <p className="font-medium">{friary.established}</p>
                                    </div>
                                )}
                                {friary.phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {friary.phone}
                                        </p>
                                    </div>
                                )}
                                {friary.email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {friary.email}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {friary.ministries && friary.ministries.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-2">Ministries</p>
                                    <div className="flex flex-wrap gap-2">
                                        {friary.ministries.map((ministry, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 rounded-full text-sm bg-accent/20 text-accent-foreground"
                                            >
                                                {ministry}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-bold">{stats.totalFiles}</div>
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Expenses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
                                        <DollarSign className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Monthly Budget
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-bold">{formatCurrency(stats.monthlyBudget)}</div>
                                        <DollarSign className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Recent Documents */}
                    {activeTab === 'overview' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stats.recentDocuments.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.recentDocuments.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{doc.title || doc.fileName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {doc.category || 'Uncategorized'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        No documents found for this community
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Financial Summary */}
                    {activeTab === 'financial' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Budget Utilization</span>
                                        <span className="font-semibold">
                                            {Math.round(stats.budgetUtilization)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3">
                                        <div
                                            className="bg-primary h-3 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(stats.budgetUtilization, 100)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Spent: {formatCurrency(stats.totalExpenses)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Budget: {formatCurrency(stats.monthlyBudget)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

interface OrganizationalChartProps {
    onNavigate?: (view: string) => void;
}

export function OrganizationalChart({ onNavigate }: OrganizationalChartProps = {}) {
    const { userProfile, user } = useAuth();
    const [selectedFriary, setSelectedFriary] = useState<Friary | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [friaries, setFriaries] = useState<Friary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManagement, setShowManagement] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);

    useEffect(() => {
        loadFriaries();
    }, []);

    const loadFriaries = async () => {
        try {
            setLoading(true);
            const data = await getAllFriaries();
            setFriaries(data);
        } catch (error) {
            console.error('Error loading friaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageFriary = async (friary: Friary) => {
        if (!user || !userProfile || creatingChat) return;

        setCreatingChat(true);
        try {
            // Create or get group chat for the friary/organization
            const chatName = `${friary.name} - ${getFriaryTypeDisplay(friary.type)}`;

            // Get all members of this friary (you may need to implement this)
            // For now, we'll create a group chat with just the current user
            // In a real implementation, you'd fetch all members of the friary
            const chatId = await RealtimeMessagingService.createGroupChat(
                chatName,
                user.uid,
                userProfile.name || user.email || 'Unknown',
                userProfile.role as any,
                [], // Add friary members here when available
                'group',
                {
                    allowFileSharing: true,
                    maxFileSize: 10,
                    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
                    isPrivate: false,
                    requireApproval: false
                }
            );

            // Navigate to messaging page
            if (onNavigate) {
                onNavigate('messaging');
            }

        } catch (error) {
            console.error('Failed to create friary chat:', error);
            alert('Failed to create chat. Please try again.');
        } finally {
            setCreatingChat(false);
        }
    };

    const filteredFriaries = friaries.filter(friary =>
        friary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friary.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const friariesByType = {
        friary: filteredFriaries.filter(f => f.type === 'friary'),
        parish: filteredFriaries.filter(f => f.type === 'parish'),
        school: filteredFriaries.filter(f => f.type === 'school'),
        formation_house: filteredFriaries.filter(f => f.type === 'formation_house'),
        retreat_center: filteredFriaries.filter(f => f.type === 'retreat_center')
    };

    const canManage = userProfile && canManageFriaries(userProfile.role as any);

    if (selectedFriary) {
        return <FriaryDashboard friary={selectedFriary} onBack={() => setSelectedFriary(null)} />;
    }

    if (showManagement) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowManagement(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Organization
                    </button>
                </div>
                <FriaryManagement friaries={friaries} onRefresh={loadFriaries} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Organizational Chart</h1>
                    <p className="text-muted-foreground mt-1">
                        OFM Franciscan Province of San Antonio de Padua, Philippines
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setShowManagement(true)} className="gap-2">
                        <Settings className="w-4 h-4" />
                        Manage Communities
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="max-w-md">
                <input
                    type="text"
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Province Overview */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary">{friaries.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Total Communities</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{friariesByType.friary.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Friaries</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{friariesByType.parish.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Parishes</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{friariesByType.school.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Schools</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{friariesByType.formation_house.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Formation Houses</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Loading communities...</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Friaries Section */}
                    {friariesByType.friary.length > 0 && (
                        <CommunitySection
                            title="Friaries"
                            icon={<Building2 className="w-6 h-6 text-primary" />}
                            communities={friariesByType.friary}
                            onSelect={setSelectedFriary}
                            borderColor="border-l-primary"
                            iconComponent={Building2}
                            onMessage={handleMessageFriary}
                        />
                    )}

                    {/* Parishes Section */}
                    {friariesByType.parish.length > 0 && (
                        <CommunitySection
                            title="Parishes"
                            icon={<Church className="w-6 h-6 text-chart-2" />}
                            communities={friariesByType.parish}
                            onSelect={setSelectedFriary}
                            borderColor="border-l-chart-2"
                            iconComponent={Church}
                            onMessage={handleMessageFriary}
                        />
                    )}

                    {/* Formation Houses Section */}
                    {friariesByType.formation_house.length > 0 && (
                        <CommunitySection
                            title="Formation Houses"
                            icon={<Users className="w-6 h-6 text-chart-3" />}
                            communities={friariesByType.formation_house}
                            onSelect={setSelectedFriary}
                            borderColor="border-l-chart-3"
                            iconComponent={Users}
                            onMessage={handleMessageFriary}
                        />
                    )}

                    {/* Schools Section */}
                    {friariesByType.school.length > 0 && (
                        <CommunitySection
                            title="Schools & Educational Institutions"
                            icon={<School className="w-6 h-6 text-chart-4" />}
                            communities={friariesByType.school}
                            onSelect={setSelectedFriary}
                            borderColor="border-l-chart-4"
                            iconComponent={School}
                            onMessage={handleMessageFriary}
                        />
                    )}

                    {/* Retreat Centers Section */}
                    {friariesByType.retreat_center.length > 0 && (
                        <CommunitySection
                            title="Retreat Centers"
                            icon={<Home className="w-6 h-6 text-chart-5" />}
                            communities={friariesByType.retreat_center}
                            onSelect={setSelectedFriary}
                            borderColor="border-l-chart-5"
                            iconComponent={Home}
                            onMessage={handleMessageFriary}
                        />
                    )}

                    {filteredFriaries.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No communities found matching your search.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

interface CommunitySectionProps {
    title: string;
    icon: React.ReactNode;
    communities: Friary[];
    onSelect: (friary: Friary) => void;
    borderColor: string;
    iconComponent: React.ComponentType<{ className?: string }>;
    onMessage?: (friary: Friary) => void;
}

function CommunitySection({ title, icon, communities, onSelect, borderColor, iconComponent: Icon, onMessage }: CommunitySectionProps) {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((friary) => (
                    <Card
                        key={friary.id}
                        className={`hover:shadow-lg transition-all border-l-4 ${borderColor} hover:border-l-accent`}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{friary.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {friary.location}
                                    </p>
                                </div>
                                <Icon className="w-8 h-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {friary.guardianName && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Guardian:</span>
                                        <span className="font-medium">{friary.guardianName}</span>
                                    </div>
                                )}
                                {friary.memberCount !== undefined && friary.memberCount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Members:</span>
                                        <span className="font-medium flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {friary.memberCount}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-2 flex items-center justify-between gap-2">
                                    {onMessage && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMessage(friary);
                                            }}
                                            className="flex items-center gap-1 text-xs"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            Message
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => onSelect(friary)}
                                        className="flex items-center text-primary text-sm font-medium hover:underline ml-auto"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
