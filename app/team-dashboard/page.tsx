"use client"

import Link from "next/link"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentWeek } from "@/hooks/useCurrentWeek"
import { useTeamWeeklyResults } from "@/hooks/useTeamWeeklyResults"
import { useMatchupDetails } from "@/hooks/useMatchupDetails"
import { MatchupDetailsModal } from "@/components/MatchupDetailsModal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  position: string
  team: string
  nflTeam: string
  projectedPoints: number
  status: "healthy" | "questionable" | "doubtful" | "out" | "bye"
  isStarter: boolean
  byeWeek?: number
  recentPerformance: number[]
  teamId?: number
  ownerId?: string
}

// We'll use real data from the API instead of mock data

const lineupSlots = [
  { position: "QB", count: 1, label: "Quarterback" },
  { position: "RB", count: 1, label: "Running Back" },
  { position: "WR", count: 1, label: "Wide Receiver" },
  { position: "TE", count: 1, label: "Tight End" },
  { position: "FLEX", count: 3, label: "Flex (RB/WR)" },
  { position: "PK", count: 1, label: "Kicker" },
  { position: "D/ST", count: 1, label: "Defense" },
]

export default function TeamDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const { currentWeek, loading: currentWeekLoading } = useCurrentWeek()
  const { teamInfo, weeklyResults, loading: weeklyResultsLoading, error: weeklyResultsError } = useTeamWeeklyResults()
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<number | null>(null)
  const { matchupDetails, loading: matchupDetailsLoading, error: matchupDetailsError, fetchMatchupDetails } = useMatchupDetails(selectedWeekForDetails || undefined)
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false)
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [userTeamName, setUserTeamName] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [hasSavedLineup, setHasSavedLineup] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if no user is authenticated
      router.push('/auth')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      // Get team name from user data
      setUserTeamName(user.team_name || user.team || user.username)
      
      // Fetch team roster from API
      fetchTeamRoster()
    }
  }, [user])

  useEffect(() => {
    if (!currentWeekLoading && currentWeek > 0) {
      setSelectedWeek(currentWeek.toString())
    }
  }, [currentWeek, currentWeekLoading])

  useEffect(() => {
    if (players.length > 0 && selectedWeek && initialLoadComplete) {
      loadLineup()
    }
  }, [selectedWeek, initialLoadComplete]) // Only load lineup after initial load is complete

  const fetchTeamRoster = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      console.log('Fetching team roster with token:', token)

      const response = await fetch('/api/team-roster', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Team roster result:', result)
      
      if (result.success) {
        console.log('Setting players:', result.data)
        console.log('Number of players:', result.data.length)
        setPlayers(result.data)
        setInitialLoadComplete(true) // Mark initial load as complete
      } else {
        setError(result.error || 'Failed to fetch team roster')
      }
    } catch (err) {
      console.error('Error fetching team roster:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch team roster')
    } finally {
      setLoading(false)
    }
  }

  const loadLineup = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return
      }

      console.log('Loading lineup for week:', selectedWeek)

      const response = await fetch(`/api/lineups?week=${selectedWeek}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log('No lineup found for week:', selectedWeek)
        return
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('Loaded lineup:', result.data)
        
        // Update players to reflect the loaded lineup
        const lineup = result.data
        setPlayers(prevPlayers => 
          prevPlayers.map(player => ({
            ...player,
            isStarter: 
              player.id === lineup.QB ||
              player.id === lineup.RB_1 ||
              player.id === lineup.WR_1 ||
              player.id === lineup.FLEX_1 ||
              player.id === lineup.FLEX_2 ||
              player.id === lineup.TE ||
              player.id === lineup.K ||
              player.id === lineup.DEF
          }))
        )
        setHasUnsavedChanges(false) // Reset unsaved changes when loading
        setHasSavedLineup(true) // Mark that we have a saved lineup
      } else {
        console.log('No lineup found for week:', selectedWeek)
        // Clear all starters when no lineup is found
        setPlayers(prevPlayers => 
          prevPlayers.map(player => ({
            ...player,
            isStarter: false
          }))
        )
        setHasUnsavedChanges(false)
        setHasSavedLineup(false) // Mark that we don't have a saved lineup
      }
    } catch (err) {
      console.error('Error loading lineup:', err)
    }
  }

  console.log('Current players state:', players)
  const starters = players.filter((p) => p.isStarter)
  const bench = players.filter((p) => !p.isStarter)
  console.log('Starters:', starters)
  console.log('Bench:', bench)

  const getStatusColor = (status: Player["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 text-green-700 hover:bg-green-50"
      case "questionable":
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
      case "doubtful":
        return "bg-orange-50 text-orange-700 hover:bg-orange-50"
      case "out":
        return "bg-red-50 text-red-700 hover:bg-red-50"
      case "bye":
        return "bg-gray-50 text-gray-700 hover:bg-gray-50"
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-50"
    }
  }

  const getPlayerCardStyle = (player: Player) => {
    // Check if player is on bye week during current week or selected week
    if (player.byeWeek && (player.byeWeek === currentWeek || player.byeWeek === parseInt(selectedWeek))) {
      return "bg-red-50 border-red-200 hover:bg-red-100"
    }
    return "hover:bg-muted/50"
  }

  const getStatusText = (status: Player["status"]) => {
    switch (status) {
      case "healthy":
        return "Healthy"
      case "questionable":
        return "Questionable"
      case "doubtful":
        return "Doubtful"
      case "out":
        return "Out"
      case "bye":
        return "Bye Week"
      default:
        return "Unknown"
    }
  }

  const togglePlayerStatus = (playerId: string) => {
    setPlayers((prev) => {
      const player = prev.find((p) => p.id === playerId)
      if (!player) return prev

      // If player is currently a starter, move to bench
      if (player.isStarter) {
        return prev.map((p) => (p.id === playerId ? { ...p, isStarter: false } : p))
      }

      // If player is on bench, determine where to place them
      const currentStarters = prev.filter((p) => p.isStarter)
      const positionCounts = {
        QB: currentStarters.filter((p) => p.position === "QB").length,
        RB: currentStarters.filter((p) => p.position === "RB").length,
        WR: currentStarters.filter((p) => p.position === "WR").length,
        TE: currentStarters.filter((p) => p.position === "TE").length,
        K: currentStarters.filter((p) => p.position === "PK").length,
        DEF: currentStarters.filter((p) => p.position === "D/ST").length,
      }

      // Count total RB/WR players (including those in flex)
      const totalRBWR = currentStarters.filter((p) => p.position === "RB" || p.position === "WR").length

      // Check if we can add this player to the lineup
      let canAdd = false
      
      if (player.position === "QB") {
        canAdd = positionCounts.QB < 1
      } else if (player.position === "TE") {
        canAdd = positionCounts.TE < 1
      } else if (player.position === "PK") {
        canAdd = positionCounts.K < 1
      } else if (player.position === "D/ST") {
        canAdd = positionCounts.DEF < 1
      } else if (player.position === "RB" || player.position === "WR") {
        // For RB/WR, check if we can add to primary position or flex
        if (player.position === "RB" && positionCounts.RB < 1) {
          canAdd = true // Can add to primary RB slot
        } else if (player.position === "WR" && positionCounts.WR < 1) {
          canAdd = true // Can add to primary WR slot
        } else if (totalRBWR < 5) {
          canAdd = true // Can add to flex (1 RB + 1 WR + 3 Flex = 5 total)
        }
      }

      if (!canAdd) {
        // Lineup is full, can't add more players
        return prev
      }

      // Add player to starters
      return prev.map((p) => (p.id === playerId ? { ...p, isStarter: true } : p))
    })
    setHasUnsavedChanges(true)
  }

  const getStartersByPosition = (position: string) => {
    if (position === "FLEX") {
      // Get RB/WR players that are in flex positions (after primary slots are filled)
      const rbPlayers = starters.filter((p) => p.position === "RB")
      const wrPlayers = starters.filter((p) => p.position === "WR")
      
      // First RB goes to RB slot, first WR goes to WR slot, rest go to flex
      const flexRB = rbPlayers.slice(1) // All RBs except the first one
      const flexWR = wrPlayers.slice(1) // All WRs except the first one
      
      return [...flexRB, ...flexWR]
    }
    
    if (position === "RB") {
      const rbPlayers = starters.filter((p) => p.position === "RB")
      return rbPlayers.slice(0, 1) // Only the first RB
    }
    
    if (position === "WR") {
      const wrPlayers = starters.filter((p) => p.position === "WR")
      return wrPlayers.slice(0, 1) // Only the first WR
    }
    
    return starters.filter((p) => p.position === position)
  }

  const isFlexPlayer = (player: Player) => {
    const rbPlayers = starters.filter((p) => p.position === "RB")
    const wrPlayers = starters.filter((p) => p.position === "WR")
    
    // Check if this player is not the first RB or first WR (i.e., is in flex)
    if (player.position === "RB") {
      const playerIndex = rbPlayers.findIndex((p) => p.id === player.id)
      return playerIndex > 0 // Not the first RB (index 0)
    }
    if (player.position === "WR") {
      const playerIndex = wrPlayers.findIndex((p) => p.id === player.id)
      return playerIndex > 0 // Not the first WR (index 0)
    }
    return false
  }

  const totalProjectedPoints = starters.reduce((sum, player) => sum + player.projectedPoints, 0)

  const lineupIssues: Array<string | { text: string; bold: boolean }> = []
  if (starters.filter((p) => p.status === "out").length > 0) {
    lineupIssues.push("You have players marked as 'Out' in your starting lineup")
  }
  if (starters.filter((p) => p.status === "bye").length > 0) {
    lineupIssues.push("You have players on bye week in your starting lineup")
  }
  if (starters.filter((p) => p.status === "questionable").length > 0) {
    lineupIssues.push("You have questionable players in your starting lineup")
  }
  
  // Check for players on bye during the selected week
  const playersOnBye = starters.filter((p) => p.byeWeek && p.byeWeek === parseInt(selectedWeek))
  if (playersOnBye.length > 0) {
    lineupIssues.push({ text: `Lineup Contains ${playersOnBye.length} player${playersOnBye.length > 1 ? 's' : ''} on bye`, bold: true })
  }

  const saveLineup = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('No authentication token found')
        return
      }

      // Get the current starters and organize them by position
      const starters = players.filter(p => p.isStarter)
      
      // Organize players by position
      const qbPlayers = starters.filter(p => p.position === 'QB')
      const rbPlayers = starters.filter(p => p.position === 'RB')
      const wrPlayers = starters.filter(p => p.position === 'WR')
      const tePlayers = starters.filter(p => p.position === 'TE')
      const pkPlayers = starters.filter(p => p.position === 'PK')
      const defPlayers = starters.filter(p => p.position === 'D/ST')

      // Create the lineup object
      const lineup = {
        QB: qbPlayers[0]?.id || '',
        RB_1: rbPlayers[0]?.id || '',
        WR_1: wrPlayers[0]?.id || '',
        FLEX_1: rbPlayers[1]?.id || wrPlayers[1]?.id || '',
        FLEX_2: rbPlayers[2]?.id || wrPlayers[2]?.id || '',
        TE: tePlayers[0]?.id || '',
        K: pkPlayers[0]?.id || '',
        DEF: defPlayers[0]?.id || ''
      }

      console.log('Saving lineup:', lineup)

      const response = await fetch('/api/lineups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          week: selectedWeek,
          lineup: lineup
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save lineup: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setHasUnsavedChanges(false)
        // Show success message
        console.log('Lineup saved successfully')
        toast({
          title: "Lineup Saved!",
          description: `Your Week ${selectedWeek} lineup has been saved successfully.`,
          variant: "default",
        })
      } else {
        setError(result.error || 'Failed to save lineup')
        toast({
          title: "Save Failed",
          description: result.error || 'Failed to save lineup',
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('Error saving lineup:', err)
      setError(err instanceof Error ? err.message : 'Failed to save lineup')
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : 'Failed to save lineup',
        variant: "destructive",
      })
    }
  }

  const clearLineup = () => {
    // Clear all starters and move all players to bench
    setPlayers(prevPlayers => 
      prevPlayers.map(player => ({
        ...player,
        isStarter: false
      }))
    )
    setHasUnsavedChanges(true)
  }

  const optimizeLineup = () => {
    // Simple optimization: start highest projected players
    const sortedPlayers = [...players].sort((a, b) => b.projectedPoints - a.projectedPoints)
    const newPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      isStarter: index < 9, // Start top 9 players (1 QB, 1 RB, 1 WR, 1 TE, 3 Flex, 1 K, 1 DEF)
    }))
    setPlayers(newPlayers)
    setHasUnsavedChanges(true)
  }

  const getResultColor = (result: 'W' | 'L' | 'T') => {
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
  }

  const handleWeekClick = (week: number) => {
    setSelectedWeekForDetails(week)
    setIsMatchupModalOpen(true)
  }

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
            <Link
              href="/players"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Players
            </Link>
            <Link href="/team-dashboard" className="text-sm font-medium transition-colors hover:text-primary">
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
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {userTeamName ? `${userTeamName}` : "Team Dashboard"}
              </h1>
              <p className="text-muted-foreground">
                Manage your lineup: Current Week {currentWeek}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedWeek} onValueChange={setSelectedWeek} disabled={currentWeekLoading}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={currentWeekLoading ? "Loading..." : "Week"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Week {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {authLoading ? (
            <div className="mt-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Checking authentication...</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="lineup" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lineup">Lineup</TabsTrigger>
                <TabsTrigger value="results">Weekly Results</TabsTrigger>
              </TabsList>

              <TabsContent value="lineup" className="space-y-6">
                {lineupIssues.length > 0 && (
                  <Alert className="mt-6 bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {lineupIssues.map((issue, index) => (
                          <div key={index}>
                            • {typeof issue === 'string' ? issue : (
                              <span className={issue.bold ? 'font-bold' : ''}>{issue.text}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {initialLoadComplete && !hasSavedLineup && !loading && (
                  <Alert className="mt-6 bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      No saved lineup found for Week {selectedWeek}. Create your lineup and save it to avoid starting with an empty roster.
                    </AlertDescription>
                  </Alert>
                )}

                {loading ? (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading team roster...</p>
                    </div>
                  </div>
                ) : players.length === 0 ? (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground">No players found on roster</p>
                      <p className="text-sm text-muted-foreground mt-2">Debug: Players array length: {players.length}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Starting Lineup</CardTitle>
                              <CardDescription>Projected Points: {totalProjectedPoints.toFixed(1)} • Week {selectedWeek}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={optimizeLineup}>
                                <Zap className="mr-2 h-4 w-4" />
                                Optimize
                              </Button>
                              <Button variant="outline" size="sm" onClick={clearLineup}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Clear
                              </Button>
                              <Button size="sm" onClick={saveLineup} disabled={!hasUnsavedChanges}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {lineupSlots.map((slot) => {
                              const playersInSlot = getStartersByPosition(slot.position)
                              const slotsNeeded = slot.count
                              const emptySlots = Math.max(0, slotsNeeded - playersInSlot.length)

                              return (
                                <div key={slot.position} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                      {slot.label} ({playersInSlot.length}/{slot.count})
                                    </h3>
                                  </div>
                                  <div className="space-y-2">
                                    {playersInSlot.map((player) => (
                                                                        <div
                                    key={player.id}
                                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${getPlayerCardStyle(player)}`}
                                  >
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-10 w-10">
                                            <AvatarFallback>
                                              {player.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {player.position} - {player.nflTeam}
                                              {player.byeWeek && player.byeWeek > 0 && (
                                                <span className="ml-2">
                                                  <Clock className="inline h-3 w-3 mr-1" />
                                                  Bye: {player.byeWeek}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <div className="font-medium">{player.projectedPoints} pts</div>
                                            <div className="text-xs text-muted-foreground">
                                              Last: {player.recentPerformance[0]}
                                            </div>
                                          </div>
                                          <Badge variant="outline" className={getStatusColor(player.status)}>
                                            {getStatusText(player.status)}
                                          </Badge>
                                          <Button variant="outline" size="sm" onClick={() => togglePlayerStatus(player.id)}>
                                            Bench
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                    {Array.from({ length: emptySlots }).map((_, index) => (
                                      <div
                                        key={`empty-${slot.position}-${index}`}
                                        className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-muted-foreground"
                                      >
                                        <div className="text-center">
                                          <Users className="mx-auto h-8 w-8 mb-2" />
                                          <div className="text-sm">Empty {slot.label} slot</div>
                                          <div className="text-xs">Click a bench player to add</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="lg:col-span-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Bench</CardTitle>
                          <CardDescription>Available players</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {bench.length === 0 ? (
                              <div className="text-center text-muted-foreground py-4">
                                No players on bench
                              </div>
                            ) : (
                              bench.map((player) => (
                                <div
                                  key={player.id}
                                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${getPlayerCardStyle(player)}`}
                                  onClick={() => togglePlayerStatus(player.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {player.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">{player.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {player.position} - {player.nflTeam}
                                        {player.byeWeek && player.byeWeek > 0 && (
                                          <span className="ml-2">
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            Bye: {player.byeWeek}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">{player.recentPerformance[0]}</div>
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(player.status)}`}>
                                      {getStatusText(player.status)}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Lineup Insights</CardTitle>
                          <CardDescription>Performance analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Projected Total</span>
                              <span className="font-medium">{totalProjectedPoints.toFixed(1)} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">League Average</span>
                              <span className="font-medium">115.2 pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Difference</span>
                              <span
                                className={`font-medium ${totalProjectedPoints > 115.2 ? "text-green-600" : "text-red-600"}`}
                              >
                                {totalProjectedPoints > 115.2 ? "+" : ""}
                                {(totalProjectedPoints - 115.2).toFixed(1)} pts
                                {totalProjectedPoints > 115.2 ? (
                                  <TrendingUp className="inline h-4 w-4 ml-1" />
                                ) : (
                                  <TrendingDown className="inline h-4 w-4 ml-1" />
                                )}
                              </span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-2">Position Strength</div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs">QB</span>
                                  <div className="h-2 w-16 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: "85%" }}></div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs">RB</span>
                                  <div className="h-2 w-16 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: "90%" }}></div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs">WR</span>
                                  <div className="h-2 w-16 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-yellow-500" style={{ width: "75%" }}></div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs">TE</span>
                                  <div className="h-2 w-16 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-yellow-500" style={{ width: "70%" }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {weeklyResultsError && (
                  <Alert className="mt-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {weeklyResultsError}
                    </AlertDescription>
                  </Alert>
                )}

                {weeklyResultsLoading ? (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading team results...</p>
                    </div>
                  </div>
                ) : teamInfo && (
                  <>
                    {/* Team Overview Card */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Trophy className="h-5 w-5" />
                              {teamInfo.teamName}
                            </CardTitle>
                            <CardDescription>
                              Division {teamInfo.division} • Rank #{teamInfo.rank}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {teamInfo.record.wins}-{teamInfo.record.losses}-{teamInfo.record.ties}
                            </div>
                            <div className="text-sm text-muted-foreground">Record</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{teamInfo.pointsFor.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">Points For</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{teamInfo.pointsAgainst.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">Points Against</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {(teamInfo.pointsFor - teamInfo.pointsAgainst).toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">Point Differential</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Weekly Results */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Weekly Results
                        </CardTitle>
                        <CardDescription>
                          Season performance and matchups
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                                                     {weeklyResults.map((result) => (
                             <div
                               key={result.week}
                               className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                               onClick={() => handleWeekClick(result.week)}
                             >
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold">Week {result.week}</div>
                                  <div className="text-xs text-muted-foreground">{result.date}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{teamInfo.teamName}</div>
                                  <div className="text-lg font-bold">{result.teamScore}</div>
                                  <div className="text-sm text-muted-foreground">vs</div>
                                  <div className="text-lg font-bold">{result.opponentScore}</div>
                                  <div className="text-sm font-medium">{result.opponentName}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`${getResultColor(result.result)} font-bold`}
                                >
                                  {result.result}
                                </Badge>
                                <div className="text-right text-sm">
                                  <div className="text-muted-foreground">Projected</div>
                                  <div>{result.teamProjected.toFixed(1)} - {result.opponentProjected.toFixed(1)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Performance Statistics
                        </CardTitle>
                        <CardDescription>
                          Season averages and trends
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Average Score</span>
                              <span className="font-medium">
                                {(weeklyResults.reduce((sum, r) => sum + r.teamScore, 0) / weeklyResults.length).toFixed(1)} pts
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Highest Score</span>
                              <span className="font-medium">
                                {Math.max(...weeklyResults.map(r => r.teamScore))} pts
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Lowest Score</span>
                              <span className="font-medium">
                                {Math.min(...weeklyResults.map(r => r.teamScore))} pts
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Wins</span>
                              <span className="font-medium text-green-600">
                                {weeklyResults.filter(r => r.result === 'W').length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Losses</span>
                              <span className="font-medium text-red-600">
                                {weeklyResults.filter(r => r.result === 'L').length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Ties</span>
                              <span className="font-medium text-yellow-600">
                                {weeklyResults.filter(r => r.result === 'T').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                                     </>
                 )}
               </TabsContent>
             </Tabs>
           )}

           {/* Matchup Details Modal */}
           <MatchupDetailsModal
             isOpen={isMatchupModalOpen}
             onClose={() => setIsMatchupModalOpen(false)}
             matchupDetails={matchupDetails}
             loading={matchupDetailsLoading}
             error={matchupDetailsError}
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
