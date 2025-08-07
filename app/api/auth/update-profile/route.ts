import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { updateUserProfile } from '@/lib/database'

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

    // Update user profile in database
    if (displayName || email) {
      await updateUserProfile(decoded.id, displayName || '', email || '')
    }

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