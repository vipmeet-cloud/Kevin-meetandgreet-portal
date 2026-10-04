import { User, Session } from '@supabase/supabase-js';
import { ManagementRole } from './database';

export interface ManagementUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: ManagementRole;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  managementProfile: ManagementUserProfile | null;
  isLoading: boolean;
  isAuthorizedManagement: boolean;
  error: string | null;
}
