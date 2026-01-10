import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  Tag, 
  Sparkles,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { documentClassifier, ClassificationResult } from '../../lib/classification';
import { useApp } from '../contexts/AppContext';

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'document' | 'other';
  classification?: ClassificationResult;
  extractedText?: string;
  metadata: {
    size: number;
    lastModified: Date;
    tags: string[];
    description: string;
  };
}

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export function EnhancedFileUpload() {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
    message: ''
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const { addFile, user } = useApp();

  const processFile = async (file: File): Promise<FilePreview> => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other';

    const preview: FilePreview = {
      file,
      url,
      type,
      metadata: {
        size: file.size,
        lastModified: new Date(file.lastModified),
        tags: [],
        description: ''
      }
    };

    // AI-powered document classification and text extraction
    if (type === 'document' || type === 'image') {
      try {
        setUploadProgress(prev => ({ ...prev, status: 'processing', message: 'Analyzing document...' }));
        
        // Simulate OCR text extraction
        const extractedText = await extractTextFromFile(file);
        preview.extractedText = extractedText;

        // AI classification
        const classification = await documentClassifier.classifyDocument(extractedText, file.name);
        preview.classification = classification;
        preview.metadata.tags = classification.tags;

        // Auto-generate description based on classification
        preview.metadata.description = generateDescription(classification, file.name);
      } catch (error) {
        console.error('File processing error:', error);
      }
    }

    return preview;
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // Simulate OCR/text extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTexts = {
          'receipt': 'RECEIPT\nStore Name: ABC Store\nTotal: $25.99\nDate: 2024-01-06\nTax: $2.34',
          'invoice': 'INVOICE #12345\nBill To: Company ABC\nAmount Due: $1,250.00\nDue Date: 2024-02-01',
          'memo': 'MEMORANDUM\nTo: All Staff\nFrom: Management\nRe: Policy Update\nEffective immediately...',
          'contract': 'SERVICE AGREEMENT\nThis agreement is between...\nTerms and Conditions...'
        };
        
        const fileName = file.name.toLowerCase();
        for (const [type, text] of Object.entries(mockTexts)) {
          if (fileName.includes(type)) {
            resolve(text);
            return;
          }
        }
        resolve('Sample document text extracted from file...');
      }, 1500);
    });
  };

  const generateDescription = (classification: ClassificationResult, fileName: string): string => {
    const descriptions = {
      'receipt': `Receipt document with ${classification.confidence > 0.8 ? 'high' : 'medium'} confidence`,
      'invoice': `Invoice document for billing purposes`,
      'contract': `Legal contract or agreement document`,
      'memo': `Internal memorandum or communication`,
      'report': `Report or analysis document`,
      'other': `Document file: ${fileName}`
    };
    return descriptions[classification.type] || descriptions.other;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    await handleFiles(selectedFiles);
  };

  const handleFiles = async (fileList: File[]) => {
    setUploadProgress({ progress: 0, status: 'uploading', message: 'Processing files...' });
    
    const newPreviews: FilePreview[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(prev => ({ 
        ...prev, 
        progress: (i / fileList.length) * 50,
        message: `Processing ${file.name}...`
      }));
      
      const preview = await processFile(file);
      newPreviews.push(preview);
    }
    
    setFiles(prev => [...prev, ...newPreviews]);
    setUploadProgress({ progress: 100, status: 'complete', message: 'Files processed successfully!' });
    
    setTimeout(() => {
      setUploadProgress({ progress: 0, status: 'idle', message: '' });
    }, 2000);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateMetadata = (index: number, field: keyof FilePreview['metadata'], value: any) => {
    setFiles(prev => prev.map((file, i) => 
      i === index 
        ? { ...file, metadata: { ...file.metadata, [field]: value } }
        : file
    ));
  };

  const addTag = (index: number, tag: string) => {
    if (!tag.trim()) return;
    updateMetadata(index, 'tags', [...files[index].metadata.tags, tag.trim()]);
  };

  const removeTag = (index: number, tagIndex: number) => {
    const newTags = [...files[index].metadata.tags];
    newTags.splice(tagIndex, 1);
    updateMetadata(index, 'tags', newTags);
  };

  const uploadFiles = async () => {
    setUploadProgress({ progress: 0, status: 'uploading', message: 'Uploading files...' });
    
    for (let i = 0; i < files.length; i++) {
      const filePreview = files[i];
      
      setUploadProgress(prev => ({ 
        ...prev, 
        progress: (i / files.length) * 100,
        message: `Uploading ${filePreview.file.name}...`
      }));
      
      // Add to app context
      addFile({
        name: filePreview.file.name,
        type: filePreview.file.type,
        size: filePreview.file.size,
        url: filePreview.url,
        uploadedBy: user?.name || 'Unknown',
        category: filePreview.classification?.type || 'other',
        metadata: {
          ...filePreview.metadata,
          classification: filePreview.classification,
          extractedText: filePreview.extractedText
        }
      });
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setUploadProgress({ progress: 100, status: 'complete', message: 'All files uploaded successfully!' });
    setFiles([]);
    
    setTimeout(() => {
      setUploadProgress({ progress: 0, status: 'idle', message: '' });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, DOC, DOCX, images up to 50MB
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Select Files
                </Button>
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.status !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{uploadProgress.message}</span>
                <span className="text-sm text-muted-foreground">{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((filePreview, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* File Preview */}
                  <div className="flex-shrink-0">
                    {filePreview.type === 'image' ? (
                      <img 
                        src={filePreview.url} 
                        alt={filePreview.file.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{filePreview.file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* AI Classification */}
                    {filePreview.classification && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">AI Classification:</span>
                          <Badge variant="secondary">
                            {filePreview.classification.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(filePreview.classification.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={filePreview.metadata.description}
                        onChange={(e) => updateMetadata(index, 'description', e.target.value)}
                        placeholder="Add a description..."
                        rows={2}
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {filePreview.metadata.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="gap-1">
                            {tag}
                            <button
                              onClick={() => removeTag(index, tagIndex)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addTag(index, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const input = document.querySelector(`input[placeholder="Add tag..."]`) as HTMLInputElement;
                            if (input) {
                              addTag(index, input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Extracted Text Preview */}
                    {filePreview.extractedText && (
                      <div className="space-y-2">
                        <Label>Extracted Text (Preview)</Label>
                        <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
                          {filePreview.extractedText.substring(0, 200)}
                          {filePreview.extractedText.length > 200 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button 
              onClick={uploadFiles}
              disabled={uploadProgress.status === 'uploading'}
              className="min-w-32"
            >
              {uploadProgress.status === 'uploading' ? 'Uploading...' : `Upload ${files.length} Files`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}