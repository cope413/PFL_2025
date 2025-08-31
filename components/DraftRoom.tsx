"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useDraft } from "@/hooks/useDraft"
import { usePlayers } from "@/hooks/usePlayers"
import { 
  Clock, 
  Users, 
  Trophy, 
  RotateCcw, 
  Save, 
  Zap, 
  ArrowUpDown,
  Play,
  Pause,
  SkipForward,
  Undo2,
  Shield,
  AlertCircle,
  X,
  Database,
  RefreshCw,
  Trash2
} from "lucide-react"

interface Player {
  id: string
  name: string
  position: string
  team: string
  projectedPoints: number
  bye: number
  owner_ID?: string
}

interface RosterPlayer {
  id: string
  name: string
  position: string
  nflTeam: string
  team: string
  totalPoints?: number
  avgPoints?: number
  byeWeek?: number
  status?: string
}

interface DraftPick {
  round: number
  pick: number
  team: string
  player: Player | null
  timestamp: Date
}

interface TeamRoster {
  teamId: string
  teamName: string
  players: Player[]
}

interface User {
  id: string
  username: string
  team: string
  team_name?: string
  owner_name?: string
  is_admin?: boolean
}

interface DraftRoomProps {
  onClose: () => void
}

const DRAFT_ORDER = [
  "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
  "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
]



// Helper function to generate the correct draft order for a specific round and pick
const getDraftOrderForPosition = (round: number, pick: number): string => {
  const baseOrder = [
    "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
    "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
  ];
  
  if (round % 2 === 1) {
    // Odd rounds: forward order
    return baseOrder[pick - 1];
  } else {
    // Even rounds: reverse order (A4 first, then B4, etc.)
    return baseOrder[baseOrder.length - pick];
  }
}

