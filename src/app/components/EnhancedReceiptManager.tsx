import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
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
    BarChart3
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

    // Modal states
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);

    // Filter states
    const [filter, setFilter] = useState<ReceiptFilter>({});
    const [activeTab, setActiveTab] = useState<'all' | 'official' | 'unofficial'>('all');

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
        loadData();
    }, [currentUserId]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [receiptsData, categoriesData, userProfile, statsData] = await Promise.all([
                receiptService.getVisibleReceipts(currentUserId, filter),
                receiptService.getCategories(),
                authService.getUserProfile(currentUserId),
                receiptService.getReceiptStats(currentUserId)
            ]);

            setReceipts(receiptsData);
            setCategories(categoriesData);
            setCurrentUserProfile(userProfile);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading receipt data:', error);
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
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading receipts...</p>
                </div>
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
                    {stats && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsStatsDialogOpen(true)}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Statistics
                        </Button>
                    )}

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
                                    <Label htmlFor="receipt-file">Receipt File *</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        {previewUrl ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={previewUrl}
                                                    alt="Receipt preview"
                                                    className="max-h-48 mx-auto rounded"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        setPreviewUrl('');
                                                    }}
                                                >
                                                    Remove File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <div className="mt-2">
                                                    <label htmlFor="receipt-file" className="cursor-pointer">
                                                        <span className="text-primary hover:underline">
                                                            Upload a file
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
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        PNG, JPG, PDF up to 10MB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Office supplies purchase"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Receipt Type *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: ReceiptType) => setFormData({ ...formData, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="official">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-blue-600" />
                                                        Official Receipt
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="unofficial">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-600" />
                                                        Unofficial Receipt
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Additional details about this receipt"
                                        rows={2}
                                    />
                                </div>

                                {/* Amount and Date */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₱) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor">Vendor/Supplier</Label>
                                        <Input
                                            id="vendor"
                                            value={formData.vendor}
                                            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                            placeholder="Company or person"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invoiceNumber">Invoice/Receipt Number</Label>
                                        <Input
                                            id="invoiceNumber"
                                            value={formData.invoiceNumber}
                                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                            placeholder="Receipt or invoice number"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="taxAmount">Tax Amount (₱)</Label>
                                        <Input
                                            id="taxAmount"
                                            type="number"
                                            step="0.01"
                                            value={formData.taxAmount}
                                            onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags (comma separated)</Label>
                                        <Input
                                            id="tags"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            placeholder="e.g., urgent, reimbursable"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes or comments"
                                        rows={2}
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsUploadDialogOpen(false)}
                                        disabled={uploading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Upload Receipt'}
                                    </Button>
                                </div>
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
                            </TabsList>

                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        <TabsContent value={activeTab} className="mt-0">
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
        </div>
    );
};