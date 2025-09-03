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
import { useCurrentWeek } from "@/hooks/useCurrentWeek"
import { useMatchupDetails } from "@/hooks/useMatchupDetails"
import { MatchupDetailsModal } from "@/components/MatchupDetailsModal"
import { useStandings } from "@/hooks/useStandings"
import { useMatchups } from "@/hooks/useMatchups"

export default function LeaguesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentWeek, loading: currentWeekLoading } = useCurrentWeek();
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();
  const { matchups, loading, error } = useMatchups(undefined, 'l1'); // No week specified, will use current week
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<number | null>(null);
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<{ team1Id: string; team2Id: string } | null>(null);
  const { matchupDetails, loading: matchupDetailsLoading, error: matchupDetailsError, fetchMatchupDetails } = useMatchupDetails(selectedWeekForDetails || undefined, selectedTeamIds);

  // Remove authentication requirement for public access

  const handleOpenPDF = () => {
    window.open('/scoring.pdf', '_blank');
  };

  const handleMatchupClick = (week: number, team1Id: string, team2Id: string) => {
    setSelectedWeekForDetails(week);
    setIsMatchupModalOpen(true);
    setSelectedTeamIds({ team1Id, team2Id });
  };

  // Get current week from matchups data
  const currentWeekFromMatchups = matchups.length > 0 ? matchups[0].week : 1;
  
  // Add debugging
  console.log('LeaguesPage render:', { matchups, loading, error, currentWeekFromMatchups });

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
            <Link href="/players" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
                href="/draft"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Draft
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
                  <TabsContent value="rules">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Scoring Rules</h3>
                        <div className="rounded-lg border p-4">
                          <iframe 
                            src="/scoring.pdf" 
                            className="w-full h-96 border-0"
                            title="Scoring Rules PDF"
                          />
                          <div className="mt-4 text-center">
                            <Button variant="outline" onClick={handleOpenPDF}>
                              Open PDF in New Tab
                            </Button>
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
