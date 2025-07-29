"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Trophy,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ClubIcon as Football,
  Menu,
  Loader2,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useStandings } from "@/hooks/useStandings"

// Type for public dashboard data
interface PublicDashboardData {
  topPlayers: Array<{
    id: string;
    name: string;
    position: string;
    team: string;
    fantasyPoints: number;
    projectedPoints: number;
  }>;
}

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();

  // Function to get top teams for home page display
  const getTopTeamsForHome = () => {
    if (!standings || standings.length === 0) return [];
    
    // Group teams by division
    const teamsByDivision = standings.reduce((acc, team) => {
      const division = team.division;
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(team);
      return acc;
    }, {} as Record<string, typeof standings>);
    
    // Get first place team from each division
    const divisionLeaders = Object.values(teamsByDivision).map(teams => 
      teams.sort((a, b) => {
        // Sort by wins first, then by points for
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.pointsFor - a.pointsFor;
      })[0]
    );
    
    // Get all teams sorted by record (excluding division leaders)
    const allTeamsSorted = standings
      .filter(team => !divisionLeaders.some(leader => leader.id === team.id))
      .sort((a, b) => {
        // Sort by wins first, then by points for
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.pointsFor - a.pointsFor;
      });
    
    // Combine division leaders with next 4 best teams
    const topTeams = [...divisionLeaders, ...allTeamsSorted.slice(0, 4)];
    
    // Sort the final list by wins and points
    return topTeams.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      return b.pointsFor - a.pointsFor;
    });
  };

  // Mock data for top players (keeping this for now)
  const publicData: PublicDashboardData = {
    topPlayers: [
      {
        id: 'p1',
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        fantasyPoints: 28.5,
        projectedPoints: 24.2
      },
      {
        id: 'p2',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        fantasyPoints: 32.1,
        projectedPoints: 26.8
      },
      {
        id: 'p3',
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        fantasyPoints: 29.8,
        projectedPoints: 22.4
      }
    ]
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <Football className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link
              href="/leagues"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Standings
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Players
            </Link>
            <Link href="/team-dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Team Dashboard
            </Link>
            <Link href="/teams" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Teams
            </Link>
            <Link
              href="/draft"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Draft
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Avatar>
                  <AvatarImage src="" alt={user.username} />
                  <AvatarFallback>{user.team}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button size="sm" onClick={() => router.push('/auth')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prehistoric Football League</h1>
              <p className="text-muted-foreground">Where your dreams die like the dinosaurs, since 1997 </p>
            </div>

          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {/* Standings */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  League Standings
                </CardTitle>
                <CardDescription>Current Playoff Teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {standingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Loading standings...</span>
                      </div>
                    </div>
                  ) : standingsError ? (
                    <div className="text-center py-8 text-red-600">
                      <p>Error loading standings: {standingsError}</p>
                    </div>
                  ) : standings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No standings data available</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-8 border-b bg-muted/50 p-3 text-sm font-medium">
                          <div className="col-span-3">Team</div>
                          <div className="text-center">W</div>
                          <div className="text-center">L</div>
                          <div className="text-center">T</div>
                          <div className="text-center">PF</div>
                          <div className="text-center">PA</div>
                        </div>
                        {getTopTeamsForHome().map((team) => (
                          <div key={team.id} className={`grid grid-cols-8 p-3 text-sm border-b last:border-0 ${team.teamName === 'The Touchdown Titans' ? "bg-muted/30" : ""}`}>
                            <div className="col-span-3 flex items-center gap-2">
                              <div className="font-medium">{team.rank}.</div>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{team.teamField}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium truncate">{team.teamName}</div>
                            </div>
                            <div className="text-center">{team.wins}</div>
                            <div className="text-center">{team.losses}</div>
                            <div className="text-center">{team.ties}</div>
                            <div className="text-center">{team.pointsFor.toFixed(1)}</div>
                            <div className="text-center">{team.pointsAgainst.toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <Button variant="outline" size="sm" onClick={() => router.push('/leagues')}>
                          <ChevronRight className="mr-2 h-4 w-4" />
                          View Full Standings
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Players */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest scoring players this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicData.topPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/players/${player.id}.jpg`} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.position} • {player.team}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{player.fantasyPoints} pts</p>
                        <p className="text-sm text-muted-foreground">
                          Proj: {player.projectedPoints}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action for non-authenticated users */}
          {!user && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Ready to join the action?</h2>
                  <p className="text-muted-foreground mb-4">
                    Create your account to start managing your fantasy teams and competing with friends.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={() => router.push('/auth')}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => router.push('/auth')}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
