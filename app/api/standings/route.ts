import { NextRequest, NextResponse } from 'next/server';
import { getResults } from '@/lib/database';

export interface Standing {
  id: string;
  teamName: string;
  teamField: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
}


export async function GET(request: NextRequest) {
  try {
    // Query standings data, joining with user table to get team names
    // Using COALESCE to convert NULL values to 0
    const standingsQuery = `
      SELECT 
        s.Team_ID as id,
        COALESCE(u.team_name, u.username) as teamName,
        u.team as teamField,
        COALESCE(s.Division, 'A') as division,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.Losses, 0) as losses,
        COALESCE(s.Ties, 0) as ties,
        COALESCE(s.PF, 0.0) as pointsFor,
        COALESCE(s.PA, 0.0) as pointsAgainst,
        COALESCE(s.Wins, 0) as rank
      FROM Standings s
      LEFT JOIN user u ON s.Team_ID = u.team
      ORDER BY s.Wins DESC, s.PF DESC
    `;

    const standings = await getResults(standingsQuery) as Standing[];

    console.log('Standings query result:', standings);

    return NextResponse.json({
      success: true,
      data: standings,
      message: `Retrieved ${standings.length} standings records`
    });

  } catch (error) {
    console.error('Error fetching standings:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch standings data'
    }, { status: 500 });
  }
}
