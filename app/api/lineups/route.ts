import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLineup, getUserById, saveLineup } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    // Get the user's full data from the database to get their team
    const userData = await getUserById(user.id) as any;

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { week, lineup } = body;

    if (!week || !lineup) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: week, lineup'
      }, { status: 400 });
    }

    console.log('Saving lineup for user:', userData.team, 'week:', week);
    console.log('Lineup data:', lineup);

    // Prepare the lineup data for the database
    const lineupData = {
      owner_ID: userData.team,
      week: week.toString(),
      QB: lineup.QB || '',
      RB_1: lineup.RB_1 || '',
      WR_1: lineup.WR_1 || '',
      FLEX_1: lineup.FLEX_1 || '',
      FLEX_2: lineup.FLEX_2 || '',
      TE: lineup.TE || '',
      K: lineup.K || '',
      DEF: lineup.DEF || ''
    };

    // Insert or update the lineup in the database
    try {
      await saveLineup(
        lineupData.owner_ID,
        lineupData.week,
        lineupData.QB,
        lineupData.RB_1,
        lineupData.WR_1,
        lineupData.FLEX_1,
        lineupData.FLEX_2,
        lineupData.TE,
        lineupData.K,
        lineupData.DEF
      );

      console.log('Lineup saved successfully');

      return NextResponse.json({
        success: true,
        message: 'Lineup saved successfully'
      });
    } catch (error) {
      console.error('Error saving lineup:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save lineup'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in lineup save API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save lineup'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    // Get the user's full data from the database to get their team
    const userData = await getUserById(user.id) as any;
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    
    const week = Number.parseInt(searchParams.get('week'));

    if (!week) {
      return NextResponse.json({
        success: false,
        error: 'Week parameter is required'
      }, { status: 400 });
    }

    console.log('Getting lineup for user:', userData.team, 'week:', week);

    // Get the lineup from the database
    const lineup = await getLineup(userData.team, week) as any;

    if (!lineup) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No lineup found for this week'
      });
    }

    return NextResponse.json({
      success: true,
      data: lineup
    });

  } catch (error) {
    console.error('Error in lineup get API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get lineup'
    }, { status: 500 });
  }
}