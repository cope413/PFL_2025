import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, updateUser } from '@/lib/auth'
import { getUserById } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    console.log('Profile update API called')
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized - no auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('Unauthorized - invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('User authenticated:', decoded.username)

    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const { displayName, teamName, email } = body

    if (!displayName && !teamName && !email) {
      console.log('No fields provided')
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    // Validate that username is not empty if provided
    if (displayName !== undefined && (!displayName || displayName.trim() === '')) {
      console.log('Empty username provided')
      return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 })
    }

    // Update user profile using the auth layer
    const updates: any = {}
    if (displayName !== undefined) updates.username = displayName
    if (email !== undefined) updates.email = email
    if (teamName !== undefined) updates.team_name = teamName
    
    console.log('Updates to apply:', updates)
    
    await updateUser(decoded.id, updates)
    console.log('User updated successfully')

    // Get the updated user data
    const updatedUser = await getUserById(decoded.id)
    console.log('Updated user data:', updatedUser)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}