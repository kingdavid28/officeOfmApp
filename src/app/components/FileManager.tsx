import React, { useState } from 'react';
import { useApp, FileDocument } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Upload, Trash2, FileText, Download, Eye } from 'lucide-react';
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

const fileCategories = [
  'Documents',
  'Reports',
  'Forms',
  'Policies',
  'Minutes',
  'Correspondence',
  'Other'
];

export function FileManager() {
  const { files, addFile, deleteFile, user } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileDocument | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: fileCategories[0],
    type: 'pdf',
    url: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: fileCategories[0],
      type: 'pdf',
      url: ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addFile({
      name: formData.name,
      type: formData.type,
      size: Math.floor(Math.random() * 5000000), // Mock size
      url: formData.url || 'https://example.com/file.pdf',
      uploadedBy: user?.name || 'Unknown',
      category: formData.category
    });
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile(id);
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    }
  };

  const filteredFiles = filterCategory === 'all' 
    ? files 
    : files.filter(f => f.category === filterCategory);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Manager</h2>
          <p className="text-muted-foreground">
            Store and organize documents
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
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
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.name ? (
                    <div className="space-y-2">
                      <FileText className="mx-auto h-12 w-12 text-primary" />
                      <p className="font-medium">{formData.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, name: '', url: '' })}
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-primary hover:underline">
                            Upload a file
                          </span>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, XLS, XLSX up to 50MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Upload File
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Label>Filter by Category:</Label>
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
        </CardContent>
      </Card>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No files found. Upload your first file to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <Card 
              key={file.id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{file.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{file.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Uploaded by {file.uploadedBy}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p>{selectedFile.category}</p>
                </div>
                <div>
                  <Label>Size</Label>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{selectedFile.type}</p>
                </div>
                <div>
                  <Label>Uploaded By</Label>
                  <p>{selectedFile.uploadedBy}</p>
                </div>
                <div>
                  <Label>Uploaded At</Label>
                  <p>{new Date(selectedFile.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
