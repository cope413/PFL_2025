import { NextRequest } from 'next/server';
import { dbQueries, generateId } from './database';
import { User } from './types';
import bcrypt from 'bcryptjs';

// Simple JWT-like token system (in production, use a proper JWT library)
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  teamId: string;
}

// Simple token generation (use proper JWT in production)
export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
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
      username: payload.username
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
  const existingUser = dbQueries.getUserByUsername?.get(data.username) as User | undefined;
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  // Hash the password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  
  // Insert user into database
  const result = dbQueries.createUser.run(
    data.username,
    hashedPassword,
    data.teamId,
    data.username // Use username as team_name initially
  );

  // Get the auto-generated ID
  const userId = result.lastInsertRowid?.toString() || '0';

  return {
    id: userId,
    username: data.username
  };
}

// User login
export async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    console.log('Login attempt for username:', credentials.username);
    
    // Check if the query exists
    if (!dbQueries.getUserByUsername) {
      console.error('getUserByUsername query is not defined');
      throw new Error('Database query not available');
    }
    
    // Get user from database
    const user = dbQueries.getUserByUsername.get(credentials.username) as User | undefined;
    
    console.log('User found:', user);
    
    if (!user) {
      console.log('No user found with username:', credentials.username);
      throw new Error('Invalid credentials');
    }

    // Verify the password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      console.log('Password mismatch for user:', credentials.username);
      throw new Error('Invalid credentials');
    }

    console.log('Login successful for user:', credentials.username);
    return {
      id: user.id,
      username: user.username
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = dbQueries.getUserById.get(userId) as User | undefined;
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username
  };
}

// Update user profile
export async function updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
  const existingUser = dbQueries.getUserById.get(userId) as User | undefined;
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Update user in database
  dbQueries.updateUser?.run(
    updates.username || existingUser.username,
    existingUser.team_name || existingUser.username,
    userId
  );

  return {
    id: userId,
    username: updates.username || existingUser.username
  };
} 