// lib/storage.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'task-proofs/userId/fileName')
 * @returns Promise<string> - Download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete file from Firebase Storage
 * @param url - File URL to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Generate unique file path for task proof
 * @param userId - User ID
 * @param taskId - Task ID
 * @param fileName - Original file name
 * @returns string - Unique file path
 */
export const generateTaskProofPath = (userId: string, taskId: string, fileName: string): string => {
  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `task-proofs/${userId}/${taskId}/${timestamp}_${sanitizedFileName}`;
};

/**
 * Check if URL is a Firebase Storage URL
 * @param url - URL to check
 * @returns boolean
 */
export const isFirebaseStorageURL = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com');
};