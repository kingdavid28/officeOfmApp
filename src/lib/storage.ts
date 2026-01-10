import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata
} from 'firebase/storage';
import { storage } from './firebase';
import { crudService } from './crud';
import { UserRole } from './auth';

export class FileStorageService {
  private getStoragePath(userId: string, fileName: string, accessLevel: string): string {
    return `${accessLevel}/${userId}/${Date.now()}_${fileName}`;
  }

  async uploadFile(
    file: File,
    tags: string[],
    accessLevel: 'public' | 'staff' | 'admin',
    userId: string,
    userRole: UserRole
  ) {
    // Check permissions
    if (accessLevel === 'admin' && userRole !== 'admin') {
      throw new Error('Insufficient permissions for admin-level files');
    }

    const storagePath = this.getStoragePath(userId, file.name, accessLevel);
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create metadata record
    const fileMetadata = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: downloadURL,
      uploadedBy: userId,
      tags,
      accessLevel
    };

    const fileId = await crudService.createFileMetadata(fileMetadata, userRole, userId);

    return {
      id: fileId,
      url: downloadURL,
      ...fileMetadata
    };
  }

  async deleteFile(fileId: string, userId: string, userRole: UserRole) {
    // Get file metadata first
    const files = await crudService.getFiles(userRole, userId);
    const file = files.find(f => f.id === fileId);

    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Check permissions
    if (file.uploadedBy !== userId && userRole !== 'admin') {
      throw new Error('Can only delete your own files');
    }

    // Delete from storage
    const storageRef = ref(storage, file.url);
    await deleteObject(storageRef);

    // Delete metadata
    await crudService.deleteTask(fileId, userRole, userId);
  }

  async getFilesByTags(tags: string[], userRole: UserRole, userId: string) {
    const files = await crudService.getFiles(userRole, userId);
    return files.filter(file => 
      tags.some(tag => file.tags.includes(tag))
    );
  }

  async updateFileTags(fileId: string, newTags: string[], userId: string, userRole: UserRole) {
    const files = await crudService.getFiles(userRole, userId);
    const file = files.find(f => f.id === fileId);

    if (!file) {
      throw new Error('File not found or access denied');
    }

    if (file.uploadedBy !== userId && userRole !== 'admin') {
      throw new Error('Can only modify your own files');
    }

    await crudService.updateTask(fileId, { tags: newTags }, userRole, userId);
  }
}

export const fileStorageService = new FileStorageService();