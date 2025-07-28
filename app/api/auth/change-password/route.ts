import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import Database from 'better-sqlite3'
import path from 'path'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 })
    }

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db')
    const db = new Database(dbPath)

    // Get user's current password hash
    const user = db.prepare('SELECT password FROM user WHERE id = ?').get(decoded.id) as { password: string } | undefined
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password using bcrypt
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password with bcrypt
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    const updateStmt = db.prepare('UPDATE user SET password = ? WHERE id = ?')
    updateStmt.run(newPasswordHash, decoded.id)

    db.close()

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 