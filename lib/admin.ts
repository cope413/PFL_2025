import { NextRequest } from 'next/server';
import { getUserFromRequest } from './auth';

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  team?: string;
  team_name?: string;
  is_admin: boolean;
}

// Admin middleware - requires admin privileges
export function requireAdmin(request: NextRequest): AdminUser {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!user.is_admin) {
    throw new Error('Admin privileges required');
  }
  
  return user as AdminUser;
}

// Check if user is admin
export function isAdmin(user: any): boolean {
  return user && user.is_admin === true;
}

