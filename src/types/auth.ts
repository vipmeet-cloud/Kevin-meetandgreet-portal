import { User, Session } from '@supabase/supabase-js';
import { ManagementRole } from './database';

export type AuthStatus = 
  | 'AUTHENTICATING'
  | 'AUTHENTICATED_LOADING_PROFILE'
  | 'AUTHENTICATED_PROFILE_LOADED'
  | 'UNAUTHENTICATED';

export interface ManagementUserProfile {
  id: string; // The real Supabase Auth UUID (auth.users.id)
  user_id: string; // Explicitly equal to id for database schema clarity
  email: string;
  full_name: string;
  role: ManagementRole;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  phone_number?: string | null;
}

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  managementProfile: ManagementUserProfile | null;
  isLoading: boolean;
  isAuthorizedManagement: boolean;
  error: string | null;
}

