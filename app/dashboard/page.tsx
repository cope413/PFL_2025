"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Shield,
} from "lucide-react"
import { useDashboard } from "@/hooks/useApi"
import { useAuth } from "@/hooks/useAuth"

// Type for dashboard data
interface DashboardData {
  userTeam: {
    id: string;
    name: string;
    record: { wins: number; losses: number; ties: number };
    pointsFor: number;
    pointsAgainst: number;
    rank: number;
    leaguePosition: string;
  };
  currentWeek: number;
  upcomingMatchup: {
    id: string;
    team1: any;
    team2: any;
    team1Projected: number;
    team2Projected: number;
    date: string;
    isUserTeam1: boolean;
  } | null;
  league: {
    id: string;
    name: string;
    type: string;
    currentWeek: number;
    totalTeams: number;
  };
  standings: Array<{
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
    rank: number;
  }>;
  news: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    timestamp: string;
    source: string;
  }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: dashboardData, loading, error } = useDashboard<DashboardData>();
  const router = useRouter();

  // Redirect to auth page if not logged in
  if (!authLoading && !user) {
    router.push('/auth');
    return null;
  }

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
            {user?.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden md:block">
                {user?.username}
              </span>
              <Avatar>
                <AvatarImage src={user?.avatar || ""} alt={user?.username || "User"} />
                <AvatarFallback>{user?.team || user?.username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hidden md:flex"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Your personal fantasy football overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <CalendarDays className="mr-2 h-4 w-4" />
                Week {dashboardData.currentWeek}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matchups">Matchups</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">League Position</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.userTeam.rank}rd</div>
                    <p className="text-xs text-muted-foreground">of {dashboardData.league.totalTeams} teams</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Record</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.userTeam.record.wins}-{dashboardData.userTeam.record.losses}-{dashboardData.userTeam.record.ties}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{(dashboardData.userTeam.pointsFor - dashboardData.userTeam.pointsAgainst).toFixed(1)} points differential
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Points For</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.userTeam.pointsFor.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      {(dashboardData.userTeam.pointsFor / (dashboardData.userTeam.record.wins + dashboardData.userTeam.record.losses + dashboardData.userTeam.record.ties)).toFixed(1)} points per game
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Points Against</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.userTeam.pointsAgainst.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      {(dashboardData.userTeam.pointsAgainst / (dashboardData.userTeam.record.wins + dashboardData.userTeam.record.losses + dashboardData.userTeam.record.ties)).toFixed(1)} points per game
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Upcoming Matchup</CardTitle>
                    <CardDescription>
                      Week {dashboardData.currentWeek}: {dashboardData.upcomingMatchup?.team1.name} vs {dashboardData.upcomingMatchup?.team2.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.upcomingMatchup ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                        <div className="flex flex-col items-center">
                          <Avatar className="h-16 w-16 mb-2">
                            <AvatarImage src="/placeholder.svg" alt="Team" />
                            <AvatarFallback>{dashboardData.upcomingMatchup.team1.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                            <div className="font-bold text-sm sm:text-base">{dashboardData.upcomingMatchup.team1.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ({dashboardData.upcomingMatchup.team1.record.wins}-{dashboardData.upcomingMatchup.team1.record.losses}-{dashboardData.upcomingMatchup.team1.record.ties})
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">VS</div>
                          <div className="text-sm text-muted-foreground">Sunday, 1:00 PM</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <Avatar className="h-16 w-16 mb-2">
                            <AvatarImage src="/placeholder.svg" alt="Team" />
                            <AvatarFallback>{dashboardData.upcomingMatchup.team2.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                            <div className="font-bold text-sm sm:text-base">{dashboardData.upcomingMatchup.team2.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ({dashboardData.upcomingMatchup.team2.record.wins}-{dashboardData.upcomingMatchup.team2.record.losses}-{dashboardData.upcomingMatchup.team2.record.ties})
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No upcoming matchups</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">View Full Matchup</Button>
                  </CardFooter>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Your best players from last week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt="Player" />
                          <AvatarFallback>JA</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Josh Allen</div>
                              <div className="text-sm text-muted-foreground">QB - BUF</div>
                            </div>
                            <div className="font-bold">32.4 pts</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            328 passing yds, 3 TD, 42 rushing yds
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt="Player" />
                          <AvatarFallback>JJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Justin Jefferson</div>
                              <div className="text-sm text-muted-foreground">WR - MIN</div>
                            </div>
                            <div className="font-bold">28.7 pts</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">11 rec, 187 yds, 1 TD</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt="Player" />
                          <AvatarFallback>CM</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Christian McCaffrey</div>
                              <div className="text-sm text-muted-foreground">RB - SF</div>
                            </div>
                            <div className="font-bold">26.2 pts</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">118 rushing yds, 1 TD, 5 rec, 42 yds</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Players
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>League News</CardTitle>
                    <CardDescription>Latest updates from around the league</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.news.slice(0, 3).map((item) => (
                        <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.content}
                          </p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full bg-transparent">
                      View All News
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Leagues</CardTitle>
                    <CardDescription>Manage your fantasy leagues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <div>
                            <div className="font-medium">{dashboardData.league.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {dashboardData.league.totalTeams} teams • {dashboardData.league.type}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Join League</Button>
                    <Button>Create League</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="matchups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Week {dashboardData.currentWeek} Matchups</CardTitle>
                  <CardDescription>All matchups for the current week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {dashboardData.matchups?.map((matchup, i) => (
                      <div key={matchup.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            {matchup.team1_id === dashboardData.userTeam.id || matchup.team2_id === dashboardData.userTeam.id ? "Your Matchup" : `Matchup ${i + 1}`}
                          </div>
                          <div className="text-sm text-muted-foreground">{matchup.date}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{matchup.team1_id}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{matchup.team1_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {matchup.team1_score > 0 ? `${matchup.team1_score.toFixed(1)} pts` : `Proj: ${matchup.team1_projected.toFixed(1)}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-center mx-4">
                            <div className="text-sm font-bold">VS</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">{matchup.team2_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {matchup.team2_score > 0 ? `${matchup.team2_score.toFixed(1)} pts` : `Proj: ${matchup.team2_projected.toFixed(1)}`}
                              </div>
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{matchup.team2_id}</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="standings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>League Standings</CardTitle>
                  <CardDescription>Current standings for {dashboardData.league.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-8 border-b bg-muted/50 p-3 text-sm font-medium">
                      <div className="col-span-3">Team</div>
                      <div className="text-center">W</div>
                      <div className="text-center">L</div>
                      <div className="text-center">T</div>
                      <div className="text-center">PF</div>
                      <div className="text-center">PA</div>
                    </div>
                    {dashboardData.standings.map((team, i) => (
                      <div key={team.teamId} className={`grid grid-cols-8 p-3 text-sm ${team.teamId === dashboardData.userTeam.id ? "bg-muted/30" : ""}`}>
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="font-medium">{team.rank}.</div>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{team.teamName.substring(0, 2)}</AvatarFallback>
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
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Statistics</CardTitle>
                  <CardDescription>Detailed stats for {dashboardData.userTeam.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Offense Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Passing</div>
                          <div className="text-2xl font-bold">98.4</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Rushing</div>
                          <div className="text-2xl font-bold">76.2</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Receiving</div>
                          <div className="text-2xl font-bold">112.8</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Kicking</div>
                          <div className="text-2xl font-bold">18.0</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Position Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">QB</div>
                          <div className="text-2xl font-bold">58.7</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">RB</div>
                          <div className="text-2xl font-bold">82.4</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">WR</div>
                          <div className="text-2xl font-bold">76.5</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">TE</div>
                          <div className="text-2xl font-bold">31.0</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Weekly Performance</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-medium">Week 1</div>
                          <div className="font-medium">Week 2</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">124.2 pts</div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="text-2xl font-bold">124.4 pts</div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-muted-foreground">Win vs Team 4</div>
                          <div className="text-sm text-muted-foreground">Win vs Team 7</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PFL. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 