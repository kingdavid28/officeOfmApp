import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Upload, Trash2, FileText, Download, Eye, Search, Filter, RefreshCw, Calendar, User, FolderOpen } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseStorageService, UploadProgress } from '../../../lib/firebase-storage-service';

const fileCategories = [
    'Documents',
    'Reports',
    'Forms',
    'Policies',
    'Minutes',
    'Correspondence',
    'Other'
];

interface FileDocument {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    category: string;
    organizationId?: string;
    organizationName?: string;
    organizationType?: string;
    metadata?: Record<string, any>;
}

interface OrganizationFilesProps {
    organizationId: string;
    organizationName: string;
    organizationType: string;
}

export function OrganizationFiles({ organizationId, organizationName, organizationType }: OrganizationFilesProps) {
    const { user } = useAuth();
    const [files, setFiles] = useState<FileDocument[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        category: fileCategories[0],
        type: 'pdf',
        url: '',
        extractedContent: '',
        contentMetadata: null as any
    });

    useEffect(() => {
        loadFiles();
    }, [organizationId]);

    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const q = query(
                collection(db, 'files'),
                where('organizationId', '==', organizationId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);

            const orgFiles: FileDocument[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                uploadedAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
            } as FileDocument));

            setFiles(orgFiles);
            console.log(`Loaded ${orgFiles.length} files for ${organizationName}`);
        } catch (error) {
            console.error('Error loading organization files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = FirebaseStorageService.validateFile(file);
        if (!validation.valid) {
            alert(`Upload failed: ${validation.error}`);
            return;
        }

        setIsLoading(true);
        setUploadProgress({ bytesTransferred: 0, totalBytes: file.size, progress: 0 });

        try {
            let uploadResult = await FirebaseStorageService.uploadFile(
                file,
                formData.category,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            if (!uploadResult.success && uploadResult.error?.includes('CORS')) {
                const useFallback = confirm(
                    'Firebase Storage CORS is not configured.\n\n' +
                    'Click OK to use temporary storage (development only) or Cancel to configure CORS properly.'
                );

                if (!useFallback) {
                    setUploadProgress(null);
                    setIsLoading(false);
                    return;
                }

                uploadResult = await FirebaseStorageService.uploadFileAsFallback(
                    file,
                    formData.category,
                    (progress) => {
                        setUploadProgress(progress);
                    }
                );
            }

            if (uploadResult.success) {
                setFormData({
                    ...formData,
                    name: file.name,
                    type: file.type,
                    url: uploadResult.url!,
                    extractedContent: uploadResult.extractedContent || '',
                    contentMetadata: uploadResult.contentMetadata || {}
                });
                setUploadProgress(null);
            } else {
                alert(`Upload failed: ${uploadResult.error}`);
                setUploadProgress(null);
            }
        } catch (error: any) {
            alert(`Upload failed: ${error.message}`);
            setUploadProgress(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            console.error('No user found');
            return;
        }

        try {
            setIsLoading(true);

            const fileDoc: any = {
                name: formData.name,
                type: formData.type,
                size: formData.contentMetadata?.fileSize || 0,
                url: formData.url,
                uploadedBy: user.displayName || 'Unknown',
                category: formData.category,
                createdAt: new Date(),
                accessLevel: 'staff',
                extractedContent: formData.extractedContent || '',
                contentMetadata: formData.contentMetadata || {},
                hasContent: !!(formData.extractedContent && formData.extractedContent.length > 0),
                // Link to organization
                organizationId: organizationId,
                organizationName: organizationName,
                organizationType: organizationType
            };

            await addDoc(collection(db, 'files'), fileDoc);
            console.log('File saved to Firestore for', organizationName);

            await loadFiles();
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving file:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await deleteDoc(doc(db, 'files', id));
            await loadFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleViewFile = (file: FileDocument) => {
        if (file.url && file.url !== 'https://example.com/file.pdf' && !file.url.startsWith('blob:')) {
            window.open(file.url, '_blank');
        } else {
            alert(`File "${file.name}" cannot be viewed. Please re-upload the file.`);
        }
    };

    const handleDownloadFile = (file: FileDocument) => {
        if (file.url && file.url !== 'https://example.com/file.pdf' && !file.url.startsWith('blob:')) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`File "${file.name}" cannot be downloaded. Please re-upload the file.`);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: fileCategories[0],
            type: 'pdf',
            url: '',
            extractedContent: '',
            contentMetadata: null
        });
    };

    const filteredFiles = files.filter(file => {
        const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
        const matchesSearch = searchTerm === '' ||
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Documents': 'bg-blue-100 text-blue-800',
            'Reports': 'bg-green-100 text-green-800',
            'Forms': 'bg-purple-100 text-purple-800',
            'Policies': 'bg-red-100 text-red-800',
            'Minutes': 'bg-yellow-100 text-yellow-800',
            'Correspondence': 'bg-indigo-100 text-indigo-800',
            'Other': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['Other'];
    };

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Files & Documents</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {files.length} files • {formatFileSize(totalSize)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={loadFiles}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Upload File
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Upload File to {organizationName}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file-upload">Select File</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                        {formData.name ? (
                                            <div className="space-y-3">
                                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                                                    <FileText className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{formData.name}</p>
                                                    {uploadProgress ? (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-blue-600">
                                                                Uploading... {uploadProgress.progress.toFixed(1)}%
                                                            </p>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${uploadProgress.progress}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-green-600">Ready to save</p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFormData({ ...formData, name: '', url: '', extractedContent: '', contentMetadata: null });
                                                        setUploadProgress(null);
                                                    }}
                                                    disabled={isLoading}
                                                >
                                                    Remove File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                                                    <Upload className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <div>
                                                    <label htmlFor="file-upload" className="cursor-pointer">
                                                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                            Click to upload
                                                        </span>
                                                        <span className="text-gray-600"> or drag and drop</span>
                                                        <input
                                                            id="file-upload"
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handleFileUpload}
                                                        />
                                                    </label>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        PDF, DOC, DOCX, XLS, XLSX up to 50MB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="file-name">File Name</Label>
                                        <Input
                                            id="file-name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Document name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fileCategories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Uploading...' : 'Upload File'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {fileCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Files Display */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading files...</span>
                </div>
            ) : filteredFiles.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FolderOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || filterCategory !== 'all' ? 'No files found' : 'No files uploaded yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || filterCategory !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Upload your first file to get started'
                            }
                        </p>
                        {!searchTerm && filterCategory === 'all' && (
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Upload File
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => (
                        <Card key={file.id} className="group hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(file.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                                        {file.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                                        {file.category}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{file.uploadedBy}</span>
                                </div>

                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-1 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => handleViewFile(file)}
                                    >
                                        <Eye className="mr-1 h-3 w-3" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => handleDownloadFile(file)}
                                    >
                                        <Download className="mr-1 h-3 w-3" />
                                        Download
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
