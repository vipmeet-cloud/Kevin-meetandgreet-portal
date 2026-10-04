/**
 * Cloudinary Media Service Architecture
 * Prepared for Phase 6 media asset uploads (Celebrity Profile, Event Logo, VIP Passes).
 * Operates client-side via unsigned presets or server-side unsigned signatures.
 */

export interface CloudinaryConfig {
  cloudName: string;
  isConfigured: boolean;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  return {
    cloudName,
    isConfigured: Boolean(cloudName && cloudName.length > 0),
  };
}

export interface UploadResult {
  secureUrl: string | null;
  publicId: string | null;
  error: string | null;
}

export type CloudinaryFolder = 'celebrity-portraits' | 'event-logos' | 'vip-passes' | 'payment-receipts';

/**
 * Upload an asset (image or PDF receipt) to Cloudinary.
 * If credentials are not configured yet, returns a clear, non-breaking configuration status.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'celebrity-portraits'
): Promise<UploadResult> {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    return {
      secureUrl: null,
      publicId: null,
      error: 'Cloudinary environment is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME in your environment.'
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'vip_portal_unsigned');
    formData.append('folder', `vip_portal/${folder}`);

    const isPdf = file.type === 'application/pdf';
    const endpointType = isPdf ? 'raw' : 'image';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/${endpointType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        secureUrl: null,
        publicId: null,
        error: errorData.error?.message || `Cloudinary upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      secureUrl: data.secure_url,
      publicId: data.public_id,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error during image upload';
    return {
      secureUrl: null,
      publicId: null,
      error: message,
    };
  }
}
