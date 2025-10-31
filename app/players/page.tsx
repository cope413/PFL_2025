"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClubIcon as Football,
  Settings,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  StarHalf,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  totalPoints: number;
  currentWeekPoints: number;
  avgPoints: number;
  byeWeek: number;
  owner_ID: string;
  status: string;
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
  week_5: number;
  week_6: number;
  week_7: number;
  week_8: number;
  week_9: number;
  week_10: number;
  week_11: number;
  week_12: number;
  week_13: number;
  week_14: number;
  week_15: number;
  week_16: number;
  week_17: number;
  week_18: number;
}

interface WaivedPlayer {
  player_id: string;
  team_id: string;
  waiver_order: number;
  waived_at: string;
  status: string;
  player_name: string;
  position: string;
  nfl_team: string;
  team_name: string;
  owner_name: string;
  total_points: number;
  avg_points: number;
}

export default function PlayersPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [waivedPlayers, setWaivedPlayers] = useState<WaivedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [waivedLoading, setWaivedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedOwnership, setSelectedOwnership] = useState('all')
  const [activeTab, setActiveTab] = useState('all-players')
  const [sortField, setSortField] = useState<'totalPoints' | 'avgPoints' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/players')
        const data = await response.json()
        
        if (data.success) {
          setPlayers(data.data)
          setFilteredPlayers(data.data)
        } else {
          setError(data.error || 'Failed to fetch players')
        }
      } catch (err) {
        setError('Failed to fetch players')
        console.error('Error fetching players:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  // Fetch waived players data
  const fetchWaivedPlayers = async () => {
    try {
      setWaivedLoading(true)
      const response = await fetch('/api/waiver?action=waived-players')
      const data = await response.json()
      
      if (data.success) {
        setWaivedPlayers(data.data)
      } else {
        setError(data.error || 'Failed to fetch waived players')
      }
    } catch (err) {
      setError('Failed to fetch waived players')
      console.error('Error fetching waived players:', err)
    } finally {
      setWaivedLoading(false)
    }
  }

  // Fetch waived players when tab is switched
  useEffect(() => {
    if (activeTab === 'waived-players' && waivedPlayers.length === 0) {
      fetchWaivedPlayers()
    }
  }, [activeTab, waivedPlayers.length])

  // Sort function
  const handleSort = (field: 'totalPoints' | 'avgPoints') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Filter and sort players based on search term, position, team, and sorting
  useEffect(() => {
    let filtered = players

    // Filter by search term (name)
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by position
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(player =>
        player.position.toLowerCase() === selectedPosition.toLowerCase()
      )
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(player =>
        player.team.toLowerCase().includes(selectedTeam.toLowerCase())
      )
    }

    // Filter by ownership status
    if (selectedOwnership !== 'all') {
      if (selectedOwnership === 'free-agents') {
        filtered = filtered.filter(player => player.owner_ID === '99')
      } else if (selectedOwnership === 'rostered') {
        filtered = filtered.filter(player => player.owner_ID !== '99')
      }
    }

    // Sort players
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        
        if (sortDirection === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      })
    }

    setFilteredPlayers(filtered)
  }, [players, searchTerm, selectedPosition, selectedTeam, selectedOwnership, sortField, sortDirection])



  
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
            <Link
              href="/leagues"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Standings
            </Link>
            <Link href="/scoreboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scoreboard
            </Link>
            <Link href="/players" className="text-sm font-medium transition-colors hover:text-primary">
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
                href="/scoreboard"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scoreboard
              </Link>
              <Link
                href="/players"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Players</h1>
              <p className="text-muted-foreground">Browse, search, and analyze player stats and performance.</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all-players">All Players</TabsTrigger>
                <TabsTrigger value="waived-players">Waived Players</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-players" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Player Search</CardTitle>
                    <CardDescription>Find players by name, team, position, or status</CardDescription>
                  </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search players..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <SelectItem value="QB">QB</SelectItem>
                        <SelectItem value="RB">RB</SelectItem>
                        <SelectItem value="WR">WR</SelectItem>
                        <SelectItem value="TE">TE</SelectItem>
                        <SelectItem value="PK">K</SelectItem>
                        <SelectItem value="D/ST">D/ST teams</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        <SelectItem value="ari">ARI</SelectItem>
                        <SelectItem value="atl">ATL</SelectItem>
                        <SelectItem value="bal">BAL</SelectItem>
                        <SelectItem value="buf">BUF</SelectItem>
                        <SelectItem value="car">CAR</SelectItem>
                        <SelectItem value="chi">CHI</SelectItem>
                        <SelectItem value="cin">CIN</SelectItem>
                        <SelectItem value="cle">CLE</SelectItem>
                        <SelectItem value="dal">DAL</SelectItem>
                        <SelectItem value="den">DEN</SelectItem>
                        <SelectItem value="det">DET</SelectItem>
                        <SelectItem value="gb">GB</SelectItem>
                        <SelectItem value="hou">HOU</SelectItem>
                        <SelectItem value="ind">IND</SelectItem>
                        <SelectItem value="jax">JAX</SelectItem>
                        <SelectItem value="kc">KC</SelectItem>
                        <SelectItem value="lv">LV</SelectItem>
                        <SelectItem value="lac">LAC</SelectItem>
                        <SelectItem value="lar">LAR</SelectItem>
                        <SelectItem value="mia">MIA</SelectItem>
                        <SelectItem value="min">MIN</SelectItem>
                        <SelectItem value="ne">NE</SelectItem>
                        <SelectItem value="no">NO</SelectItem>
                        <SelectItem value="nyg">NYG</SelectItem>
                        <SelectItem value="nyj">NYJ</SelectItem>
                        <SelectItem value="phi">PHI</SelectItem>
                        <SelectItem value="pit">PIT</SelectItem>
                        <SelectItem value="sf">SF</SelectItem>
                        <SelectItem value="sea">SEA</SelectItem>
                        <SelectItem value="tb">TB</SelectItem>
                        <SelectItem value="ten">TEN</SelectItem>
                        <SelectItem value="was">WAS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedOwnership} onValueChange={setSelectedOwnership}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        <SelectItem value="free-agents">Free Agents</SelectItem>
                        <SelectItem value="rostered">Rostered</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedPosition('all')
                        setSelectedTeam('all')
                        setSelectedOwnership('all')
                        setSortField(null)
                        setSortDirection('desc')
                      }}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Players {filteredPlayers.length !== players.length && `(${filteredPlayers.length} of ${players.length})`}
                </CardTitle>
                <CardDescription>
                  {filteredPlayers.length !== players.length 
                    ? `Showing ${filteredPlayers.length} filtered players` 
                    : 'Highest scoring players by total points'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading players...</span>
                    </div>
                  </div>
                ) : error ? (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="max-h-[600px] overflow-auto scrollbar-thick">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('totalPoints')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Total Points
                              {sortField === 'totalPoints' ? (
                                sortDirection === 'desc' ? (
                                  <ArrowDown className="h-4 w-4" />
                                ) : (
                                  <ArrowUp className="h-4 w-4" />
                                )
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('avgPoints')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Avg Points
                              {sortField === 'avgPoints' ? (
                                sortDirection === 'desc' ? (
                                  <ArrowDown className="h-4 w-4" />
                                ) : (
                                  <ArrowUp className="h-4 w-4" />
                                )
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-center">1</TableHead>
                          <TableHead className="text-center">2</TableHead>
                          <TableHead className="text-center">3</TableHead>
                          <TableHead className="text-center">4</TableHead>
                          <TableHead className="text-center">5</TableHead>
                          <TableHead className="text-center">6</TableHead>
                          <TableHead className="text-center">7</TableHead>
                          <TableHead className="text-center">8</TableHead>
                          <TableHead className="text-center">9</TableHead>
                          <TableHead className="text-center">10</TableHead>
                          <TableHead className="text-center">11</TableHead>
                          <TableHead className="text-center">12</TableHead>
                          <TableHead className="text-center">13</TableHead>
                          <TableHead className="text-center">14</TableHead>
                          <TableHead className="text-center">15</TableHead>
                          <TableHead className="text-center">16</TableHead>
                          <TableHead className="text-center">17</TableHead>
                          <TableHead className="text-center">18</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={25} className="text-center py-8 text-muted-foreground">
                              No players found matching your filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPlayers.map((player, index) => (
                            <TableRow key={player.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{player.name}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{player.position}</TableCell>
                              <TableCell>{player.team}</TableCell>
                              <TableCell className="text-right font-medium">{player.totalPoints.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{player.avgPoints.toFixed(1)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={player.owner_ID === '99' ? 'outline' : 'default'} 
                                  className="text-xs"
                                >
                                  {player.owner_ID === '99' ? 'Free Agent' : player.owner_ID}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm">{player.week_1.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_2.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_3.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_4.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_5.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_6.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_7.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_8.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_9.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_10.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_11.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_12.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_13.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_14.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_15.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_16.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_17.toFixed(1)}</TableCell>
                              <TableCell className="text-center text-sm">{player.week_18.toFixed(1)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>


                )}
              </CardContent>
            </Card>
              </TabsContent>
              
              <TabsContent value="waived-players" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Waived Players</CardTitle>
                    <CardDescription>Players who have been waived by teams and are available for pickup</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {waivedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span>Loading waived players...</span>
                        </div>
                      </div>
                    ) : error ? (
                      <Alert>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>NFL Team</TableHead>
                              <TableHead>Former Team</TableHead>
                              <TableHead>Waived By</TableHead>
                              <TableHead className="text-right">Total Points</TableHead>
                              <TableHead className="text-right">Avg Points</TableHead>
                              <TableHead>Waived Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {waivedPlayers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  No waived players found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              waivedPlayers.map((player, index) => (
                                <TableRow key={player.player_id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                          {player.player_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{player.player_name}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{player.position}</TableCell>
                                  <TableCell>{player.nfl_team}</TableCell>
                                  <TableCell>{player.team_name}</TableCell>
                                  <TableCell>{player.owner_name}</TableCell>
                                  <TableCell className="text-right font-medium">{player.total_points.toFixed(1)}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{player.avg_points.toFixed(1)}</TableCell>
                                  <TableCell>{new Date(player.waived_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="text-xs">{player.status}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
    </div>
  );
}
