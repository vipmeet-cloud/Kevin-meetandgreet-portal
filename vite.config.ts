import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const fallbackSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fiwsjwpyzhltzrdnpcrf.supabase.co';
const fallbackSupabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Nqd3B5emhsdHpyZG5wY3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTk1NTYsImV4cCI6MjEwNjU5NTU1Nn0.Vx7y96504_aJaORBHv1bC2T3IK7Usx_rhj78OPE_wNI';
const fallbackCloudinaryCloud = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'jt6qb4ke';
const fallbackCloudinaryPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || 'Vipmeet';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'CLOUDINARY_', 'SUPABASE_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(fallbackSupabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(fallbackSupabaseAnonKey),
      'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(fallbackCloudinaryCloud),
      'import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(fallbackCloudinaryPreset),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
