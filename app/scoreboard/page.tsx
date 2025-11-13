"use client"

import Link from "next/link"
import { useState, useEffect, useMemo, useCallback } from "react"
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
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { TradeNotificationBadge } from "@/components/TradeNotificationBadge"
import { useCurrentWeek } from "@/hooks/useCurrentWeek"
import { useMatchupDetails } from "@/hooks/useMatchupDetails"
import { useMatchups } from "@/hooks/useMatchups"
import { MatchupDetailsModal } from "@/components/MatchupDetailsModal"
import { AllLineupsModal } from "@/components/AllLineupsModal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Matchup {
  id: string
  week: number
  team1_id: string
  team2_id: string
  team1_name: string
  team2_name: string
  team1_score?: number
  team2_score?: number
  isComplete: boolean
  result?: 'W' | 'L' | 'T'
}

export default function ScoreboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const { currentWeek, loading: currentWeekLoading } = useCurrentWeek()
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<number | null>(null)
  const [selectedTeamIds, setSelectedTeamIds] = useState<{ team1Id: string; team2Id: string } | null>(null)
  const { matchupDetails, loading: matchupDetailsLoading, error: matchupDetailsError, fetchMatchupDetails } = useMatchupDetails(selectedWeekForDetails || undefined, selectedTeamIds)
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false)
  const [isAllLineupsModalOpen, setIsAllLineupsModalOpen] = useState(false)
  const [allLineupsData, setAllLineupsData] = useState<any>(null)
  const [allLineupsLoading, setAllLineupsLoading] = useState(false)
  const [allLineupsError, setAllLineupsError] = useState<string | null>(null)
  const router = useRouter()
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { toast } = useToast()
  
  // Use the optimized useMatchups hook
  const { matchups, loading, error } = useMatchups(selectedWeek ? parseInt(selectedWeek) : undefined, 'l1')

  // Remove authentication requirement - scoreboard is now public
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     // Redirect to login if no user is authenticated
  //     router.push('/auth')
  //     return
  //   }
  // }, [user, authLoading, router])

  useEffect(() => {
    if (!currentWeekLoading && currentWeek > 0) {
      setSelectedWeek(currentWeek.toString())
    }
  }, [currentWeek, currentWeekLoading])

  // Remove the old fetchMatchups function and useEffect since useMatchups hook handles this

  const handleMatchupClick = useCallback((week: number, team1Id: string, team2Id: string) => {
    setSelectedWeekForDetails(week)
    setSelectedTeamIds({ team1Id, team2Id })
    setIsMatchupModalOpen(true)
  }, [])

  const fetchAllLineups = async () => {
    try {
      setAllLineupsLoading(true)
      setAllLineupsError(null)
      
      const response = await fetch(`/api/lineups/all?week=${selectedWeek}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch lineups: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setAllLineupsData(result.data)
        setIsAllLineupsModalOpen(true)
      } else {
        setAllLineupsError(result.error || 'Failed to fetch lineups')
      }
    } catch (err) {
      console.error('Error fetching all lineups:', err)
      setAllLineupsError(err instanceof Error ? err.message : 'Failed to fetch lineups')
    } finally {
      setAllLineupsLoading(false)
    }
  }

  const getResultColor = useCallback((result: 'W' | 'L' | 'T') => {
    switch (result) {
      case 'W':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'L':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'T':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  // Memoize the week options to prevent re-rendering
  const weekOptions = useMemo(() => 
    Array.from({ length: 18 }, (_, i) => i + 1), []
  )

  // Loading skeleton component
  const MatchupSkeleton = () => (
    <div className="border border-border rounded-lg p-4 animate-pulse">
      <div className="grid grid-cols-3 items-center gap-4">
        <div className="flex items-center justify-end gap-3">
          <div className="h-6 w-8 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center justify-start gap-3">
          <div className="h-8 w-12 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-6 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          
          {/* Desktop Navigation */}
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
            <Link href="/scoreboard" className="text-sm font-medium transition-colors hover:text-primary">
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
                <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>{user?.team || "U"}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
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
                href="/scoreboard"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
              <div className="pt-2 border-t">
                {user ? (
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
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-transparent" 
                    onClick={() => {
                      router.push('/auth')
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    Login
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Scoreboard</h1>
              <p className="text-muted-foreground">Weekly matchups and live scores</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedWeek} onValueChange={setSelectedWeek} disabled={currentWeekLoading}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={currentWeekLoading ? "Loading..." : "Week"} />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((weekNum) => (
                    <SelectItem key={weekNum} value={weekNum.toString()}>
                      Week {weekNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user && (
                <Button 
                  onClick={fetchAllLineups} 
                  disabled={allLineupsLoading || !selectedWeek}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {allLineupsLoading ? 'Loading...' : 'View All Lineups'}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {authLoading && !user ? (
            <div className="mt-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      2025 Regular Season
                    </CardTitle>
                    <CardDescription>16 teams • 4 divisions</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Week {selectedWeek} Matchups</h2>
                      <p className="text-sm text-muted-foreground">
                        {user ? 'Click any matchup to view lineups' : 'Login to view detailed lineups'}
                      </p>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 8 }, (_, i) => (
                          <MatchupSkeleton key={i} />
                        ))}
                      </div>
                    ) : matchups.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No matchups found for Week {selectedWeek}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {matchups.map((matchup) => (
                          <div
                            key={matchup.id}
                            className={`border border-border rounded-lg p-4 transition-colors ${
                              user ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'
                            }`}
                            onClick={user ? () => handleMatchupClick(matchup.week, matchup.team1_id, matchup.team2_id) : undefined}
                          >
                            <div className="grid grid-cols-3 items-center gap-4">
                              <div className="flex items-center justify-end gap-3">
                                <Badge variant="outline" className="text-xs">
                                  {matchup.team1_id}
                                </Badge>
                                <span className="font-medium">{matchup.team1_name}</span>
                                <div className="text-2xl font-bold text-blue-600 min-w-[3rem] text-right">
                                  {Math.floor(matchup.team1_score || 0)}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center gap-2">
                                <div className="text-lg font-bold text-muted-foreground">vs</div>
                                {matchup.isComplete && (
                                  <Badge 
                                    variant="outline" 
                                    className={`${getResultColor(matchup.result || 'T')} font-bold`}
                                  >
                                    {matchup.result || 'TBD'}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-start gap-3">
                                <div className="text-2xl font-bold text-blue-600 min-w-[3rem] text-left">
                                  {Math.floor(matchup.team2_score || 0)}
                                </div>
                                <span className="font-medium">{matchup.team2_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {matchup.team2_id}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Matchup Details Modal */}
          <MatchupDetailsModal
            isOpen={isMatchupModalOpen}
            onClose={() => setIsMatchupModalOpen(false)}
            matchupDetails={matchupDetails}
            loading={matchupDetailsLoading}
            error={matchupDetailsError}
          />

          {/* All Lineups Modal */}
          <AllLineupsModal
            isOpen={isAllLineupsModalOpen}
            onClose={() => setIsAllLineupsModalOpen(false)}
            data={allLineupsData}
            loading={allLineupsLoading}
            error={allLineupsError}
          />
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
  )
}
