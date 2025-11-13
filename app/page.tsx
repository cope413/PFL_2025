"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
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
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { TradeNotificationBadge } from "@/components/TradeNotificationBadge"
import { useStandings } from "@/hooks/useStandings"
import { usePlayers } from "@/hooks/usePlayers"

// Type for top players display
interface TopPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  fantasyPoints: number;
  projectedPoints: number;
}

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();
  const { players, isLoading: playersLoading, error: playersError } = usePlayers();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Get top performing players from real data
  const getTopPlayers = () => {
    if (!players || players.length === 0) return [];
    
    // Sort players by current week points (descending) and take top 10
    return players
      .filter(player => player.currentWeekPoints && player.currentWeekPoints > 0) // Only players with current week points
      .sort((a, b) => (b.currentWeekPoints || 0) - (a.currentWeekPoints || 0))
      .slice(0, 10)
      .map(player => ({
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        fantasyPoints: player.currentWeekPoints || 0,
        projectedPoints: player.avgPoints || 0
      }));
  };

  const topPlayers = getTopPlayers();

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
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-8 w-8" />
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
            <Link href="/scoreboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scoreboard
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
            <div className="flex items-center gap-2">
              <Link href="/trades" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Trades
              </Link>
              <TradeNotificationBadge />
            </div>
            <Link
              href="/draft"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Draft
            </Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Rules
            </Link>
            {user?.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <ThemeToggle />
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
                
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto max-w-7xl px-4 py-4 space-y-2">
              <Link 
                href="/" 
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leagues"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Standings
              </Link>
              <Link
                href="/scoreboard"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scoreboard
              </Link>
              <Link
                href="/players"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Players
              </Link>
              <Link 
                href="/team-dashboard" 
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Team Dashboard
              </Link>
              <Link 
                href="/teams" 
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Teams
              </Link>
              <Link 
                href="/trades" 
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trades
              </Link>
              <Link
                href="/draft"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Draft
              </Link>
              <Link
                href="/rules"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rules
              </Link>
              {user?.is_admin && (
                <Link
                  href="/admin"
                  className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-transparent" 
                    onClick={() => {
                      router.push('/settings')
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-center">
            <div className="text-center">
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
                <CardDescription>Top 10 performers from current week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Loading top performers...</span>
                      </div>
                    </div>
                  ) : playersError ? (
                    <div className="text-center py-8 text-red-600">
                      <p>Error loading players: {playersError}</p>
                    </div>
                  ) : topPlayers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No player data available</p>
                    </div>
                  ) : (
                    topPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
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
                          <p className="font-medium">{player.fantasyPoints.toFixed(1)} pts</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: {player.projectedPoints.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action for non-authenticated users */}
          {!user && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Sign in to view your team dashboard</h2>
                  
                  <div className="flex justify-center">
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
