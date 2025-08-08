"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useStandings } from "@/hooks/useStandings"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Team {
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

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  nflTeam: string;
  projectedPoints: number;
  status: "healthy" | "questionable" | "doubtful" | "out" | "bye";
  byeWeek?: number;
}

interface WeeklyResult {
  week: number;
  opponent: string;
  result: 'W' | 'L' | 'T';
  pointsFor: number;
  pointsAgainst: number;
  projectedPoints: number;
}

export default function TeamsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { standings, loading: standingsLoading, error: standingsError } = useStandings();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamRoster, setTeamRoster] = useState<Player[]>([]);
  const [weeklyResults, setWeeklyResults] = useState<WeeklyResult[]>([]);
  const [loadingTeamData, setLoadingTeamData] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Remove authentication requirement for public access

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Group teams by division
  const teamsByDivision = standings.reduce((acc, team) => {
    if (!acc[team.division]) {
      acc[team.division] = [];
    }
    acc[team.division].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
    setLoadingTeamData(true);

    try {
      // Fetch team roster
      const rosterResponse = await fetch(`/api/team-roster?teamId=${team.id}`);
      if (rosterResponse.ok) {
        const rosterData = await rosterResponse.json();
        setTeamRoster(rosterData.data || []);
      }

      // Fetch weekly results
      const resultsResponse = await fetch(`/api/team-weekly-results?teamId=${team.id}`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setWeeklyResults(resultsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoadingTeamData(false);
    }
  };

  const getResultColor = (result: 'W' | 'L' | 'T') => {
    switch (result) {
      case 'W': return 'text-green-600';
      case 'L': return 'text-red-600';
      case 'T': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'questionable': return 'text-yellow-600';
      case 'doubtful': return 'text-orange-600';
      case 'out': return 'text-red-600';
      case 'bye': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

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
            <Link href="/leagues" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Standings
            </Link>
            <Link href="/players" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Players
            </Link>
            <Link href="/team-dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Team Dashboard
            </Link>
            <Link href="/teams" className="text-sm font-medium transition-colors hover:text-primary">
              Teams
            </Link>
            <Link href="/draft" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
              <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
              <p className="text-muted-foreground">Browse all teams organized by division</p>
            </div>
          </div>

          {standingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading teams...</span>
              </div>
            </div>
          ) : standingsError ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading teams: {standingsError}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {Object.entries(teamsByDivision).map(([division, teams]) => (
                <div key={division} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h2 className="text-2xl font-semibold">Division {division}</h2>
                    <Badge variant="secondary">{teams.length} Teams</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {teams.map((team) => (
                      <Card 
                        key={team.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleTeamClick(team)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{team.teamField}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{team.teamName || team.teamField}</CardTitle>
                                <CardDescription>{team.teamField}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline">#{team.rank}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Record:</span>
                              <span className="font-medium">
                                {team.wins}-{team.losses}-{team.ties}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Points For:</span>
                              <span className="font-medium">{team.pointsFor.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Points Against:</span>
                              <span className="font-medium">{team.pointsAgainst.toFixed(1)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Team Details Modal */}
      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{selectedTeam?.teamField}</AvatarFallback>
              </Avatar>
              {selectedTeam?.teamName || selectedTeam?.teamField}
            </DialogTitle>
          </DialogHeader>
          
          {loadingTeamData ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading team data...</span>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="roster" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roster" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Roster
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Weekly Results
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="roster" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Roster</h3>
                  <Badge variant="secondary">{teamRoster.length} Players</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>NFL Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bye Week</TableHead>
                      <TableHead>Proj. Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamRoster.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>{player.nflTeam}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(player.status)}>
                            {player.status}
                          </span>
                        </TableCell>
                        <TableCell>{player.byeWeek || '-'}</TableCell>
                        <TableCell>{player.projectedPoints.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="results" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Weekly Results</h3>
                  <Badge variant="secondary">{weeklyResults.length} Weeks</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Points For</TableHead>
                      <TableHead>Points Against</TableHead>
                      <TableHead>Proj. Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyResults.map((result) => (
                      <TableRow key={result.week}>
                        <TableCell className="font-medium">Week {result.week}</TableCell>
                        <TableCell>{result.opponent}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${getResultColor(result.result)}`}>
                            {result.result}
                          </span>
                        </TableCell>
                        <TableCell>{result.pointsFor.toFixed(1)}</TableCell>
                        <TableCell>{result.pointsAgainst.toFixed(1)}</TableCell>
                        <TableCell>{result.projectedPoints.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
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
