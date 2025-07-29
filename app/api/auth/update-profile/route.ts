import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import Database from 'better-sqlite3'
import path from 'path'

export async function PUT(request: NextRequest) {
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
    const { displayName, teamName, email } = await request.json()

    if (!displayName && !teamName && !email) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db')
    const db = new Database(dbPath)

    // Update user profile in database
    let updateQuery = 'UPDATE user SET '
    const updateParams = []
    
    if (displayName) {
      updateQuery += 'username = ?, '
      updateParams.push(displayName)
    }
    
    if (teamName) {
      updateQuery += 'team_name = ?, '
      updateParams.push(teamName)
    }
    
    if (email) {
      updateQuery += 'email = ?, '
      updateParams.push(email)
    }
    
    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2)
    updateQuery += ' WHERE id = ?'
    updateParams.push(decoded.id)

    const updateStmt = db.prepare(updateQuery)
    updateStmt.run(...updateParams)

    db.close()

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      updatedFields: {
        displayName: displayName || undefined,
        teamName: teamName || undefined,
        email: email || undefined
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 