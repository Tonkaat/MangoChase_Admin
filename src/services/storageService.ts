// src/services/cloudinaryService.ts

// Cloudinary types based on their SDK
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
  created_at: string;
  [key: string]: any;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private baseUrl: string;

  constructor(config: CloudinaryConfig) {
    // Get from environment variables or config
    this.cloudName = config.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = config.uploadPreset || 'ml_default';
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;
    
    if (!this.cloudName) {
      console.warn('⚠️ Cloudinary cloud name not configured. Set VITE_CLOUDINARY_CLOUD_NAME in .env');
    }
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<CloudinaryUploadResponse> {
    if (!this.cloudName) {
      throw new Error('Cloudinary not configured. Please set cloud name.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }
      
      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      console.log('📤 Uploading to Cloudinary...');
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload failed: ${error}`);
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log('✅ Upload successful:', data.secure_url);
      return data;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload scan image to Cloudinary
   * Returns the secure URL of the uploaded image
   */
  async uploadScanImage(file: File, farmId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `scan_${farmId}_${timestamp}`;
      const folder = `mangochase/scans/${farmId}`;

      const response = await this.uploadFile(file, {
        folder,
        publicId: fileName,
        resourceType: 'image',
      });

      return response.secure_url;
    } catch (error) {
      console.error('Error uploading scan image:', error);
      throw error;
    }
  }

  /**
   * Upload tree image to Cloudinary
   * Returns the secure URL of the uploaded image
   */
  async uploadTreeImage(file: File, farmId: string, treeId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `tree_${treeId}_${timestamp}`;
      const folder = `mangochase/trees/${farmId}`;

      const response = await this.uploadFile(file, {
        folder,
        publicId: fileName,
        resourceType: 'image',
      });

      return response.secure_url;
    } catch (error) {
      console.error('Error uploading tree image:', error);
      throw error;
    }
  }

  /**
   * Upload image with transformation options (resize, quality, etc.)
   */
  async uploadImageWithTransform(
    file: File,
    farmId: string,
    folder: string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      crop?: string;
      gravity?: string;
    } = {}
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `image_${timestamp}`;
      
      // Build transformation string
      const transforms: string[] = [];
      
      if (options.maxWidth) transforms.push(`w_${options.maxWidth}`);
      if (options.maxHeight) transforms.push(`h_${options.maxHeight}`);
      if (options.quality) transforms.push(`q_${options.quality}`);
      if (options.crop) transforms.push(`c_${options.crop}`);
      if (options.gravity) transforms.push(`g_${options.gravity}`);
      
      transforms.push('f_auto'); // Auto format
      
      const transformation = transforms.join(',');

      const response = await this.uploadFile(file, {
        folder: `mangochase/${folder}/${farmId}`,
        publicId: fileName,
        transformation,
        resourceType: 'image',
      });

      return response.secure_url;
    } catch (error) {
      console.error('Error uploading image with transforms:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary using Admin API
   * Note: Requires API key and secret (should be done on backend for security)
   */
  async deleteImage(publicId: string): Promise<boolean> {
    console.warn('⚠️ Image deletion should be done on backend for security');
    console.log(`Note: Deletion not implemented. Image: ${publicId}`);
    console.log('You can delete manually from: https://console.cloudinary.com/');
    
    // For frontend-only implementation, we can't securely delete images
    // because it requires API secret which should never be exposed to client
    return false;
  }

  /**
   * Extract public ID from Cloudinary URL
   * URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/publicId.jpg
   */
  getPublicIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      
      // Find the index after 'upload'
      const uploadIndex = pathSegments.indexOf('upload');
      if (uploadIndex === -1) return null;
      
      // Skip version if present (e.g., 'v1234567890')
      let startIndex = uploadIndex + 1;
      if (startIndex < pathSegments.length && 
          pathSegments[startIndex].startsWith('v') &&
          !isNaN(Number(pathSegments[startIndex].substring(1)))) {
        startIndex++;
      }
      
      // Get remaining path segments
      const remainingPath = pathSegments.slice(startIndex).join('/');
      
      // Remove file extension
      return remainingPath.replace(/\.[^/.]+$/, '');
    } catch (error) {
      console.error('Error extracting public ID from URL:', error);
      return null;
    }
  }

  /**
   * Generate thumbnail URL with transformations
   */
  generateThumbnailUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: number;
    } = {}
  ): string {
    try {
      const url = new URL(originalUrl);
      const pathParts = url.pathname.split('/upload/');
      
      if (pathParts.length !== 2) {
        return originalUrl; // Return original if we can't parse
      }
      
      // Build transformations
      const transforms: string[] = [];
      
      if (options.width) transforms.push(`w_${options.width}`);
      if (options.height) transforms.push(`h_${options.height}`);
      if (options.crop) transforms.push(`c_${options.crop}`);
      if (options.quality) transforms.push(`q_${options.quality}`);
      
      transforms.push('f_auto'); // Auto format
      
      if (transforms.length === 1) { // Only f_auto
        return originalUrl;
      }
      
      const transformation = transforms.join(',');
      return `${url.origin}${pathParts[0]}/upload/${transformation}/${pathParts[1]}`;
    } catch (error) {
      console.error('Error generating thumbnail URL:', error);
      return originalUrl;
    }
  }

  /**
   * Check if URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('cloudinary.com');
    } catch {
      return false;
    }
  }

  /**
   * Get image info from URL (width, height, format)
   */
  getImageInfoFromUrl(url: string): {
    width: number | null;
    height: number | null;
    format: string | null;
    publicId: string | null;
  } {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract format from extension
      const formatMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
      const format = formatMatch ? formatMatch[1] : null;
      
      // Extract width and height from transformation if present
      let width: number | null = null;
      let height: number | null = null;
      
      const transformationMatch = pathname.match(/upload\/([^/]+)\//);
      if (transformationMatch) {
        const transforms = transformationMatch[1].split(',');
        transforms.forEach(transform => {
          if (transform.startsWith('w_')) {
            width = parseInt(transform.substring(2), 10);
          }
          if (transform.startsWith('h_')) {
            height = parseInt(transform.substring(2), 10);
          }
        });
      }
      
      return {
        width,
        height,
        format,
        publicId: this.getPublicIdFromUrl(url),
      };
    } catch (error) {
      console.error('Error getting image info from URL:', error);
      return { width: null, height: null, format: null, publicId: null };
    }
  }
}

// Export singleton instance with environment configuration
export const cloudinaryService = new CloudinaryService({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
});