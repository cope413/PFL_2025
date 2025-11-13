"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClubIcon as Football,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Save,
  Zap,
  Clock,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Target,
  Award,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { TradeNotificationBadge } from "@/components/TradeNotificationBadge"
import { useCurrentWeek } from "@/hooks/useCurrentWeek"
import { useMatchupDetails } from "@/hooks/useMatchupDetails"
import { MatchupDetailsModal } from "@/components/MatchupDetailsModal"
import { useStandings } from "@/hooks/useStandings"
import { useMatchups } from "@/hooks/useMatchups"
import { useAwards } from "@/hooks/useAwards"

export default function LeaguesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentWeek, loading: currentWeekLoading } = useCurrentWeek();
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();
  const { matchups, loading, error } = useMatchups(undefined, 'l1'); // No week specified, will use current week
  const { awards, loading: awardsLoading, error: awardsError } = useAwards();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<number | null>(null);
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<{ team1Id: string; team2Id: string } | null>(null);
  const { matchupDetails, loading: matchupDetailsLoading, error: matchupDetailsError, fetchMatchupDetails } = useMatchupDetails(selectedWeekForDetails || undefined, selectedTeamIds);

  // Remove authentication requirement for public access

  const handleMatchupClick = (week: number, team1Id: string, team2Id: string) => {
    setSelectedWeekForDetails(week);
    setIsMatchupModalOpen(true);
    setSelectedTeamIds({ team1Id, team2Id });
  };

  // Get current week from matchups data
  const currentWeekFromMatchups = matchups.length > 0 ? matchups[0].week : 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/leagues" className="text-sm font-medium transition-colors hover:text-primary">
              Standings
            </Link>
            <Link href="/scoreboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scoreboard
            </Link>
            <Link href="/players" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
                <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Avatar>
                  <AvatarImage src="" alt={user?.username} />
                  <AvatarFallback>{user?.team || "U"}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
                <LogOut className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
            
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
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto max-w-7xl px-4 py-4 space-y-2">
              <Link 
                href="/" 
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leagues"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
              {user ? (
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
              ) : (
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-transparent" 
                    onClick={() => {
                      router.push('/auth')
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prehistoric Football League</h1>
              <p className="text-muted-foreground">Your league overview and standings</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Week {currentWeekFromMatchups}</Badge>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle>2025 Regular Season</CardTitle>
                      <CardDescription>16 teams • 4 divisions</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="standings">
                  <TabsList className="mb-4">
                    <TabsTrigger value="standings">Standings</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="awards">Awards</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                  </TabsList>
                  <TabsContent value="standings">
                    <div className="space-y-6">
                      {standingsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading standings...</span>
                        </div>
                      ) : standingsError ? (
                        <div className="text-center py-8 text-red-600">
                          Error loading standings: {standingsError}
                        </div>
                      ) : standings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No standings data available
                        </div>
                      ) : (
                        // Group standings by division
                        (() => {
                          const divisions = standings.reduce((acc, team) => {
                            const division = team.division || 'A';
                            if (!acc[division]) acc[division] = [];
                            acc[division].push(team);
                            return acc;
                          }, {} as Record<string, typeof standings>);

                          // Sort teams within each division by wins, then points for
                          Object.keys(divisions).forEach(division => {
                            divisions[division].sort((a, b) => {
                              if (b.wins !== a.wins) return b.wins - a.wins;
                              return b.pointsFor - a.pointsFor;
                            });
                          });

                          return Object.keys(divisions).sort().map(division => (
                            <div key={division}>
                              <h3 className="text-lg font-medium mb-3">Division {division}</h3>
                              <div className="rounded-md border">
                                <div className="grid grid-cols-8 border-b bg-muted/50 p-3 text-sm font-medium">
                                  <div className="col-span-3">Team</div>
                                  <div className="text-center">W</div>
                                  <div className="text-center">L</div>
                                  <div className="text-center">T</div>
                                  <div className="text-center">PF</div>
                                  <div className="text-center">PA</div>
                                </div>
                                {divisions[division].map((team, index) => (
                                  <div key={team.id} className={`grid grid-cols-8 p-3 text-sm border-b last:border-0 ${index === 0 ? "bg-muted/30" : ""}`}>
                                    <div className="col-span-3 flex items-center gap-2">
                                      <div className="font-medium">{index + 1}.</div>
                                      <Link 
                                        href={`/teams/${team.id}`}
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                                      >
                                        {team.teamName || team.id} ({team.teamField})
                                      </Link>
                                    </div>
                                    <div className="text-center">{team.wins}</div>
                                    <div className="text-center">{team.losses}</div>
                                    <div className="text-center">{team.ties}</div>
                                    <div className="text-center">{team.pointsFor.toFixed(1)}</div>
                                    <div className="text-center">{team.pointsAgainst.toFixed(1)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="schedule">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Week {currentWeekFromMatchups} Matchups</div>
                          <div className="text-xs text-muted-foreground">Click any matchup to view lineups</div>
                        </div>
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span>Loading matchups...</span>
                            </div>
                          </div>
                        ) : error ? (
                          <div className="text-center py-8 text-red-600">
                            <p>Error loading matchups: {error}</p>
                          </div>
                        ) : matchups.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No matchups found for this week</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {matchups.map((matchup) => (
                              <div 
                                key={matchup.id} 
                                className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleMatchupClick(matchup.week, matchup.team1_id, matchup.team2_id)}
                              >
                                <div className="grid grid-cols-3 items-center gap-4">
                                <div className="flex items-center gap-2 justify-end">
                                  <div className="text-right">
                                    <div className="font-medium">{matchup.team1_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {matchup.team1_score > 0 ? `${matchup.team1_score.toFixed(1)} pts` : 'Projected: ' + matchup.team1_projected.toFixed(1)}
                                    </div>
                                  </div>
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{matchup.team1_id}</AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-bold text-muted-foreground">vs</div>
                                </div>
                                <div className="flex items-center gap-2 justify-start">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{matchup.team2_id}</AvatarFallback>
                                  </Avatar>
                                  <div className="text-left">
                                    <div className="font-medium">{matchup.team2_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {matchup.team2_score > 0 ? `${matchup.team2_score.toFixed(1)} pts` : 'Projected: ' + matchup.team2_projected.toFixed(1)}
                                    </div>
                                  </div>
                                </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="awards">
                    <div className="space-y-6">
                      {awardsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading awards...</span>
                        </div>
                      ) : awardsError ? (
                        <div className="text-center py-8 text-red-600">
                          Error loading awards: {awardsError}
                        </div>
                      ) : awards ? (
                        <div className="space-y-8">
                          {/* First Half Awards */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-amber-500" />
                              First Half of Season (Weeks 1-7)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    High Game Score
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {awards.firstHalf.highGameScore.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.firstHalf.highGameScore.teamName}
                                      {awards.firstHalf.highGameScore.tiedTeams && awards.firstHalf.highGameScore.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.firstHalf.highGameScore.tiedTeams.filter(name => name !== awards.firstHalf.highGameScore.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    {awards.firstHalf.highGameScore.week && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Week {awards.firstHalf.highGameScore.week}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-orange-500" />
                                    High Losing Score
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {awards.firstHalf.highLosingScore.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.firstHalf.highLosingScore.teamName}
                                      {awards.firstHalf.highLosingScore.tiedTeams && awards.firstHalf.highLosingScore.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.firstHalf.highLosingScore.tiedTeams.filter(name => name !== awards.firstHalf.highLosingScore.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    {awards.firstHalf.highLosingScore.week && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Week {awards.firstHalf.highLosingScore.week}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-red-500" />
                                    Toughest Schedule
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                      {awards.firstHalf.toughestSchedule.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.firstHalf.toughestSchedule.teamName}
                                      {awards.firstHalf.toughestSchedule.tiedTeams && awards.firstHalf.toughestSchedule.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.firstHalf.toughestSchedule.tiedTeams.filter(name => name !== awards.firstHalf.toughestSchedule.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Points Against
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-purple-500" />
                                    Best Loser
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {awards.firstHalf.bestLoser.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.firstHalf.bestLoser.teamName}
                                      {awards.firstHalf.bestLoser.tiedTeams && awards.firstHalf.bestLoser.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.firstHalf.bestLoser.tiedTeams.filter(name => name !== awards.firstHalf.bestLoser.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Points in Losses
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>

                          {/* Second Half Awards */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-amber-500" />
                              Second Half of Season (Weeks 8-14)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    High Game Score
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {awards.secondHalf.highGameScore.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.secondHalf.highGameScore.teamName}
                                      {awards.secondHalf.highGameScore.tiedTeams && awards.secondHalf.highGameScore.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.secondHalf.highGameScore.tiedTeams.filter(name => name !== awards.secondHalf.highGameScore.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    {awards.secondHalf.highGameScore.week && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Week {awards.secondHalf.highGameScore.week}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-orange-500" />
                                    High Losing Score
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                      {awards.secondHalf.highLosingScore.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.secondHalf.highLosingScore.teamName}
                                      {awards.secondHalf.highLosingScore.tiedTeams && awards.secondHalf.highLosingScore.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.secondHalf.highLosingScore.tiedTeams.filter(name => name !== awards.secondHalf.highLosingScore.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    {awards.secondHalf.highLosingScore.week && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Week {awards.secondHalf.highLosingScore.week}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-red-500" />
                                    Toughest Schedule
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                      {awards.secondHalf.toughestSchedule.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.secondHalf.toughestSchedule.teamName}
                                      {awards.secondHalf.toughestSchedule.tiedTeams && awards.secondHalf.toughestSchedule.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.secondHalf.toughestSchedule.tiedTeams.filter(name => name !== awards.secondHalf.toughestSchedule.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Points Against
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-purple-500" />
                                    Best Loser
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {awards.secondHalf.bestLoser.value.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {awards.secondHalf.bestLoser.teamName}
                                      {awards.secondHalf.bestLoser.tiedTeams && awards.secondHalf.bestLoser.tiedTeams.length > 1 && (
                                        <div className="text-xs text-amber-600 mt-1">
                                          Tied with: {awards.secondHalf.bestLoser.tiedTeams.filter(name => name !== awards.secondHalf.bestLoser.teamName).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Points in Losses
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No awards data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="rules">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Scoring Rules</h3>
                        <div className="rounded-lg border p-6">
                          <div className="space-y-6">
                            {/* General Scoring */}
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-blue-700">1. Offensive, Defensive & Special Teams Scoring (General)</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                      <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-gray-300 px-4 py-2 font-medium">Touchdowns (Overtime scores count double):</td>
                                      <td className="border border-gray-300 px-4 py-2"></td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-4 py-2 pl-8">Less than 20 yards</td>
                                      <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-4 py-2 pl-8">20 - 49 yards</td>
                                      <td className="border border-gray-300 px-4 py-2 text-center">9</td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-4 py-2 pl-8">50 - 79 yards</td>
                                      <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                    </tr>
                                    <tr>
                                      <td className="border border-gray-300 px-4 py-2 pl-8">80 yards or more</td>
                                      <td className="border border-gray-300 px-4 py-2 text-center">15</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Offensive Points */}
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-green-700">2. Offensive Points (No Overtime Bonus unless noted)</h4>
                              <div className="space-y-4">
                                {/* PAT */}
                                <div>
                                  <h5 className="font-medium mb-2">Point(s) After Touchdown (Overtime scores count double):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">One Point Conversion</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Two Point Conversion - Passing</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">3</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Two Point Conversion - Rushing or Receiving</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">3</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Field Goals */}
                                <div>
                                  <h5 className="font-medium mb-2">Field Goals (Overtime scores count double):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">0 - 39 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">3</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">40 - 49 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">50-59 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">9</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">60-69 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">70+ yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">15</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Passing Yards */}
                                <div>
                                  <h5 className="font-medium mb-2">Passing Yards:</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">0 - 199 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">0</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">200-249 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">250-299 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">4</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">300-334 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">335-364 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">8</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">365-399 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">10</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">400-434 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">435-464 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">14</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">465-499 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">16</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">500-534 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">18</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">535-564 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">20</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">565-599 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">22</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">600 & up yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">24</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Rushing/Receiving Yards */}
                                <div>
                                  <h5 className="font-medium mb-2">Rushing or Receiving Yards:</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">0 - 49 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">0</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">50 - 74 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">75-99 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">4</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">100-134 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">135-164 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">8</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">165-199 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">10</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">200-234 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">235-264 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">14</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">265-299 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">16</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">300-334 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">18</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">335-364 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">20</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">365-399 yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">22</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">400 & up yards</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">24</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Reception Points */}
                                <div>
                                  <h5 className="font-medium mb-2">Reception Points (see note below):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">0 - 2 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">0</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">3 - 5 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">6 - 8 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">3</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">9-11 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">12-14 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">9</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">15-17 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">18-20 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">15</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">21-23 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">18</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">24-26 catches</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">21</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    <strong>Note:</strong> Reception Points only apply when they exceed points for Receiving Yards (excluding bonus points) and are instead of yardage points, not in addition to. This category does not affect Combined Yards Bonus points.
                                  </p>
                                </div>

                                {/* Carries Points */}
                                <div>
                                  <h5 className="font-medium mb-2">Carries Points (see note below):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">0 - 11 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">0</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">12-17 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">18-23 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">3</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">24-29 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">30-35 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">9</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">36-41 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">42-47 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">15</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">48-53 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">18</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">54-59 carries</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">21</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    <strong>Note:</strong> Carries Points only apply when they exceed points for Rushing Yards (excluding bonus points) and are instead of yardage points, not in addition to. This category does not affect Combined Yards Bonus points.
                                  </p>
                                </div>

                                {/* Combined Yards Bonus */}
                                <div>
                                  <h5 className="font-medium mb-2">Combined Yards Bonus Points (in addition to Yardage, Carries and Reception pts):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">50 yards rushing & 50 yards receiving</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">75 yards rushing & 75 yards receiving</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">4</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">100 yards rushing & 100 yards receiving</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">50 yards rushing or receiving & 200 yards passing</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">75 yards rushing or receiving & 250 yards passing</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">4</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">100 yards rushing or receiving & 300 yards passing</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Defensive Points */}
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-red-700">3. Defensive Points (includes defense and special teams) (No Overtime Bonus unless noted)</h4>
                              <div className="space-y-4">
                                {/* Basic Defensive Stats */}
                                <div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Sack</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Turnover (fumble recovered by the Defense or interception) (as reported by the NFL)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Safety (Overtime scores count double)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">Extra Point (or two point) attempt returned by the Defense for a score</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Net Yards Allowed */}
                                <div>
                                  <h5 className="font-medium mb-2">Net Yards Allowed (team yards allowed [passing+rushing-sacks]) (only one applies):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">a) Team holds opponent under 200 yards (entire game)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">6</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">b) Team gives up more than 199 yards and less than 240 yards (entire game)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">4</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">c) Team gives up more than 239 yards and less than 280 yards (entire game)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Points Allowed */}
                                <div>
                                  <h5 className="font-medium mb-2">Points Allowed (includes Off., Def. & Sp. Teams scores) (only one applies):</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-medium">Description</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-medium">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">a) Less than 7 points scored (per quarter, excludes overtime)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">1</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">b) No points allowed (per quarter, excludes overtime)</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">2</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-gray-300 px-4 py-2">c) Shutout for entire game including overtime</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center">12 total</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PFL. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Matchup Details Modal */}
      <MatchupDetailsModal
        isOpen={isMatchupModalOpen}
        onClose={() => setIsMatchupModalOpen(false)}
        matchupDetails={matchupDetails}
        loading={matchupDetailsLoading}
        error={matchupDetailsError}
      />
    </div>
  );
}
