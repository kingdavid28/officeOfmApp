import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Skeleton } from './ui/skeleton';
import {
    Plus,
    Upload,
    Trash2,
    Tag,
    DollarSign,
    Calendar as CalendarIcon,
    FileText,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Filter,
    Eye,
    Settings,
    BarChart3,
    Camera,
    Brain,
    Zap,
    Scan,
    AlertTriangle,
    Package,
    Car,
    Zap as UtilitiesIcon,
    Coffee,
    Monitor,
    Wrench,
    Megaphone,
    GraduationCap,
    Heart,
    Scale,
    Home,
    HelpCircle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { receiptService } from '../../lib/receipt-service';
import { authService, UserProfile } from '../../lib/auth';
import { FriaryFinancialReportGeneratorComponent } from './FriaryFinancialReportGenerator';
import { DetailedFinancialReportComponent } from './DetailedFinancialReport';
import { userPreferencesService, ReceiptViewScope } from '../../lib/user-preferences';
import { AICameraScanModal } from './AICameraScanModal';
import { AIFinancialDashboard } from './AIFinancialDashboard';
import { ReceiptViewScopeSelector } from './ReceiptViewScopeSelector';
import { ScannedReceiptData } from '../../lib/ai-receipt-scanner';
import {
    Receipt,
    ReceiptCategory,
    ReceiptType,
    ReceiptStatus,
    ReceiptFilter,
    ReceiptStats
} from '../../lib/receipt-types';

interface EnhancedReceiptManagerProps {
    currentUserId: string;
    userRole: 'staff' | 'admin' | 'super_admin';
}

export const EnhancedReceiptManager: React.FC<EnhancedReceiptManagerProps> = ({
    currentUserId,
    userRole
}) => {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [categories, setCategories] = useState<ReceiptCategory[]>([]);
    const [stats, setStats] = useState<ReceiptStats | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [initializingCategories, setInitializingCategories] = useState(false);

    // View scope state
    const [currentViewScope, setCurrentViewScope] = useState<ReceiptViewScope>('all');
    const [aiDashboardViewScope, setAIDashboardViewScope] = useState<ReceiptViewScope>('all');

    // Modal states
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
    const [isAICameraOpen, setIsAICameraOpen] = useState(false);
    const [isAIDashboardOpen, setIsAIDashboardOpen] = useState(false);

    // Filter states
    const [filter, setFilter] = useState<ReceiptFilter>({});
    const [activeTab, setActiveTab] = useState<'all' | 'official' | 'unofficial' | 'financial'>('all');

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        categoryId: '',
        type: 'unofficial' as ReceiptType,
        date: new Date().toISOString().split('T')[0],
        tags: '',
        vendor: '',
        invoiceNumber: '',
        taxAmount: '',
        notes: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    useEffect(() => {
        if (currentUserId) {
            loadData();
            loadUserPreferences();
        }
    }, [currentUserId]);

    useEffect(() => {
        // Reload data when view scope changes
        loadData();
    }, [currentViewScope]);

    const loadUserPreferences = async () => {
        if (!currentUserId) {
            console.warn('Cannot load user preferences: currentUserId is not available');
            return;
        }

        try {
            const preferences = await userPreferencesService.getUserPreferences(currentUserId);
            setCurrentViewScope(preferences.receiptViewScope);
            setAIDashboardViewScope(preferences.aiDashboardViewScope);
        } catch (error) {
            console.error('Error loading user preferences:', error);
            // Set default values on error
            setCurrentViewScope('all');
            setAIDashboardViewScope('all');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const [receiptsData, categoriesData, userProfile, statsData] = await Promise.all([
                receiptService.getVisibleReceipts(currentUserId, filter, currentViewScope),
                receiptService.getCategories(),
                authService.getUserProfile(currentUserId),
                receiptService.getReceiptStats(currentUserId, currentViewScope)
            ]);

            setReceipts(receiptsData);
            setCurrentUserProfile(userProfile);
            setStats(statsData);

            // Check if categories are empty and try to initialize them
            if (categoriesData.length === 0 && userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
                console.log('No categories found, attempting to initialize...');
                try {
                    await receiptService.initializeCategories(currentUserId);
                    // Reload categories after initialization
                    const newCategoriesData = await receiptService.getCategories();
                    setCategories(newCategoriesData);
                    console.log('Categories initialized successfully');
                } catch (initError) {
                    console.error('Failed to initialize categories:', initError);
                    setCategories(categoriesData); // Set empty array
                }
            } else {
                setCategories(categoriesData);
            }
        } catch (error) {
            console.error('Error loading receipt data:', error);
            // Set empty arrays to prevent undefined errors
            setReceipts([]);
            setCategories([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            amount: '',
            categoryId: '',
            type: 'unofficial',
            date: new Date().toISOString().split('T')[0],
            tags: '',
            vendor: '',
            invoiceNumber: '',
            taxAmount: '',
            notes: ''
        });
        setSelectedFile(null);
        setPreviewUrl('');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile || !currentUserProfile) {
            alert('Please select a file and ensure you are logged in');
            return;
        }

        setUploading(true);

        try {
            // Upload file
            const fileData = await receiptService.uploadReceiptFile(selectedFile, currentUserId);

            // Get category name
            const category = categories.find(c => c.id === formData.categoryId);
            if (!category) {
                throw new Error('Invalid category selected');
            }

            // Prepare receipt data
            const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

            const receiptData: Omit<Receipt, 'id' | 'uploadedAt'> = {
                title: formData.title,
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: category.name,
                categoryId: formData.categoryId,
                type: formData.type,
                status: 'pending',
                date: formData.date,
                imageUrl: fileData.url,
                fileName: fileData.fileName,
                fileSize: fileData.fileSize,
                mimeType: fileData.mimeType,
                tags,
                uploadedBy: currentUserId,
                uploadedByName: currentUserProfile.name,
                ownerId: currentUserId,
                assignedAdminId: currentUserProfile.assignedAdminId,
                visibility: 'admin',
                metadata: {
                    vendor: formData.vendor || undefined,
                    invoiceNumber: formData.invoiceNumber || undefined,
                    taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
                    notes: formData.notes || undefined
                }
            };

            await receiptService.createReceipt(receiptData);

            setIsUploadDialogOpen(false);
            resetForm();
            await loadData();

            alert('Receipt uploaded successfully!');
        } catch (error) {
            console.error('Error uploading receipt:', error);
            alert('Error uploading receipt. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (receiptId: string) => {
        if (!confirm('Are you sure you want to delete this receipt?')) return;

        try {
            await receiptService.deleteReceipt(receiptId, currentUserId);
            await loadData();
            alert('Receipt deleted successfully');
        } catch (error) {
            console.error('Error deleting receipt:', error);
            alert('Error deleting receipt');
        }
    };

    const handleAIScanComplete = (scannedData: ScannedReceiptData, imageFile: File) => {
        // Pre-fill form with AI-extracted data
        setFormData({
            title: scannedData.extractedData.vendor || 'AI Scanned Receipt',
            description: `Scanned receipt from ${scannedData.extractedData.vendor || 'unknown vendor'}`,
            amount: scannedData.extractedData.amount?.toString() || '',
            categoryId: categories.find(c => c.name === scannedData.suggestedCategory)?.id || '',
            type: 'unofficial',
            date: scannedData.extractedData.date || new Date().toISOString().split('T')[0],
            tags: 'ai-scanned',
            vendor: scannedData.extractedData.vendor || '',
            invoiceNumber: scannedData.extractedData.invoiceNumber || '',
            taxAmount: scannedData.extractedData.taxAmount?.toString() || '',
            notes: `AI Confidence: ${Math.round(scannedData.confidence)}%`
        });

        // Set the scanned image
        setSelectedFile(imageFile);
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);

        // Open upload dialog with pre-filled data
        setIsAICameraOpen(false);
        setIsUploadDialogOpen(true);
    };

    const handleApprove = async (receiptId: string) => {
        try {
            await receiptService.approveReceipt(receiptId, currentUserId);
            await loadData();
            alert('Receipt approved successfully');
        } catch (error) {
            console.error('Error approving receipt:', error);
            alert('Error approving receipt');
        }
    };

    const handleReject = async (receiptId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await receiptService.rejectReceipt(receiptId, currentUserId, reason);
            await loadData();
            alert('Receipt rejected');
        } catch (error) {
            console.error('Error rejecting receipt:', error);
            alert('Error rejecting receipt');
        }
    };

    const handleDownload = async (receiptId: string) => {
        try {
            const url = await receiptService.downloadReceipt(receiptId, currentUserId);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Error downloading receipt');
        }
    };

    const handleViewScopeChange = async (newScope: ReceiptViewScope) => {
        try {
            setCurrentViewScope(newScope);
            await userPreferencesService.updateReceiptViewScope(currentUserId, newScope);
        } catch (error) {
            console.error('Error updating view scope:', error);
        }
    };

    const handleAIDashboardViewScopeChange = async (newScope: ReceiptViewScope) => {
        try {
            setAIDashboardViewScope(newScope);
            await userPreferencesService.updateAIDashboardViewScope(currentUserId, newScope);
        } catch (error) {
            console.error('Error updating AI dashboard view scope:', error);
        }
    };

    const handleSetAsDefaultView = async (scope: ReceiptViewScope) => {
        try {
            await userPreferencesService.updateDefaultReceiptView(currentUserId, scope);
            alert('Default view updated successfully!');
        } catch (error) {
            console.error('Error setting default view:', error);
            alert('Error updating default view');
        }
    };

    const getStatusIcon = (status: ReceiptStatus) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getTypeIcon = (type: ReceiptType) => {
        return type === 'official' ?
            <Shield className="w-4 h-4 text-blue-600" /> :
            <FileText className="w-4 h-4 text-gray-600" />;
    };

    const getCategoryIcon = (categoryName: string) => {
        switch (categoryName) {
            case 'Office Supplies':
                return <Package className="w-4 h-4" />;
            case 'Transportation':
                return <Car className="w-4 h-4" />;
            case 'Utilities':
                return <UtilitiesIcon className="w-4 h-4" />;
            case 'Meals & Entertainment':
                return <Coffee className="w-4 h-4" />;
            case 'Equipment':
                return <Monitor className="w-4 h-4" />;
            case 'Services':
                return <Wrench className="w-4 h-4" />;
            case 'Marketing & Advertising':
                return <Megaphone className="w-4 h-4" />;
            case 'Training & Education':
                return <GraduationCap className="w-4 h-4" />;
            case 'Medical & Health':
                return <Heart className="w-4 h-4" />;
            case 'Legal & Compliance':
                return <Scale className="w-4 h-4" />;
            case 'Maintenance & Repairs':
                return <Home className="w-4 h-4" />;
            case 'Other':
                return <HelpCircle className="w-4 h-4" />;
            default:
                return <Tag className="w-4 h-4" />;
        }
    };

    const filteredReceipts = receipts.filter(receipt => {
        if (activeTab === 'official' && receipt.type !== 'official') return false;
        if (activeTab === 'unofficial' && receipt.type !== 'unofficial') return false;
        return true;
    });

    const canApprove = (receipt: Receipt) => {
        return (userRole === 'admin' && receipt.assignedAdminId === currentUserId) ||
            userRole === 'super_admin';
    };

    const canDelete = (receipt: Receipt) => {
        return receipt.ownerId === currentUserId ||
            (userRole === 'admin' && receipt.assignedAdminId === currentUserId) ||
            userRole === 'super_admin';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-9 w-48 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                </div>

                {/* Summary Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs and Content Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        {/* Tab Headers */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex space-x-1">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                            <Skeleton className="h-9 w-20" />
                        </div>

                        {/* Receipt Cards Grid Skeleton */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    {/* Image Skeleton */}
                                    <div className="aspect-video relative">
                                        <Skeleton className="w-full h-full" />
                                        <div className="absolute top-2 left-2 flex gap-1">
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Card Header */}
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </div>
                                    </CardHeader>

                                    {/* Card Content */}
                                    <CardContent>
                                        <div className="space-y-3">
                                            {/* Amount and Actions */}
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-7 w-20" />
                                                <div className="flex gap-1">
                                                    <Skeleton className="w-8 h-8 rounded" />
                                                    <Skeleton className="w-8 h-8 rounded" />
                                                </div>
                                            </div>

                                            {/* Category and Status */}
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-5 w-24 rounded-full" />
                                                <Skeleton className="h-5 w-20 rounded-full" />
                                            </div>

                                            {/* Date */}
                                            <Skeleton className="h-4 w-28" />

                                            {/* Uploaded by */}
                                            <Skeleton className="h-4 w-32" />

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1">
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                                <Skeleton className="h-5 w-20 rounded-full" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Receipt Manager</h2>
                    <p className="text-muted-foreground">
                        Upload and manage official and unofficial receipts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Scope Selector for Admins */}
                    {userRole === 'admin' && (
                        <ReceiptViewScopeSelector
                            currentScope={currentViewScope}
                            userRole={userRole}
                            onScopeChange={handleViewScopeChange}
                            onSetAsDefault={handleSetAsDefaultView}
                            showSetAsDefault={true}
                        />
                    )}

                    {stats && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAIDashboardOpen(true)}
                            >
                                <Brain className="w-4 h-4 mr-2" />
                                AI Insights
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsStatsDialogOpen(true)}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Statistics
                            </Button>
                        </>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => setIsAICameraOpen(true)}
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        AI Scan
                    </Button>

                    <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                        setIsUploadDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Receipt
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Upload New Receipt</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="receipt-file" className="text-sm font-medium">
                                        Receipt File *
                                    </Label>
                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${previewUrl
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                        }`}>
                                        {previewUrl ? (
                                            <div className="space-y-4">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Receipt preview"
                                                        className="max-h-48 mx-auto rounded-lg shadow-sm border"
                                                    />
                                                    <div className="absolute -top-2 -right-2">
                                                        <div className="bg-green-100 text-green-600 rounded-full p-1">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-green-800">
                                                        File uploaded successfully
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        {selectedFile?.name} ({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedFile(null);
                                                            setPreviewUrl('');
                                                        }}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Remove File
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Upload className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div>
                                                    <label htmlFor="receipt-file" className="cursor-pointer">
                                                        <span className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                                            Upload a receipt file
                                                        </span>
                                                        <input
                                                            id="receipt-file"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={handleFileSelect}
                                                            required
                                                        />
                                                    </label>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        or drag and drop your file here
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        <span>PNG, JPG, PDF</span>
                                                    </div>
                                                    <div className="w-px h-4 bg-gray-300"></div>
                                                    <div className="flex items-center gap-1">
                                                        <Upload className="w-3 h-3" />
                                                        <span>Max 10MB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!selectedFile && (
                                        <p className="text-xs text-muted-foreground">
                                            Upload a clear image or PDF of your receipt for processing
                                        </p>
                                    )}
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-medium">
                                            Receipt Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Office supplies purchase"
                                            required
                                            className="w-full"
                                        />
                                        {!formData.title && (
                                            <p className="text-xs text-muted-foreground">
                                                Enter a descriptive title for this receipt
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-sm font-medium">
                                            Receipt Type *
                                        </Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: ReceiptType) => setFormData({ ...formData, type: value })}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select receipt type..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="official" className="cursor-pointer">
                                                    <div className="flex items-center gap-3 py-2">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                                            <Shield className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">Official Receipt</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Formal business receipts with tax implications
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="unofficial" className="cursor-pointer">
                                                    <div className="flex items-center gap-3 py-2">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                                                            <FileText className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">Unofficial Receipt</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Informal receipts for internal tracking
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {formData.type && (
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>
                                                    {formData.type === 'official' ? 'Official receipt selected' : 'Unofficial receipt selected'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Additional details about this receipt (optional)"
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Provide any additional context or details about this expense
                                    </p>
                                </div>

                                {/* Amount, Date, and Category */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-sm font-medium">
                                            Amount (₱) *
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        {formData.amount && parseFloat(formData.amount) > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>₱{parseFloat(formData.amount).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-sm font-medium">
                                            Receipt Date *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        {formData.date && (
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>{new Date(formData.date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-medium">
                                            Category *
                                        </Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose a category..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {categories.length === 0 ? (
                                                    <div className="p-6 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium text-gray-900">No categories available</p>
                                                                <p className="text-xs text-muted-foreground max-w-xs">
                                                                    Receipt categories need to be initialized.
                                                                    {(userRole === 'admin' || userRole === 'super_admin')
                                                                        ? ' Click below to set up default categories.'
                                                                        : ' Please contact your administrator.'
                                                                    }
                                                                </p>
                                                            </div>
                                                            {(userRole === 'admin' || userRole === 'super_admin') && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={initializingCategories}
                                                                    onClick={async () => {
                                                                        try {
                                                                            setInitializingCategories(true);
                                                                            await receiptService.initializeCategories(currentUserId);
                                                                            await loadData(); // Reload data to get new categories
                                                                            alert('Categories initialized successfully!');
                                                                        } catch (error) {
                                                                            console.error('Failed to initialize categories:', error);
                                                                            alert('Failed to initialize categories. Please try again.');
                                                                        } finally {
                                                                            setInitializingCategories(false);
                                                                        }
                                                                    }}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                >
                                                                    {initializingCategories ? (
                                                                        <>
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                            Initializing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Plus className="w-3 h-3 mr-1" />
                                                                            Initialize Categories
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Popular/Common Categories First */}
                                                        {categories
                                                            .filter(cat => ['Office Supplies', 'Transportation', 'Meals & Entertainment', 'Equipment'].includes(cat.name))
                                                            .map((category) => (
                                                                <SelectItem
                                                                    key={category.id}
                                                                    value={category.id}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div className="flex items-start gap-3 py-1">
                                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mt-0.5">
                                                                            {getCategoryIcon(category.name)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-medium text-sm">{category.name}</div>
                                                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                                                {category.description}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        }

                                                        {/* Separator for other categories */}
                                                        {categories.filter(cat => !['Office Supplies', 'Transportation', 'Meals & Entertainment', 'Equipment'].includes(cat.name)).length > 0 && (
                                                            <div className="px-2 py-1">
                                                                <div className="border-t border-muted"></div>
                                                            </div>
                                                        )}

                                                        {/* Other Categories */}
                                                        {categories
                                                            .filter(cat => !['Office Supplies', 'Transportation', 'Meals & Entertainment', 'Equipment'].includes(cat.name))
                                                            .sort((a, b) => a.name.localeCompare(b.name))
                                                            .map((category) => (
                                                                <SelectItem
                                                                    key={category.id}
                                                                    value={category.id}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <div className="flex items-start gap-3 py-1">
                                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mt-0.5">
                                                                            {getCategoryIcon(category.name)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-medium text-sm">{category.name}</div>
                                                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                                                {category.description}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        }
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {!formData.categoryId && (
                                            <p className="text-xs text-muted-foreground">
                                                Select the category that best describes this expense
                                            </p>
                                        )}
                                        {formData.categoryId && (
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Category selected</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <div className="h-px bg-border flex-1"></div>
                                        <span>Additional Information</span>
                                        <div className="h-px bg-border flex-1"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="vendor" className="text-sm font-medium">
                                                Vendor/Supplier
                                            </Label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="vendor"
                                                    value={formData.vendor}
                                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                                    placeholder="Company or person name"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Who did you purchase from?
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="invoiceNumber" className="text-sm font-medium">
                                                Invoice/Receipt Number
                                            </Label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="invoiceNumber"
                                                    value={formData.invoiceNumber}
                                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                                    placeholder="Receipt or invoice number"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Reference number from the receipt
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="taxAmount" className="text-sm font-medium">
                                                Tax Amount (₱)
                                            </Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="taxAmount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.taxAmount}
                                                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                VAT or other tax amount (if applicable)
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tags" className="text-sm font-medium">
                                                Tags
                                            </Label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="tags"
                                                    value={formData.tags}
                                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                    placeholder="e.g., urgent, reimbursable, project-alpha"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Separate multiple tags with commas
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm font-medium">
                                            Notes
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Additional notes or comments about this expense..."
                                            rows={3}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Any additional context, approval requirements, or special notes
                                        </p>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsUploadDialogOpen(false)}
                                        disabled={uploading}
                                        className="sm:w-auto w-full"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={uploading || !selectedFile || !formData.title || !formData.amount || !formData.categoryId}
                                        className="sm:w-auto w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Uploading Receipt...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Receipt
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Form Validation Summary */}
                                {(!selectedFile || !formData.title || !formData.amount || !formData.categoryId) && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-800 mb-1">Please complete the required fields:</p>
                                                <ul className="text-amber-700 space-y-1">
                                                    {!selectedFile && <li>• Upload a receipt file</li>}
                                                    {!formData.title && <li>• Enter a receipt title</li>}
                                                    {!formData.amount && <li>• Enter the amount</li>}
                                                    {!formData.categoryId && <li>• Select a category</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                                    <p className="text-2xl font-bold">{stats.totalReceipts}</p>
                                </div>
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">₱{stats.totalAmount.toLocaleString()}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Official</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.officialReceipts}</p>
                                </div>
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="all">All Receipts</TabsTrigger>
                                <TabsTrigger value="official">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Official
                                </TabsTrigger>
                                <TabsTrigger value="unofficial">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Unofficial
                                </TabsTrigger>
                                <TabsTrigger value="financial">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Financial Report
                                </TabsTrigger>
                            </TabsList>

                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        <TabsContent value="all" className="mt-0">
                            {filteredReceipts.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        No receipts found. Upload your first receipt to get started!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredReceipts.map((receipt) => (
                                        <Card
                                            key={receipt.id}
                                            className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => {
                                                setSelectedReceipt(receipt);
                                                setIsViewDialogOpen(true);
                                            }}
                                        >
                                            <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                                                <img
                                                    src={receipt.imageUrl}
                                                    alt={receipt.title}
                                                    className="object-cover w-full h-full"
                                                />
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    {getTypeIcon(receipt.type)}
                                                    {getStatusIcon(receipt.status)}
                                                </div>
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-base line-clamp-2 flex items-center justify-between">
                                                    <span>{receipt.title}</span>
                                                    <Badge variant={receipt.type === 'official' ? 'default' : 'secondary'}>
                                                        {receipt.type}
                                                    </Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-2xl font-bold">
                                                            ₱{receipt.amount.toLocaleString()}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(receipt.id);
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {canDelete(receipt) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(receipt.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline">{receipt.category}</Badge>
                                                        <Badge variant={
                                                            receipt.status === 'approved' ? 'default' :
                                                                receipt.status === 'rejected' ? 'destructive' : 'secondary'
                                                        }>
                                                            {receipt.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {new Date(receipt.date).toLocaleDateString()}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        By: {receipt.uploadedByName}
                                                    </div>

                                                    {receipt.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {receipt.tags.slice(0, 2).map((tag) => (
                                                                <Badge key={tag} variant="outline" className="text-xs">
                                                                    <Tag className="h-2 w-2 mr-1" />
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                            {receipt.tags.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{receipt.tags.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {canApprove(receipt) && receipt.status === 'pending' && (
                                                        <div className="flex gap-2 mt-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(receipt.id);
                                                                }}
                                                                className="flex-1"
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReject(receipt.id);
                                                                }}
                                                                className="flex-1"
                                                            >
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="official" className="mt-0">
                            {filteredReceipts.filter(r => r.type === 'official').length === 0 ? (
                                <div className="text-center py-8">
                                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        No official receipts found.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredReceipts.filter(r => r.type === 'official').map((receipt) => (
                                        <Card
                                            key={receipt.id}
                                            className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => {
                                                setSelectedReceipt(receipt);
                                                setIsViewDialogOpen(true);
                                            }}
                                        >
                                            {/* Same receipt card content as above */}
                                            <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                                                <img
                                                    src={receipt.imageUrl}
                                                    alt={receipt.title}
                                                    className="object-cover w-full h-full"
                                                />
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    {getTypeIcon(receipt.type)}
                                                    {getStatusIcon(receipt.status)}
                                                </div>
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-base line-clamp-2 flex items-center justify-between">
                                                    <span>{receipt.title}</span>
                                                    <Badge variant="default">Official</Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-2xl font-bold">
                                                            ₱{receipt.amount.toLocaleString()}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(receipt.id);
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {canDelete(receipt) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(receipt.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline">{receipt.category}</Badge>
                                                        <Badge variant={
                                                            receipt.status === 'approved' ? 'default' :
                                                                receipt.status === 'rejected' ? 'destructive' : 'secondary'
                                                        }>
                                                            {receipt.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {new Date(receipt.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        By: {receipt.uploadedByName}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="unofficial" className="mt-0">
                            {filteredReceipts.filter(r => r.type === 'unofficial').length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        No unofficial receipts found.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredReceipts.filter(r => r.type === 'unofficial').map((receipt) => (
                                        <Card
                                            key={receipt.id}
                                            className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => {
                                                setSelectedReceipt(receipt);
                                                setIsViewDialogOpen(true);
                                            }}
                                        >
                                            {/* Same receipt card content as above */}
                                            <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                                                <img
                                                    src={receipt.imageUrl}
                                                    alt={receipt.title}
                                                    className="object-cover w-full h-full"
                                                />
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    {getTypeIcon(receipt.type)}
                                                    {getStatusIcon(receipt.status)}
                                                </div>
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-base line-clamp-2 flex items-center justify-between">
                                                    <span>{receipt.title}</span>
                                                    <Badge variant="secondary">Unofficial</Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-2xl font-bold">
                                                            ₱{receipt.amount.toLocaleString()}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(receipt.id);
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {canDelete(receipt) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(receipt.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline">{receipt.category}</Badge>
                                                        <Badge variant={
                                                            receipt.status === 'approved' ? 'default' :
                                                                receipt.status === 'rejected' ? 'destructive' : 'secondary'
                                                        }>
                                                            {receipt.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {new Date(receipt.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        By: {receipt.uploadedByName}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="financial" className="mt-0">
                            <Tabs defaultValue="summary" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="summary" className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Summary Report
                                    </TabsTrigger>
                                    <TabsTrigger value="detailed" className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Detailed Transactions
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="summary" className="mt-4">
                                    <FriaryFinancialReportGeneratorComponent
                                        currentUserUid={currentUserId}
                                        currentUserName={currentUserProfile?.name || 'Unknown User'}
                                        userRole={userRole}
                                    />
                                </TabsContent>

                                <TabsContent value="detailed" className="mt-4">
                                    <DetailedFinancialReportComponent
                                        currentUserUid={currentUserId}
                                        currentUserName={currentUserProfile?.name || 'Unknown User'}
                                        userRole={userRole}
                                    />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Receipt View Dialog */}
            {selectedReceipt && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {getTypeIcon(selectedReceipt.type)}
                                {selectedReceipt.title}
                                <Badge variant={selectedReceipt.type === 'official' ? 'default' : 'secondary'}>
                                    {selectedReceipt.type}
                                </Badge>
                                <Badge variant={
                                    selectedReceipt.status === 'approved' ? 'default' :
                                        selectedReceipt.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                    {selectedReceipt.status}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <img
                                src={selectedReceipt.imageUrl}
                                alt={selectedReceipt.title}
                                className="w-full rounded-lg max-h-96 object-contain"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Amount</Label>
                                    <p className="text-2xl font-bold">
                                        ₱{selectedReceipt.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <p>{new Date(selectedReceipt.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <p>{selectedReceipt.category}</p>
                                </div>
                                <div>
                                    <Label>Uploaded By</Label>
                                    <p>{selectedReceipt.uploadedByName}</p>
                                </div>
                            </div>

                            {selectedReceipt.description && (
                                <div>
                                    <Label>Description</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedReceipt.description}
                                    </p>
                                </div>
                            )}

                            {selectedReceipt.metadata && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedReceipt.metadata.vendor && (
                                        <div>
                                            <Label>Vendor</Label>
                                            <p>{selectedReceipt.metadata.vendor}</p>
                                        </div>
                                    )}
                                    {selectedReceipt.metadata.invoiceNumber && (
                                        <div>
                                            <Label>Invoice Number</Label>
                                            <p>{selectedReceipt.metadata.invoiceNumber}</p>
                                        </div>
                                    )}
                                    {selectedReceipt.metadata.taxAmount && (
                                        <div>
                                            <Label>Tax Amount</Label>
                                            <p>₱{selectedReceipt.metadata.taxAmount.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedReceipt.metadata?.notes && (
                                <div>
                                    <Label>Notes</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedReceipt.metadata.notes}
                                    </p>
                                </div>
                            )}

                            {selectedReceipt.tags.length > 0 && (
                                <div>
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedReceipt.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReceipt.status === 'approved' && selectedReceipt.approvedByName && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        <strong>Approved by:</strong> {selectedReceipt.approvedByName} on{' '}
                                        {selectedReceipt.approvedAt && new Date(selectedReceipt.approvedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            {selectedReceipt.status === 'rejected' && selectedReceipt.rejectedByName && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">
                                        <strong>Rejected by:</strong> {selectedReceipt.rejectedByName} on{' '}
                                        {selectedReceipt.rejectedAt && new Date(selectedReceipt.rejectedAt).toLocaleDateString()}
                                    </p>
                                    {selectedReceipt.rejectionReason && (
                                        <p className="text-sm text-red-700 mt-1">
                                            <strong>Reason:</strong> {selectedReceipt.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownload(selectedReceipt.id)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>

                                {canApprove(selectedReceipt) && selectedReceipt.status === 'pending' && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                handleApprove(selectedReceipt.id);
                                                setIsViewDialogOpen(false);
                                            }}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                handleReject(selectedReceipt.id);
                                                setIsViewDialogOpen(false);
                                            }}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Statistics Dialog */}
            {stats && (
                <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Receipt Statistics</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{stats.officialReceipts}</p>
                                    <p className="text-sm text-blue-800">Official Receipts</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-600">{stats.unofficialReceipts}</p>
                                    <p className="text-sm text-gray-800">Unofficial Receipts</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
                                    <p className="text-xs text-yellow-800">Pending</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-xl font-bold text-green-600">{stats.approvedReceipts}</p>
                                    <p className="text-xs text-green-800">Approved</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-xl font-bold text-red-600">{stats.rejectedReceipts}</p>
                                    <p className="text-xs text-red-800">Rejected</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Categories Breakdown</h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.categoriesBreakdown).map(([category, data]) => (
                                        <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm">{category}</span>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{data.count} receipts</p>
                                                <p className="text-xs text-muted-foreground">₱{data.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* AI Camera Scan Modal */}
            <AICameraScanModal
                isOpen={isAICameraOpen}
                onClose={() => setIsAICameraOpen(false)}
                onScanComplete={handleAIScanComplete}
            />

            {/* AI Financial Dashboard */}
            <AIFinancialDashboard
                receipts={receipts}
                isOpen={isAIDashboardOpen}
                onClose={() => setIsAIDashboardOpen(false)}
                currentUserId={currentUserId}
                userRole={userRole}
                initialViewScope={aiDashboardViewScope}
                onViewScopeChange={handleAIDashboardViewScopeChange}
            />
        </div>
    );
};