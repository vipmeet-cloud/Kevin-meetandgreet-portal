import { SettingsFormData, SettingsValidationErrors } from '../types/settings';

export function validateSettingsForm(data: SettingsFormData): {
  isValid: boolean;
  errors: SettingsValidationErrors;
} {
  const errors: SettingsValidationErrors = {};

  if (!data.celebrity_name || data.celebrity_name.trim().length < 2) {
    errors.celebrity_name = 'Celebrity name is required (minimum 2 characters).';
  }

  if (!data.celebrity_title || data.celebrity_title.trim().length < 2) {
    errors.celebrity_title = 'Celebrity title or billing is required.';
  }

  if (!data.celebrity_bio || data.celebrity_bio.trim().length < 10) {
    errors.celebrity_bio = 'A brief biography is required (minimum 10 characters).';
  }

  if (!data.event_name || data.event_name.trim().length < 2) {
    errors.event_name = 'Event name is required.';
  }

  if (!data.hero_title || data.hero_title.trim().length < 2) {
    errors.hero_title = 'Hero display headline is required.';
  }

  if (!data.hero_subtitle || data.hero_subtitle.trim().length < 2) {
    errors.hero_subtitle = 'Hero subtitle is required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.support_email || !emailRegex.test(data.support_email.trim())) {
    errors.support_email = 'A valid official support email address is required.';
  }

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (data.brand_primary_color && !hexColorRegex.test(data.brand_primary_color.trim())) {
    errors.brand_primary_color = 'Primary brand color must be a valid hex code (e.g. #D4AF37).';
  }

  if (data.brand_secondary_color && !hexColorRegex.test(data.brand_secondary_color.trim())) {
    errors.brand_secondary_color = 'Secondary brand color must be a valid hex code (e.g. #0B0D12).';
  }

  const urlRegex = /^(https?:\/\/|\/)[^\s$.?#].[^\s]*$/i;
  if (data.celebrity_image_url && data.celebrity_image_url.trim().length > 0 && !urlRegex.test(data.celebrity_image_url.trim())) {
    errors.celebrity_image_url = 'Please provide a valid image URL starting with http:// or https://';
  }

  if (data.event_logo_url && data.event_logo_url.trim().length > 0 && !urlRegex.test(data.event_logo_url.trim())) {
    errors.event_logo_url = 'Please provide a valid logo URL starting with http:// or https://';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
