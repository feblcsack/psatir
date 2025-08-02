// lib/imageUpload.ts
/**
 * Alternative image upload solutions without Firebase Storage
 */

// Option 1: Convert image to Base64 and store in Firestore
export const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Option 2: Upload to Imgur (Free API)
  export const uploadToImgur = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
  
    try {
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          'Authorization': 'Client-ID YOUR_IMGUR_CLIENT_ID', // Replace with your Imgur Client ID
        },
        body: formData,
      });
  
      const data = await response.json();
      if (data.success) {
        return data.data.link;
      } else {
        throw new Error('Failed to upload to Imgur');
      }
    } catch (error) {
      console.error('Imgur upload error:', error);
      throw error;
    }
  };
  
  // Option 3: Upload to Cloudinary (Free tier available)
  export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // Replace with your upload preset
  
    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', // Replace with your cloud name
        {
          method: 'POST',
          body: formData,
        }
      );
  
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Failed to upload to Cloudinary');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };
  
  // Option 4: Compress and convert to Base64 (Recommended for free solution)
  export const compressAndConvertToBase64 = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
  
      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = img;
        const aspectRatio = width / height;
        
        let newWidth = width;
        let newHeight = height;
        
        if (width > maxWidth) {
          newWidth = maxWidth;
          newHeight = maxWidth / aspectRatio;
        }
  
        canvas.width = newWidth;
        canvas.height = newHeight;
  
        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
  
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };
  
  // Utility function to check file size
  export const isFileSizeValid = (file: File, maxSizeMB: number = 5): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  };
  
  // Get file size in human readable format
  export const getFileSizeString = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };