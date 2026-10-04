/**
 * Cloudinary Media Service (Phase 1 Foundation / Prepared for Phase 6)
 *
 * Handles architecture for secure image uploads without exposing private credentials in frontend code.
 * In Phase 1, management can configure direct image URLs while the server/backend upload
 * architecture is staged for future direct upload workflows.
 */

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
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || null;
    if (cloudName && cloudName.trim().length > 0) {
      return {
        isConfigured: true,
        cloudName,
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
   * Upload placeholder stub for Phase 6 (VIP pass / celebrity media asset uploads)
   */
  async uploadImage(_file: File): Promise<{ url: string | null; error: string | null }> {
    const status = this.getStatus();
    if (!status.isConfigured) {
      return {
        url: null,
        error: 'Cloudinary upload service is pending configuration. Please provide a direct image URL in settings.',
      };
    }

    // Server-signed direct upload implementation staged for Phase 6
    return {
      url: null,
      error: 'Direct file upload will be enabled in Phase 6. Please specify image URL in the field above.',
    };
  },
};