export default function DraftRoom({ onClose }: DraftRoomProps) {
  const [currentRound, setCurrentRound] = useState(1)
  const [currentPick, setCurrentPick] = useState(1)
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [isDraftActive, setIsDraftActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(150) // 150 seconds per pick
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("ALL")
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<TeamRoster | null>(null)
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const { user } = useAuth()
  const { draftPicks: dbDraftPicks, progress, savePick, undoPick, clearDraft, refreshDraft, isLoading: draftLoading, error: draftError } = useDraft()
  const { players, isLoading: playersLoading, error: playersError, refreshPlayers } = usePlayers()

  const getCurrentPickingTeam = (): string => {
    return getDraftOrderForPosition(currentRound, currentPick);
  }

  // Fetch users for team information
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data || []);
        } else {
          console.warn('Failed to fetch users:', data.error);
          setUsers([]);
        }
      } else {
        console.warn('Failed to fetch users: HTTP', response.status, response.statusText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  // Roster is now displayed directly from draft picks data

  // Set available players when players are loaded from database
  useEffect(() => {
    if (players.length > 0) {
      // Transform players to match the local Player interface
      const transformedPlayers = players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        team: p.team,
        projectedPoints: p.avgPoints || 0,
        bye: p.byeWeek || 0,
        owner_ID: p.owner_ID
      }));
      setAvailablePlayers(transformedPlayers);
    }
  }, [players]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // No longer need to fetch roster since we use local draft picks data

  // Helper function to get owner name for a team
  const getOwnerNameForTeam = (teamId: string): string => {
    const user = users.find(u => u.team === teamId);
    return user?.owner_name || user?.username || teamId;
  };

  // Initialize draft picks
  useEffect(() => {
    const picks: DraftPick[] = []
    for (let round = 1; round <= 16; round++) {
      for (let pick = 1; pick <= 16; pick++) {
        const team = getDraftOrderForPosition(round, pick)
        picks.push({
          round,
          pick,
          team,
          player: null,
          timestamp: new Date()
        })
      }
    }
    setDraftPicks(picks)
  }, [])

  // Load draft from database and restore state
  useEffect(() => {
    if (dbDraftPicks.length > 0) {
      console.log('Restoring draft from database:', dbDraftPicks);
      
      // Create a new picks array with database data
      const restoredPicks: DraftPick[] = []
      
      // Initialize all 256 draft slots
      for (let round = 1; round <= 16; round++) {
        for (let pick = 1; pick <= 16; pick++) {
          const team = getDraftOrderForPosition(round, pick)
          
          // Find if this slot has a player in the database
          const dbPick = dbDraftPicks.find(p => p.round === round && p.pick === pick)
          
          if (dbPick && dbPick.player_id && dbPick.player_id.trim() !== '') {
            // This slot has a player - find the player data
            const player = players.find(p => p.id === dbPick.player_id)
            if (player) {
              restoredPicks.push({
                round,
                pick,
                team,
                player: {
                  id: player.id,
                  name: player.name,
                  position: player.position,
                  team: player.team,
                  projectedPoints: player.avgPoints || 0,
                  bye: player.byeWeek || 0,
                  owner_ID: dbPick.team_id
                },
                timestamp: new Date(dbPick.timestamp || Date.now())
              })
              
              // Remove player from available list
              setAvailablePlayers(prev => prev.filter(p => p.id !== dbPick.player_id))
            } else {
              // Player not found in MOCK_PLAYERS, create placeholder
              restoredPicks.push({
                round,
                pick,
                team,
                player: {
                  id: dbPick.player_id,
                  name: dbPick.player_name || 'Unknown Player',
                  position: dbPick.position || 'Unknown',
                  team: dbPick.team || 'Unknown',
                  projectedPoints: 0,
                  bye: 0,
                  owner_ID: dbPick.team_id
                },
                timestamp: new Date(dbPick.timestamp || Date.now())
              })
            }
          } else {
            // This slot is empty
            restoredPicks.push({
              round,
              pick,
              team,
              player: null,
              timestamp: new Date()
            })
          }
        }
      }
      
      setDraftPicks(restoredPicks)
      
      // Set current position based on progress
      if (progress) {
        console.log('Setting draft progress:', progress);
        setCurrentRound(progress.currentRound)
        setCurrentPick(progress.currentPick)
        
        // Roster is now displayed from local draft picks data
      }
    }
  }, [dbDraftPicks, progress, players])

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isDraftActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Show time warning instead of auto-picking
            setShowTimeWarning(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isDraftActive, timeRemaining])

  // Clear time warning when a pick is made
  useEffect(() => {
    if (timeRemaining > 0) {
      setShowTimeWarning(false)
    }
  }, [timeRemaining])

  const getCurrentTeam = () => {
    if (currentRound <= 0 || currentPick <= 0) return ""
    const pickIndex = (currentRound - 1) * 16 + (currentPick - 1)
    return draftPicks[pickIndex]?.team || ""
  }

  const getNextTeam = () => {
    if (currentRound <= 0 || currentPick <= 0) return ""
    const nextPickIndex = (currentRound - 1) * 16 + currentPick
    if (nextPickIndex >= draftPicks.length) return ""
    return draftPicks[nextPickIndex]?.team || ""
  }

  const makePick = async () => {
    if (!selectedPlayer) return

    const player = availablePlayers.find(p => p.id === selectedPlayer)
    if (!player) return

    // Find the correct index in the draftPicks array for this round and pick
    const pickIndex = draftPicks.findIndex(p => p.round === currentRound && p.pick === currentPick)
    if (pickIndex === -1 || pickIndex >= draftPicks.length) return

    try {
      // Update player with owner_ID
      const updatedPlayer = { ...player, owner_ID: getCurrentTeam() }
      
      const updatedPicks = [...draftPicks]
      updatedPicks[pickIndex].player = updatedPlayer
      updatedPicks[pickIndex].timestamp = new Date()
      setDraftPicks(updatedPicks)

      // Save pick to database
      console.log('Saving pick to database:', {
        round: currentRound,
        pick: currentPick,
        team_id: getCurrentTeam(),
        player_id: player.id,
        player_name: player.name,
        position: player.position,
        team: player.team
      });

      await savePick({
        round: currentRound,
        pick: currentPick,
        team_id: getCurrentTeam(),
        player_id: player.id,
        player_name: player.name,
        position: player.position,
        team: player.team
      })

      // Remove player from available list
      setAvailablePlayers(prev => prev.filter(p => p.id !== selectedPlayer))
      setSelectedPlayer("")

      // Move to next pick
      if (currentPick === 16) {
        if (currentRound === 16) {
          // Draft complete
          setIsDraftActive(false)
        } else {
          setCurrentRound(prev => prev + 1)
          setCurrentPick(1)
        }
      } else {
        setCurrentPick(prev => prev + 1)
      }

      // Reset timer
      setTimeRemaining(150)
      
      console.log('Pick saved successfully');
    } catch (error) {
      console.error('Error saving pick:', error);
      // Revert the local state change if database save failed
      const revertedPicks = [...draftPicks]
      revertedPicks[pickIndex].player = null
      setDraftPicks(revertedPicks)
      // Show error to user
      alert('Failed to save pick. Please try again.');
    }
  }

  const startDraft = () => {
    setIsDraftActive(true)
    setShowTimeWarning(false)
    // Use current progress from database instead of resetting to beginning
    if (progress) {
      setCurrentRound(progress.currentRound)
      setCurrentPick(progress.currentPick)
    }
    setTimeRemaining(150)
  }

  const pauseDraft = () => {
    setIsDraftActive(false)
    setShowTimeWarning(false)
  }

  const undoLastPick = async () => {
    if (draftPicks.length === 0) return

    const lastPickIndex = draftPicks.findLastIndex(p => p.player !== null)
    if (lastPickIndex === -1) return

    const lastPick = draftPicks[lastPickIndex]
    if (!lastPick.player) return

    try {
      // Use the new undoPick function to properly handle the database operation
      await undoPick(lastPick.round, lastPick.pick)
      
      // The database will be refreshed automatically, but we need to update local state
      // Add player back to available list (without owner_ID)
      const playerWithoutOwner = { ...lastPick.player }
      delete playerWithoutOwner.owner_ID
      setAvailablePlayers(prev => [playerWithoutOwner, ...prev].sort((a, b) => a.name.localeCompare(b.name)))

      // Remove player from pick
      const updatedPicks = [...draftPicks]
      updatedPicks[lastPickIndex].player = null
      setDraftPicks(updatedPicks)

      // Go back to previous pick
      if (lastPick.pick === 1) {
        if (lastPick.round > 1) {
          setCurrentRound(lastPick.round - 1)
          setCurrentPick(16)
        } else {
          setCurrentRound(1)
          setCurrentPick(1)
        }
      } else {
        setCurrentRound(lastPick.round)
        setCurrentPick(lastPick.pick - 1)
      }

      setTimeRemaining(150)
      
      console.log('Pick undone successfully');
    } catch (error) {
      console.error('Error undoing pick:', error);
      // Show error to user
      alert('Failed to undo pick. Please try again.');
    }
  }

  const handleClearDraft = async () => {
    if (confirm('Are you sure you want to clear the entire draft? This action cannot be undone.')) {
      try {
        await clearDraft()
        // Reset local state
        setDraftPicks([])
        setCurrentRound(1)
        setCurrentPick(1)
        // Reset to all players from the database with proper transformation
        const transformedPlayers = players.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          team: p.team,
          projectedPoints: p.avgPoints || 0,
          bye: p.byeWeek || 0,
          owner_ID: p.owner_ID
        }));
        setAvailablePlayers(transformedPlayers)
        setIsDraftActive(false)
        setTimeRemaining(150)
        setSelectedPlayer("")
      } catch (error) {
        console.error('Failed to clear draft:', error);
      }
    }
  }

  const showTeamRoster = (teamId: string) => {
    const teamPlayers = draftPicks
      .filter(pick => pick.team === teamId && pick.player)
      .map(pick => pick.player)
      .filter((player): player is NonNullable<typeof player> => player !== null)
      .sort((a, b) => a.name.localeCompare(b.name))

    const teamRoster: TeamRoster = {
      teamId,
      teamName: getOwnerNameForTeam(teamId),
      players: teamPlayers
    }

    setSelectedTeamRoster(teamRoster)
    setShowRosterModal(true)
  }

  const filteredPlayers = availablePlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = positionFilter === "ALL" || player.position === positionFilter
    return matchesSearch && matchesPosition
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`bg-background rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${
          isMaximized 
            ? 'w-full h-full max-w-none max-h-none' 
            : 'w-full max-w-7xl max-h-[90vh]'
        }`}>
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">PFL Draft Room</h2>
              <p className="text-muted-foreground">Round {currentRound}, Pick {currentPick}</p>
              <div className="flex items-center gap-2 mt-1">
                {user?.is_admin ? (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    Admin Access
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                    <AlertCircle className="h-3 w-3" />
                    View Only
                  </div>
                )}
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                  <Database className="h-3 w-3" />
                  {draftLoading ? 'Syncing...' : 'Auto-save Enabled'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Current Team</div>
                <div className="text-xl font-bold">{getCurrentTeam()}</div>
                <div className="text-xs text-muted-foreground">
                  {getOwnerNameForTeam(getCurrentTeam())}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Next Team</div>
                <div className="text-xl font-bold">{getNextTeam()}</div>
                <div className="text-xs text-muted-foreground">
                  {getOwnerNameForTeam(getNextTeam())}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Time Remaining</div>
                <div className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-500' : ''}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? 'Minimize' : 'Maximize'}
              </Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>

          <div className={`flex ${isMaximized ? 'h-[calc(100vh-120px)]' : 'h-[calc(90vh-120px)]'}`}>
            {/* Left Panel - Available Players */}
            <div className="w-1/3 border-r p-4 overflow-y-auto">
              <div className="space-y-4">
                {!user?.is_admin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">View Only Mode</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      You can browse players and see the draft board, but only administrators can submit picks and control the draft.
                    </p>
                  </div>
                )}

                {/* Time Warning */}
                {showTimeWarning && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Time Warning</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Time Warning. Please submit your pick.
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="QB">QB</SelectItem>
                      <SelectItem value="RB">RB</SelectItem>
                      <SelectItem value="WR">WR</SelectItem>
                      <SelectItem value="TE">TE</SelectItem>
                      <SelectItem value="K">K</SelectItem>
                      <SelectItem value="DEF">DEF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredPlayers.map((player) => (
                    <Card 
                      key={player.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedPlayer === player.id 
                          ? user?.is_admin 
                            ? 'ring-2 ring-primary' 
                            : 'ring-2 ring-amber-400'
                          : ''
                      }`}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{player.position}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.team} • {player.position} • Bye {player.bye}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{player.projectedPoints} pts</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Panel - Draft Board */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Draft Board</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshDraft}
                      disabled={draftLoading}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  {user?.is_admin ? (
                    <div className="flex items-center gap-2">
                      {!isDraftActive ? (
                        <Button onClick={startDraft}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Draft
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={pauseDraft}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </Button>
                          <Button variant="outline" onClick={() => undoLastPick().catch(console.error)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Undo
                          </Button>
                        </>
                      )}
                      <Button variant="destructive" onClick={() => handleClearDraft().catch(console.error)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear Draft
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Draft controls are admin-only
                    </div>
                  )}
                </div>

                {/* Loading and Error States */}
                {draftLoading && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                    <Database className="h-4 w-4 animate-spin" />
                    <span>Loading draft data...</span>
                  </div>
                )}

                {draftError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error: {draftError}</span>
                  </div>
                )}

                {/* Current Team Roster */}
                <Card className="mt-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3" />
                      {(() => {
                        const currentPickingTeam = getCurrentPickingTeam();
                        const ownerName = getOwnerNameForTeam(currentPickingTeam);
                        return `${ownerName}'s Roster`;
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const currentPickingTeam = getCurrentPickingTeam();
                      const teamDraftPicks = draftPicks.filter(pick => 
                        pick.team === currentPickingTeam && pick.player !== null
                      );
                      
                      if (teamDraftPicks.length === 0) {
                        return <div className="text-xs text-muted-foreground">No players drafted yet</div>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(position => {
                            const positionPlayers = teamDraftPicks.filter(pick => 
                              pick.player && pick.player.position === position
                            );
                            if (positionPlayers.length === 0) return null;
                            
                            return (
                              <div key={position}>
                                <h4 className="font-semibold text-xs mb-1">{position}</h4>
                                <div className="space-y-1">
                                  {positionPlayers.map(pick => (
                                    <div key={pick.player?.id || pick.round + '-' + pick.pick} className="flex justify-between items-center text-xs">
                                      <span className="font-medium">{pick.player?.name || 'Unknown'}</span>
                                      <span className="text-muted-foreground">{pick.player?.team || 'Unknown'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    
                    {/* Debug Info for Admin */}
                    {user?.is_admin && (
                      <details className="mt-3">
                        <summary className="text-xs font-semibold cursor-pointer">Debug Info</summary>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <p>Round: {currentRound}, Pick: {currentPick}</p>
                          <p>Available: {availablePlayers.length}, Drafted: {draftPicks.filter(p => p.player).length}</p>
                          <p>DB Picks: {dbDraftPicks.length}</p>
                          <p>Progress: {progress ? `${progress.currentRound}.${progress.currentPick}` : 'Loading...'}</p>
                          <div className="flex gap-1 mt-2">
                            <Button onClick={refreshPlayers} size="sm" variant="outline" className="h-5 px-1 text-xs">
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button onClick={refreshDraft} size="sm" variant="outline" className="h-5 px-1 text-xs">
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button onClick={() => handleClearDraft().catch(console.error)} size="sm" variant="destructive" className="h-5 px-1 text-xs">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>

                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(17, minmax(80px, 1fr))' }}>
                      {/* Header */}
                      <div className="font-medium text-center p-2">Round</div>
                      {DRAFT_ORDER.map((team, index) => (
                        <div 
                          key={index} 
                          className="font-medium text-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => showTeamRoster(team)}
                          title={`Click to view ${getOwnerNameForTeam(team)} roster`}
                        >
                          <div className="text-xs font-bold">{team}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {getOwnerNameForTeam(team)}
                          </div>
                        </div>
                      ))}

                      {/* Draft Rounds */}
                      {Array.from({ length: 16 }, (_, round) => (
                        <div key={round + 1} className="contents">
                          <div className="font-medium text-center p-2 bg-muted rounded">
                            {round + 1}
                          </div>
                          {DRAFT_ORDER.map((team, teamIndex) => {
                            // Find the pick for this team in this round
                            const pick = draftPicks.find(p => p.team === team && p.round === round + 1)
                            // Get the current picking team using the same logic as the draft order
                            const currentPickingTeam = getCurrentPickingTeam()
                            const isCurrentPick = round + 1 === currentRound && team === currentPickingTeam
                            
                            return (
                              <div
                                key={`${round + 1}-${team}`}
                                className={`p-2 border rounded text-center min-h-[60px] flex items-center justify-center ${
                                  isCurrentPick ? 'bg-primary text-primary-foreground' : 'bg-background'
                                }`}
                              >
                                {pick?.player ? (
                                  <div className="text-center">
                                    <div className="font-medium text-xs">{pick.player.name}</div>
                                    <div className="text-xs opacity-80">{pick.player.position}</div>
                                    <div className="text-xs opacity-60">{pick.player.team}</div>
                                  </div>
                                ) : isCurrentPick ? (
                                  <div className="text-center">
                                    <div className="text-sm font-bold">ON CLOCK</div>
                                    <div className="text-xs">{formatTime(timeRemaining)}</div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">-</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Draft Controls & Info */}
            <div className="w-80 border-l p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Draft Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="player-select">Select Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPlayers.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.position} - {player.team})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedPlayer && !user?.is_admin && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Player selected but you need admin access to submit</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {user?.is_admin ? (
                    <Button 
                      onClick={() => makePick().catch(console.error)} 
                      disabled={!selectedPlayer || !isDraftActive}
                      className="w-full"
                    >
                      Make Pick
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Admin Access Required</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Only administrators can submit draft picks. Please contact an admin to make your selection.
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <div>Round: {currentRound}/16</div>
                    <div>Pick: {currentPick}/16</div>
                    <div>Players Remaining: {availablePlayers.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Picks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {draftPicks
                      .filter(pick => pick.player)
                      .slice(-5)
                      .reverse()
                      .map((pick, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{pick.player?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Round {pick.round}, Pick {pick.pick} • {pick.team}
                            </div>
                          </div>
                          <Badge variant="outline">{pick.player?.position}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Team Roster Modal */}
      {showRosterModal && selectedTeamRoster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedTeamRoster.teamName} Roster</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTeamRoster.players.length} players drafted
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRosterModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {selectedTeamRoster.players.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No players drafted yet
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTeamRoster.players.map((player, index) => (
                    <Card key={player.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{player.position}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.team} • {player.position} • Bye {player.bye}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{player.projectedPoints} pts</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
