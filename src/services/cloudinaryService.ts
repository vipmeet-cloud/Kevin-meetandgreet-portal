/**
 * Cloudinary Media Service (Phase 1 Foundation / Prepared for Phase 6)
 *
 * Handles architecture for secure image uploads without exposing private credentials in frontend code.
 * In Phase 1, management can configure direct image URLs while the server/backend upload
 * architecture is staged for future direct upload workflows.
 */

import { uploadImageToCloudinary, getCloudinaryConfig } from './cloudinary';

export interface CloudinaryConfigStatus {
  isConfigured: boolean;
  cloudName: string | null;
  message: string;
}

export const cloudinaryService = {
  /**
   * Evaluates if Cloudinary service is ready for direct API uploads
   */
  getStatus(): CloudinaryConfigStatus {
    const config = getCloudinaryConfig();
    if (config.isConfigured) {
      return {
        isConfigured: true,
        cloudName: config.cloudName,
        message: 'Cloudinary media service is configured.',
      };
    }

    return {
      isConfigured: false,
      cloudName: null,
      message: 'Cloudinary credentials are not configured in environment variables. Image URL input is supported in Phase 1.',
    };
  },

  /**
   * Upload image to Cloudinary using configured upload preset
   */
  async uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
    const result = await uploadImageToCloudinary(file);
    return {
      url: result.secureUrl,
      error: result.error,
    };
  },
};
