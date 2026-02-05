import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Upload, Trash2, FileText, Download, Eye, Search, Filter, Grid, List, RefreshCw, Calendar, User, FolderOpen } from 'lucide-react';
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
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

import { FileContentExtractor } from '../../lib/file-content-extractor';
import { ContentProcessingService } from '../../lib/content-processing-service';
import { FirebaseStorageService, UploadProgress } from '../../lib/firebase-storage-service';
import { getAllFriaries } from '../../lib/friary-service';
import { Friary, getFriaryTypeDisplay } from '../../lib/friary-types';

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
  metadata?: Record<string, any>;
  // Organization linking for super admin file access
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
}

export function FileManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileDocument | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOrganization, setFilterOrganization] = useState<string>('all');
  const [organizations, setOrganizations] = useState<Friary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: fileCategories[0],
    type: 'pdf',
    url: '',
    extractedContent: '',
    contentMetadata: null as any,
    organizationId: '',
    organizationName: '',
    organizationType: ''
  });

  // Load files and organizations from Firestore on component mount
  useEffect(() => {
    loadFiles();
    loadProcessingStats();
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await getAllFriaries();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  // Get files that need re-uploading (have blob URLs or no URLs, but not data URLs)
  const getFilesNeedingReupload = () => {
    return files.filter(file =>
      !file.url ||
      file.url === 'https://example.com/file.pdf' ||
      file.url.startsWith('blob:')
      // Note: data: URLs are functional, so we don't include them
    );
  };

  const handleBulkReuploadInfo = () => {
    const needReupload = getFilesNeedingReupload();
    if (needReupload.length === 0) {
      alert('All files have valid storage URLs! No re-upload needed.');
      return;
    }

    const fileList = needReupload.map(f => `• ${f.name}`).join('\n');
    alert(`${needReupload.length} files need to be re-uploaded:\n\n${fileList}\n\nThese files have temporary or missing URLs and cannot be accessed. Please re-upload them to get permanent storage URLs.`);
  };

  const loadProcessingStats = async () => {
    try {
      const stats = await ContentProcessingService.getProcessingStats();
      setProcessingStats(stats);
    } catch (error) {
      console.error('Error loading processing stats:', error);
    }
  };

  const handleProcessAllFiles = async () => {
    if (!confirm('This will process all files to extract their content for AI search. This may take a while. Continue?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ContentProcessingService.processAllFiles();

      alert(`Content processing completed!\n\nProcessed: ${result.processed}\nFailed: ${result.failed}\nSkipped: ${result.skipped}\n\nFiles with extracted content can now be searched by their actual content.`);

      // Reload files and stats
      await loadFiles();
      await loadProcessingStats();
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Content processing failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const firestoreFiles: FileDocument[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      } as FileDocument));

      setFiles(firestoreFiles);
      console.log(`Loaded ${firestoreFiles.length} files from Firestore for AI search`);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFile = (file: FileDocument) => {
    console.log('Attempting to view file:', file);

    // Check if URL is valid and accessible
    if (file.url && file.url !== 'https://example.com/file.pdf' && !file.url.startsWith('blob:')) {
      if (file.url.startsWith('data:')) {
        // Data URL from fallback method - open in new tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5;">
                <div style="text-align:center;">
                  <h3>${file.name}</h3>
                  <p>File stored using fallback method (development mode)</p>
                  <a href="${file.url}" download="${file.name}" style="display:inline-block; padding:10px 20px; background:#007bff; color:white; text-decoration:none; border-radius:5px; margin:10px;">Download File</a>
                </div>
              </body>
            </html>
          `);
        }
      } else {
        // Valid Firebase Storage URL - open in new tab
        window.open(file.url, '_blank');
      }
    } else if (file.url && file.url.startsWith('blob:')) {
      // Blob URL detected - these are temporary and won't work after page reload
      console.warn('Blob URL detected for file:', file.name, 'URL:', file.url);
      setSelectedFile(file);
      alert(`File "${file.name}" cannot be viewed because it uses a temporary URL.\n\nThis happens when:\n• Files were uploaded but not properly saved to cloud storage\n• The file was uploaded in a previous session\n\nSolution:\n• Re-upload the file to get a permanent storage URL\n• Contact your administrator to fix the storage configuration`);
    } else {
      // No valid URL at all
      console.warn('No valid URL for file:', file.name, 'URL:', file.url);
      setSelectedFile(file);
      alert(`File "${file.name}" cannot be viewed directly.\n\nThis might be because:\n• The file URL is not properly stored\n• The file storage service is not configured\n• The file needs to be re-uploaded\n\nPlease try re-uploading the file or contact your administrator.`);
    }
  };

  const handleDownloadFile = (file: FileDocument) => {
    console.log('Attempting to download file:', file);

    // Check if URL is valid and accessible
    if (file.url && file.url !== 'https://example.com/file.pdf' && !file.url.startsWith('blob:')) {
      try {
        // Create download link for both Firebase Storage URLs and data URLs
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.target = '_blank'; // Fallback to opening in new tab if download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback: try opening in new tab
        window.open(file.url, '_blank');
      }
    } else if (file.url && file.url.startsWith('blob:')) {
      // Blob URL detected - these are temporary and won't work
      console.warn('Blob URL detected for file:', file.name, 'URL:', file.url);
      alert(`File "${file.name}" cannot be downloaded because it uses a temporary URL.\n\nThis happens when:\n• Files were uploaded but not properly saved to cloud storage\n• The file was uploaded in a previous session\n\nSolution:\n• Re-upload the file to get a permanent storage URL\n• Contact your administrator to fix the storage configuration`);
    } else {
      // No valid URL at all
      console.warn('No valid URL for file:', file.name, 'URL:', file.url);
      alert(`File "${file.name}" cannot be downloaded.\n\nThis might be because:\n• The file URL is not properly stored\n• The file storage service is not configured\n• The file needs to be re-uploaded\n\nPlease try re-uploading the file or contact your administrator.`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: fileCategories[0],
      type: 'pdf',
      url: '',
      extractedContent: '',
      contentMetadata: null,
      organizationId: '',
      organizationName: '',
      organizationType: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = FirebaseStorageService.validateFile(file);
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      return;
    }

    setIsLoading(true);
    setUploadProgress({ bytesTransferred: 0, totalBytes: file.size, progress: 0 });

    try {
      console.log('Starting file upload:', file.name);

      // Try Firebase Storage first
      let uploadResult = await FirebaseStorageService.uploadFile(
        file,
        formData.category,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // If Firebase Storage fails, try fallback method
      if (!uploadResult.success && uploadResult.error?.includes('CORS')) {
        console.log('Firebase Storage failed with CORS error');
        console.warn('⚠️ CORS not configured properly. Please run: gsutil cors set cors.json gs://officeofmapp.appspot.com');

        const useFallback = confirm(
          'Firebase Storage CORS is not configured.\n\n' +
          'Options:\n' +
          '1. Click OK to use temporary storage (development only)\n' +
          '2. Click Cancel and configure CORS properly\n\n' +
          'For production, you should configure CORS by running:\n' +
          'gsutil cors set cors.json gs://officeofmapp.appspot.com'
        );

        if (!useFallback) {
          alert('Upload cancelled. Please configure Firebase Storage CORS for production use.');
          setUploadProgress(null);
          setIsLoading(false);
          return;
        }

        console.log('User chose to use fallback method...');
        uploadResult = await FirebaseStorageService.uploadFileAsFallback(
          file,
          formData.category,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      }

      if (uploadResult.success) {
        console.log('Upload successful:', uploadResult);

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
        console.error('Upload failed:', uploadResult.error);
        alert(`Upload failed: ${uploadResult.error}`);
        setUploadProgress(null);
      }

    } catch (error) {
      console.error('Upload error:', error);
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

      // Save file to Firestore so AI can search it
      const fileDoc: any = {
        name: formData.name,
        type: formData.type,
        size: formData.contentMetadata?.fileSize || 0,
        url: formData.url,
        uploadedBy: user.displayName || 'Unknown',
        category: formData.category,
        createdAt: new Date(),
        accessLevel: 'staff',
        // Add extracted content for AI search
        extractedContent: formData.extractedContent || '',
        contentMetadata: formData.contentMetadata || {},
        hasContent: !!(formData.extractedContent && formData.extractedContent.length > 0)
      };

      // Add organization fields if selected (conditional inclusion pattern)
      if (formData.organizationId) {
        fileDoc.organizationId = formData.organizationId;
      }
      if (formData.organizationName) {
        fileDoc.organizationName = formData.organizationName;
      }
      if (formData.organizationType) {
        fileDoc.organizationType = formData.organizationType;
      }

      await addDoc(collection(db, 'files'), fileDoc);
      console.log('File saved to Firestore for AI search');

      // Reload files to show the new one
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

      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Filter and search files
  const filteredFiles = files.filter(file => {
    const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
    const matchesOrganization = filterOrganization === 'all' || file.organizationId === filterOrganization;
    const matchesSearch = searchTerm === '' ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.organizationName && file.organizationName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesOrganization && matchesSearch;
  });

  const getFileStatus = (file: FileDocument) => {
    if (!file.url || file.url === 'https://example.com/file.pdf') {
      return {
        status: 'no-url',
        color: 'text-red-500',
        icon: '⚠️',
        message: 'No URL',
        tooltip: 'File needs to be re-uploaded'
      };
    } else if (file.url.startsWith('blob:')) {
      return {
        status: 'blob-url',
        color: 'text-orange-500',
        icon: '⏳',
        message: 'Temporary',
        tooltip: 'Temporary URL - file needs to be re-uploaded'
      };
    } else if (file.url.startsWith('data:')) {
      return {
        status: 'data-url',
        color: 'text-amber-600',
        icon: '💾',
        message: 'Fallback Storage',
        tooltip: 'Using fallback storage - configure CORS for proper Firebase Storage'
      };
    } else if (file.url.startsWith('https://firebasestorage.googleapis.com')) {
      return {
        status: 'valid-url',
        color: 'text-green-600',
        icon: '✅',
        message: 'Firebase Storage',
        tooltip: 'Properly stored in Firebase Storage'
      };
    } else {
      return {
        status: 'unknown-url',
        color: 'text-yellow-500',
        icon: '❓',
        message: 'Unknown',
        tooltip: 'Unknown storage type'
      };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-8 w-8" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
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

  return (
    <div className="space-y-6">
      {/* CORS Configuration Warning */}
      {files.some(f => f.url?.startsWith('data:')) && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Files Using Fallback Storage
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Some files are using temporary fallback storage (💾). For production use, configure Firebase Storage CORS:
                </p>
                <code className="block mt-2 bg-amber-100 px-3 py-2 rounded text-xs font-mono">
                  gsutil cors set cors.json gs://officeofmapp.appspot.com
                </code>
                <p className="mt-2">
                  See <strong>FIREBASE_STORAGE_CORS_FIX.md</strong> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">File Manager</h2>
          <p className="text-gray-600 mt-1">Store and organize your documents</p>
        </div>

        <div className="flex items-center gap-2">
          {getFilesNeedingReupload().length > 0 && (
            <Button
              onClick={handleBulkReuploadInfo}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            >
              <FileText className="w-4 h-4" />
              {getFilesNeedingReupload().length} Files Need Re-upload
            </Button>
          )}

          {processingStats && processingStats.pending > 0 && (
            <Button
              onClick={handleProcessAllFiles}
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <FileText className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
              {isProcessing ? 'Processing...' : `Process ${processingStats.pending} Files`}
            </Button>
          )}

          <Button
            onClick={loadFiles}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New File</DialogTitle>
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

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Select
                    value={formData.organizationId}
                    onValueChange={(value) => {
                      const selectedOrg = organizations.find(org => org.id === value);
                      setFormData({
                        ...formData,
                        organizationId: value,
                        organizationName: selectedOrg?.name || '',
                        organizationType: selectedOrg?.type || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} ({getFriaryTypeDisplay(org.type)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Link this file to a specific friary, school, or parish
                  </p>
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

      {/* Search and Filter Bar */}
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

              <Select value={filterOrganization} onValueChange={setFilterOrganization}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({getFriaryTypeDisplay(org.type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
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
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {filteredFiles.map((file) => (
            viewMode === 'grid' ? (
              <Card key={file.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      {getFileIcon(file.type)}
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
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{getFileStatus(file).icon}</span>
                        <span className={`text-xs ${getFileStatus(file).color}`}>
                          {getFileStatus(file).message}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                        {file.category}
                      </Badge>
                      {file.organizationName && (
                        <Badge variant="outline" className="text-xs">
                          {file.organizationName}
                        </Badge>
                      )}
                    </div>
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
            ) : (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                          <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
                            {file.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{getFileStatus(file).icon}</span>
                            <span className={`text-xs ${getFileStatus(file).color}`}>
                              {getFileStatus(file).message}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">by {file.uploadedBy}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  {getFileIcon(selectedFile.type)}
                </div>
                {selectedFile.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Category</p>
                  <Badge className={getCategoryColor(selectedFile.category)}>
                    {selectedFile.category}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">File Size</p>
                  <p className="text-gray-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Uploaded by</p>
                  <p className="text-gray-600">{selectedFile.uploadedBy}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Upload date</p>
                  <p className="text-gray-600">
                    {new Date(selectedFile.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">File type</p>
                  <p className="text-gray-600">{selectedFile.type}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleViewFile(selectedFile)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View File
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownloadFile(selectedFile)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}