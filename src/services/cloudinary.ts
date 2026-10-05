/**
 * Cloudinary Media Service Architecture
 * Supports client-side unsigned preset uploads with automatic fallback
 * to user-configured presets (e.g. Vipmeet, vipmeet).
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  isConfigured: boolean;
}

let runtimeCloudName = 
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 
  (import.meta.env as any).CLOUDINARY_CLOUD_NAME || 
  '';

let runtimeUploadPreset = 
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
  (import.meta.env as any).CLOUDINARY_UPLOAD_PRESET || 
  import.meta.env.VITE_CLOUDINARY_PRESET || 
  (import.meta.env as any).CLOUDINARY_PRESET || 
  'Vipmeet';

// Auto-discover configuration from server if frontend env did not include VITE_ prefix
if (typeof window !== 'undefined' && (!runtimeCloudName || runtimeUploadPreset === 'Vipmeet')) {
  fetch('/api/cloudinary/config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg.cloudName) runtimeCloudName = cfg.cloudName;
      if (cfg.uploadPreset) runtimeUploadPreset = cfg.uploadPreset;
    })
    .catch(() => {});
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = 
    runtimeCloudName || 
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 
    (import.meta.env as any).CLOUDINARY_CLOUD_NAME || 
    '';

  const uploadPreset = 
    runtimeUploadPreset || 
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
    (import.meta.env as any).CLOUDINARY_UPLOAD_PRESET || 
    'Vipmeet';

  return {
    cloudName,
    uploadPreset,
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
 * Tries the primary configured preset (Vipmeet), with smart fallback
 * across preset variations (case-sensitivity and defaults) if one is not found.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'celebrity-portraits'
): Promise<UploadResult> {
  // If cloud name wasn't in client build, fetch from server configuration API
  if (!runtimeCloudName && typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/cloudinary/config');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.cloudName) runtimeCloudName = cfg.cloudName;
        if (cfg.uploadPreset) runtimeUploadPreset = cfg.uploadPreset;
      }
    } catch {}
  }

  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    return {
      secureUrl: null,
      publicId: null,
      error: 'Cloudinary cloud name is not set. Please add VITE_CLOUDINARY_CLOUD_NAME or CLOUDINARY_CLOUD_NAME to your environment variables.'
    };
  }

  // Presets to try in order of priority:
  // 1. Configured preset from environment (e.g. Vipmeet)
  // 2. Exact 'Vipmeet'
  // 3. Lowercase 'vipmeet'
  // 4. Fallbacks 'vip_portal_unsigned', 'ml_default'
  const presetsToTry = Array.from(new Set([
    config.uploadPreset,
    'Vipmeet',
    'vipmeet',
    'vip_portal_unsigned',
    'ml_default',
  ].filter(Boolean)));

  const isPdf = file.type === 'application/pdf';
  const endpointType = isPdf ? 'raw' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${endpointType}/upload`;

  let lastErrorMessage = 'Upload failed';

  for (const preset of presetsToTry) {
    // Attempt 1: With folder structure
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', `vip_portal/${folder}`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          secureUrl: data.secure_url,
          publicId: data.public_id,
          error: null,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || `Status ${response.status}`;
      lastErrorMessage = errMsg;

      // If error is about preset not found, continue to next preset
      if (errMsg.toLowerCase().includes('preset') || errMsg.toLowerCase().includes('not found')) {
        continue;
      }

      // If error is about folder restrictions in preset, retry without folder
      if (errMsg.toLowerCase().includes('folder')) {
        const noFolderData = new FormData();
        noFolderData.append('file', file);
        noFolderData.append('upload_preset', preset);

        const retryRes = await fetch(uploadUrl, {
          method: 'POST',
          body: noFolderData,
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          return {
            secureUrl: retryData.secure_url,
            publicId: retryData.public_id,
            error: null,
          };
        }
      }
    } catch (err: unknown) {
      lastErrorMessage = err instanceof Error ? err.message : 'Network error during upload';
    }
  }

  // If all presets failed, provide clear user-friendly instructions
  return {
    secureUrl: null,
    publicId: null,
    error: `Cloudinary notice: ${lastErrorMessage}. Please ensure your preset "${config.uploadPreset}" in Cloudinary Settings -> Upload is set to "Unsigned".`,
  };
}
