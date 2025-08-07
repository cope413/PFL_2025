import { NextRequest } from 'next/server';
import { User } from './types';
import bcrypt from 'bcryptjs';
import { createUser, getUserById, getUserByUsername, updateUser as updateDbUser } from './database';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  team?: string;
  team_name?: string;
  avatar?: string;
  is_admin?: boolean;
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
    team: user.team,
    team_name: user.team_name,
    is_admin: user.is_admin,
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
      team: payload.team,
      team_name: payload.team_name,
      is_admin: payload.is_admin
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

export function computeHash(input: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(input, saltRounds);
} 

// User registration
export async function registerUser(data: RegisterData): Promise<AuthUser> {
  // Check if username already exists
  const existingUser = await getUserByUsername(data.username) as User | undefined;
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash the password using bcrypt
  const hashedPassword = await computeHash(data.password);

  // Insert user into database
  const result = await createUser(
    data.username,
    hashedPassword,
    data.teamId,
    data.username // Use username as team_name initially
  );

  // Get the auto-generated ID
  const userId = result.lastInsertRowid?.toString() || '0';

  return {
    id: userId,
    username: data.username,
    team: data.teamId,
    team_name: data.username
  };
}

// User login
export async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    console.log('Login attempt for username:', credentials.username);

    // Get user from database
    const result = await await getUserByUsername(credentials.username);

    console.log('Database query result:', result);

    const user = result as User | undefined;

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
      username: user.username,
      email: user.email,
      team: user.team,
      team_name: user.team_name,
      is_admin: user.is_admin
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}


// TODO: Why wrap the updateUser db function in this auth library?
// Update user profile
export async function updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
  const existingUser = await getUserById(userId) as User | undefined;
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Update user in database
  await updateDbUser(
    updates.username || existingUser.username,
    updates.email || existingUser.email || '',
    userId
  );

  return {
    id: userId,
    username: updates.username || existingUser.username,
    email: updates.email || existingUser.email,
    team: existingUser.team,
    team_name: existingUser.team_name
  };
}