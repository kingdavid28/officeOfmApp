// Firebase Storage Service
// Handles file uploads to Firebase Storage with proper URLs

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable,
    UploadTaskSnapshot
} from 'firebase/storage';
import { storage, auth } from './firebase';
import { FileContentExtractor } from './file-content-extractor';

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    progress: number;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
    extractedContent?: string;
    contentMetadata?: any;
}

export class FirebaseStorageService {

    // Check if we're using emulator
    private static isUsingEmulator(): boolean {
        return import.meta.env.DEV && storage._delegate._location?.host?.includes('127.0.0.1');
    }

    // Check if we're in production
    private static isProduction(): boolean {
        return window.location.hostname === 'officeofmapp.web.app' ||
            window.location.hostname === 'officeofmapp.firebaseapp.com';
    }

    // Upload file to Firebase Storage and extract content
    static async uploadFile(
        file: File,
        category: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResult> {
        try {
            // Check if user is authenticated
            if (!auth.currentUser) {
                console.error('User not authenticated for file upload');
                return {
                    success: false,
                    error: 'User must be logged in to upload files'
                };
            }

            console.log('User authenticated:', auth.currentUser.uid);
            console.log('Uploading file:', file.name, 'to category:', category);
            console.log('Using emulator:', this.isUsingEmulator());
            console.log('Is production:', this.isProduction());

            // If in production and not using emulator, check if CORS is properly configured
            if (this.isProduction() && !this.isUsingEmulator()) {
                console.log('Production environment detected');
                console.log('⚠️ If you see CORS errors, run: gsutil cors set cors.json gs://officeofmapp.appspot.com');
                console.log('Attempting direct Firebase Storage upload...');
                // Try direct upload first - if CORS is configured, this will work
            }

            // Wait for auth token to be ready (not needed for emulator)
            if (!this.isUsingEmulator()) {
                await auth.currentUser.getIdToken(true);
            }

            // Create a proper file path structure
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const userId = auth.currentUser.uid;

            // Organize files by user and category
            const fileName = `users/${userId}/${category}/${timestamp}_${sanitizedName}`;

            console.log('Storage path:', fileName);

            // Create storage reference
            const storageRef = ref(storage, fileName);

            // Upload file with progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot: UploadTaskSnapshot) => {
                        // Progress tracking
                        const progress = {
                            bytesTransferred: snapshot.bytesTransferred,
                            totalBytes: snapshot.totalBytes,
                            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        };

                        if (onProgress) {
                            onProgress(progress);
                        }

                        console.log(`Upload progress: ${progress.progress.toFixed(1)}%`);
                    },
                    (error) => {
                        // Upload failed
                        console.error('Upload failed:', error);
                        console.error('Error code:', error.code);
                        console.error('Error message:', error.message);

                        let errorMessage = `Upload failed: ${error.message}`;

                        // Provide more specific error messages
                        if (error.code === 'storage/unauthorized') {
                            errorMessage = 'Upload failed: You do not have permission to upload files. Please check your account permissions.';
                        } else if (error.code === 'storage/canceled') {
                            errorMessage = 'Upload was canceled.';
                        } else if (error.code === 'storage/unknown') {
                            errorMessage = 'Upload failed due to an unknown error. Please try again or contact support.';
                        }

                        resolve({
                            success: false,
                            error: errorMessage
                        });
                    },
                    async () => {
                        try {
                            // Upload completed successfully
                            console.log('Upload completed, getting download URL...');
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            console.log('Download URL obtained:', downloadURL);

                            // Extract content from the uploaded file
                            console.log('Extracting content from uploaded file...');
                            const extractedContent = await FileContentExtractor.extractContent(file, file.name);
                            console.log('Content extraction completed:', extractedContent.metadata);

                            resolve({
                                success: true,
                                url: downloadURL,
                                extractedContent: extractedContent.text,
                                contentMetadata: extractedContent.metadata
                            });

                        } catch (error) {
                            console.error('Error getting download URL or extracting content:', error);
                            resolve({
                                success: false,
                                error: `Post-upload processing failed: ${error.message}`
                            });
                        }
                    }
                );
            });

        } catch (error) {
            console.error('Upload initialization failed:', error);
            return {
                success: false,
                error: `Upload initialization failed: ${error.message}`
            };
        }
    }

    // Alternative upload method for development/testing (stores as base64 in Firestore)
    static async uploadFileAsFallback(
        file: File,
        category: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResult> {
        try {
            console.log('Using fallback upload method (base64 storage)');

            // Simulate progress
            if (onProgress) {
                onProgress({ bytesTransferred: 0, totalBytes: file.size, progress: 0 });
            }

            // Convert file to base64
            const base64 = await this.fileToBase64(file);

            if (onProgress) {
                onProgress({ bytesTransferred: file.size * 0.5, totalBytes: file.size, progress: 50 });
            }

            // Extract content
            const extractedContent = await FileContentExtractor.extractContent(file, file.name);

            if (onProgress) {
                onProgress({ bytesTransferred: file.size, totalBytes: file.size, progress: 100 });
            }

            // Create a data URL (this is temporary and for development only)
            const dataUrl = `data:${file.type};base64,${base64}`;

            console.log('Fallback upload completed');

            return {
                success: true,
                url: dataUrl, // Note: This is a data URL, not a proper storage URL
                extractedContent: extractedContent.text,
                contentMetadata: {
                    ...extractedContent.metadata,
                    fallbackUpload: true,
                    fileSize: file.size
                }
            };

        } catch (error) {
            console.error('Fallback upload failed:', error);
            return {
                success: false,
                error: `Fallback upload failed: ${error.message}`
            };
        }
    }

    // Convert file to base64
    private static fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1]; // Remove data:type;base64, prefix
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
    static async deleteFile(url: string): Promise<boolean> {
        try {
            // Extract the file path from the download URL
            const urlParts = url.split('/');
            const filePathWithToken = urlParts[urlParts.length - 1];
            const filePath = filePathWithToken.split('?')[0];

            const storageRef = ref(storage, decodeURIComponent(filePath));
            await deleteObject(storageRef);

            console.log('File deleted successfully:', filePath);
            return true;

        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    // Get file metadata
    static async getFileMetadata(url: string): Promise<any> {
        try {
            // This would require additional Firebase Storage metadata calls
            // For now, return basic info
            return {
                url,
                accessible: true
            };
        } catch (error) {
            console.error('Error getting file metadata:', error);
            return null;
        }
    }

    // Validate file before upload
    static validateFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size must be less than 50MB'
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type ${file.type} is not supported. Allowed types: PDF, Excel, Word, Text, CSV, Images`
            };
        }

        return { valid: true };
    }

    // Generate storage path for file
    static generateStoragePath(fileName: string, category: string): string {
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${category}/${timestamp}_${sanitizedName}`;
    }
}