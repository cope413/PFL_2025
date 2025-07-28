import { NextRequest } from 'next/server';
import { dbQueries, generateId } from './database';
import { User } from './types';

// Simple JWT-like token system (in production, use a proper JWT library)
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

// Simple token generation (use proper JWT in production)
export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Simple base64 encoding (use proper JWT in production)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Simple token verification (use proper JWT in production)
export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      id: payload.id,
      username: payload.username,
      email: payload.email
    };
  } catch {
    return null;
  }
}

// Get user from request headers
export function getUserFromRequest(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Authentication middleware
export function requireAuth(request: NextRequest): AuthUser {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// User registration
export async function registerUser(data: RegisterData): Promise<AuthUser> {
  // Check if username already exists
  const existingUser = dbQueries.getUserByUsername?.get(data.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Check if email already exists
  const existingEmail = dbQueries.getUserByEmail?.get(data.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  const userId = generateId('u');
  
  // In a real app, hash the password
  const hashedPassword = data.password; // Use bcrypt in production
  
  // Insert user into database
  dbQueries.createUser.run(
    userId,
    data.username,
    data.email,
    data.avatar || null
  );

  return {
    id: userId,
    username: data.username,
    email: data.email,
    avatar: data.avatar
  };
}

// User login
export async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  // In a real app, you'd have a separate passwords table or hash field
  // For now, we'll just check if the user exists
  const user = dbQueries.getUserByUsername?.get(credentials.username);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // In a real app, verify the password hash
  // For now, we'll just return the user
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  };
}

// Get user by ID
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = dbQueries.getUserById.get(userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  };
}

// Update user profile
export async function updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
  const existingUser = dbQueries.getUserById.get(userId);
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Update user in database
  dbQueries.updateUser?.run(
    updates.username || existingUser.username,
    updates.email || existingUser.email,
    updates.avatar || existingUser.avatar,
    userId
  );

  return {
    id: userId,
    username: updates.username || existingUser.username,
    email: updates.email || existingUser.email,
    avatar: updates.avatar || existingUser.avatar
  };
} 