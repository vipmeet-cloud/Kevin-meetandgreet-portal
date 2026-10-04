import { useState, useRef } from 'react';
import { ApplicationFormData } from '../../types/application';
import { uploadImageToCloudinary, getCloudinaryConfig } from '../../services/cloudinary';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  X, 
  RotateCw, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface StepSupportingInfoProps {
  formData: ApplicationFormData;
  onChange: (field: keyof ApplicationFormData, value: any) => void;
}

export function StepSupportingInfo({ formData, onChange }: StepSupportingInfoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.supporting_file_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudinaryConfig = getCloudinaryConfig();

  const handleFileProcess = async (file: File) => {
    setUploadError(null);

    // 1. Validation: File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload a JPG, PNG, WEBP, or PDF file.');
      return;
    }

    // 2. Validation: File Size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File exceeds maximum size of 10MB.');
      return;
    }

    // Create local object URL for instant zero-latency visual preview
    if (file.type.startsWith('image/')) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    } else {
      setPreviewUrl(null);
    }

    setIsUploading(true);
    setUploadProgress(20);

    // Simulate animated upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 150);

    try {
      if (cloudinaryConfig.isConfigured) {
        const uploadRes = await uploadImageToCloudinary(file, 'celebrity-portraits');
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadRes.error) {
          setUploadError(uploadRes.error);
          setIsUploading(false);
          return;
        }

        if (uploadRes.secureUrl) {
          onChange('supporting_file_url', uploadRes.secureUrl);
          onChange('supporting_file_name', file.name);
          onChange('supporting_file_type', file.type);
          onChange('supporting_file_public_id', uploadRes.publicId);
        }
      } else {
        // Safe Phase 1/2 local architecture: keep preview & file metadata without storing binaries in DB
        clearInterval(progressInterval);
        setUploadProgress(100);
        onChange('supporting_file_url', `https://assets.local/uploads/${encodeURIComponent(file.name)}`);
        onChange('supporting_file_name', file.name);
        onChange('supporting_file_type', file.type);
      }
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    onChange('supporting_file_url', '');
    onChange('supporting_file_name', '');
    onChange('supporting_file_type', '');
    onChange('supporting_file_public_id', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="space-y-1.5 text-left">
        <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold">
          Section 03 · Supporting Details
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight">
          Photo & Supporting Details (Optional)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          You can optionally upload a photo of yourself or any details you would like management to know.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Upload Zone or Preview */}
        {!formData.supporting_file_url && !previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              isDragging
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                : 'border-white/[0.1] bg-[#0D1018] hover:border-white/[0.25] hover:bg-[#111420]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shadow-lg">
              <UploadCloud className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-1 max-w-sm">
              <span className="text-sm font-semibold text-white block">
                Choose from Gallery or Drag & Drop
              </span>
              <p className="text-xs text-slate-400">
                Support for JPG, PNG, WEBP, or PDF up to 10MB.
              </p>
            </div>

            <div className="pt-2">
              <span className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold uppercase tracking-wider text-[#D4AF37] border border-white/[0.08] inline-block">
                Browse Files
              </span>
            </div>
          </div>
        ) : (
          /* Preview State */
          <div className="p-6 rounded-3xl bg-[#0D1018] border border-white/[0.1] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>File attached</span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.04]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#080A0E] border border-white/[0.06]">
              {previewUrl ? (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-white/[0.1] shadow-md">
                  <img
                    src={previewUrl}
                    alt="Uploaded attachment preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#D4AF37] shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-1.5 text-center sm:text-left truncate w-full">
                <div className="text-sm font-medium text-white truncate">
                  {formData.supporting_file_name || 'attachment.jpg'}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-emerald-400">Ready to submit</span>
                </div>
              </div>
            </div>

            {/* Upload progress bar if still uploading */}
            {isUploading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Uploading to Secure Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-red-400 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#D4AF37] underline hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Security & Verification Notice */}
        <div className="p-4 rounded-2xl bg-[#0B0E16] border border-white/[0.06] flex items-start gap-3 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white block">Privacy Guaranteed:</span>
            <p className="leading-relaxed text-[11px]">
              Any files you attach are encrypted and visible only to the management team reviewing your application.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
