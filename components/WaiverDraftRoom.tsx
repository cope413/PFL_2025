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
import { useWaiver } from "@/hooks/useWaiver"
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
  Undo2,
  Shield,
  AlertCircle,
  X,
  Database,
  RefreshCw,
  Trash2,
  Calendar,
  Timer
} from "lucide-react"

interface WaiverDraftRoomProps {
  onClose: () => void
  week: number
}

interface WaiverPlayer {
  player_id: string
  team_id: string
  waiver_order: number
  waived_at: string
  status: 'available' | 'drafted'
  player_name: string
  position: string
  nfl_team: string
  team_name?: string
  owner_name?: string
  total_points?: number
  avg_points?: number
}

interface WaiverDraftOrder {
  team_id: string
  draft_order: number
  team_name?: string
  owner_name?: string
}

interface WaiverPick {
  pick_number: number
  team_id: string
  player_id: string
  picked_at: string
  player_name: string
  position: string
  nfl_team: string
  team_name?: string
  owner_name?: string
}

export default function WaiverDraftRoom({ onClose, week }: WaiverDraftRoomProps) {
  const [currentPick, setCurrentPick] = useState(1)
  const [waivedPlayers, setWaivedPlayers] = useState<WaiverPlayer[]>([])
  const [draftOrder, setDraftOrder] = useState<WaiverDraftOrder[]>([])
  const [customSequence, setCustomSequence] = useState<any[]>([])
  const [nextPickInfo, setNextPickInfo] = useState<any>(null)
  const [picks, setPicks] = useState<WaiverPick[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [isDraftActive, setIsDraftActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(180) // 3 minutes per pick
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("ALL")
  const [isMaximized, setIsMaximized] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'scheduled' | 'in_progress' | 'completed'>('scheduled')
  const [draftId, setDraftId] = useState<string>("")
  const [isPaused, setIsPaused] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  
  const { user } = useAuth()
  const { 
    waivedPlayers: hookWaivedPlayers, 
    isLoading, 
    error, 
    refreshWaiverData,
    makeWaiverPick,
    startWaiverDraft,
    completeWaiverDraft,
    undoLastPick,
    clearDraft
  } = useWaiver()

  // Load waiver draft data function
  const loadWaiverDraft = async () => {
    try {
      const response = await fetch(`/api/waiver?action=waiver-draft&week=${week}`)
      const data = await response.json()
      
      if (data.success) {
        setWaivedPlayers(data.data.waivedPlayers || [])
        setDraftOrder(data.data.draftOrder || [])
        setCustomSequence(data.data.customSequence || [])
        setNextPickInfo(data.data.nextPickInfo || null)
        setPicks(data.data.picks || [])
        
        // Calculate current pick based on existing picks
        const existingPicks = data.data.picks || []
        const calculatedCurrentPick = existingPicks.length + 1
        setCurrentPick(calculatedCurrentPick)
        
        setIsDraftActive(data.data.isActive || false)
        setDraftStatus(data.data.draft.status || 'scheduled')
        setDraftId(data.data.draft.id || '')
      }
    } catch (err) {
      console.error('Error loading waiver draft:', err)
    }
  }

  // Load waiver draft data on component mount
  useEffect(() => {
    loadWaiverDraft()
  }, [week])

  // Auto-refresh during active draft
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    // Only auto-refresh if:
    // 1. Draft is in progress
    // 2. Not paused
    // 3. Auto-refresh is enabled
    // 4. User is not actively interacting (no selected player)
    if (draftStatus === 'in_progress' && !isPaused && autoRefreshEnabled && !selectedPlayer) {
      interval = setInterval(() => {
        loadWaiverDraft()
      }, 3000) // Refresh every 3 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [draftStatus, isPaused, autoRefreshEnabled, selectedPlayer, week])

  // Update waived players when hook data changes
  useEffect(() => {
    if (hookWaivedPlayers.length > 0) {
      setWaivedPlayers(hookWaivedPlayers)
    }
  }, [hookWaivedPlayers])

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isDraftActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
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

  const getCurrentPickingTeam = (): any => {
    if (customSequence.length > 0) {
      return customSequence.find(pick => pick.pick_number === currentPick) || null
    }
    return draftOrder.find(team => team.draft_order === currentPick) || null
  }

  const getNextPickingTeam = (): any => {
    if (customSequence.length > 0) {
      return customSequence.find(pick => pick.pick_number === currentPick + 1) || null
    }
    return draftOrder.find(team => team.draft_order === currentPick + 1) || null
  }

  const makePick = async () => {
    if (!selectedPlayer || !draftId) return

    const currentTeam = getCurrentPickingTeam()
    if (!currentTeam) return

    const success = await makeWaiverPick(draftId, currentTeam.team_id, selectedPlayer, currentPick)
    
    if (success) {
      // Update local state
      const player = waivedPlayers.find(p => p.player_id === selectedPlayer)
      if (player) {
        const newPick: WaiverPick = {
          pick_number: currentPick,
          team_id: currentTeam.team_id,
          player_id: selectedPlayer,
          picked_at: new Date().toISOString(),
          player_name: player.player_name,
          position: player.position,
          nfl_team: player.nfl_team,
          team_name: currentTeam.team_name,
          owner_name: currentTeam.owner_name
        }
        
        setPicks(prev => [...prev, newPick])
        setWaivedPlayers(prev => prev.filter(p => p.player_id !== selectedPlayer))
        setSelectedPlayer("")
        
        // Move to next pick
        if (currentPick < waivedPlayers.length) {
          setCurrentPick(prev => prev + 1)
        } else {
          // Draft complete
          setIsDraftActive(false)
          setDraftStatus('completed')
          await completeWaiverDraft(draftId)
        }
        
        // Reset timer
        setTimeRemaining(180)
      }
    }
  }

  const handleUndoLastPick = async () => {
    if (!draftId) return
    
    const success = await undoLastPick(draftId)
    if (success) {
      // Reload the draft data to get updated picks
      await loadWaiverDraft()
    }
  }

  const handleClearDraft = async () => {
    if (!draftId) return
    
    const confirmed = window.confirm('Are you sure you want to clear all picks from this draft? This action cannot be undone.')
    if (!confirmed) return
    
    const success = await clearDraft(draftId)
    if (success) {
      // Reload the draft data to get updated picks
      await loadWaiverDraft()
    }
  }

  const startDraft = async () => {
    if (!draftId) return
    
    const success = await startWaiverDraft(draftId)
    if (success) {
      setIsDraftActive(true)
      setDraftStatus('in_progress')
      setTimeRemaining(180)
    }
  }

  const pauseDraft = () => {
    setIsDraftActive(false)
    setShowTimeWarning(false)
    setIsPaused(true)
  }

  const resumeDraft = () => {
    setIsDraftActive(true)
    setIsPaused(false)
  }

  const filteredPlayers = waivedPlayers.filter(player => {
    const matchesSearch = player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.nfl_team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = positionFilter === "ALL" || player.position === positionFilter
    return matchesSearch && matchesPosition
  }).sort((a, b) => {
    // Sort by average points (highest to lowest)
    const avgA = parseFloat(a.avg_points) || 0
    const avgB = parseFloat(b.avg_points) || 0
    return avgB - avgA
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentTeam = getCurrentPickingTeam()
  const nextTeam = getNextPickingTeam()

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
              <h2 className="text-2xl font-bold">Waiver Draft - Week {week}</h2>
              <p className="text-muted-foreground">Pick {currentPick} of {waivedPlayers.length + picks.length}</p>
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
                <div className="flex items-center gap-2">
                  <Badge variant={draftStatus === 'in_progress' ? 'default' : 'secondary'}>
                    {draftStatus === 'scheduled' ? 'Scheduled' : 
                     draftStatus === 'in_progress' ? 'In Progress' : 'Completed'}
                  </Badge>
                  {autoRefreshEnabled && draftStatus === 'in_progress' && !isPaused && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Current Team</div>
                <div className="text-xl font-bold">{currentTeam?.team_id || '-'}</div>
                <div className="text-xs text-muted-foreground">
                  {currentTeam?.owner_name || currentTeam?.team_name || '-'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Next Team</div>
                <div className="text-xl font-bold">{nextTeam?.team_id || '-'}</div>
                <div className="text-xs text-muted-foreground">
                  {nextTeam?.owner_name || nextTeam?.team_name || '-'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Time Remaining</div>
                <div className={`text-xl font-bold ${timeRemaining <= 30 ? 'text-red-500' : ''}`}>
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
                      You can browse waived players and see the draft board, but only administrators can submit picks and control the draft.
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
                      Time is up! Please submit your pick or use auto-pick.
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
                      key={player.player_id} 
                      className={`cursor-pointer transition-colors ${
                        selectedPlayer === player.player_id 
                          ? user?.is_admin 
                            ? 'ring-2 ring-primary' 
                            : 'ring-2 ring-amber-400'
                          : ''
                      }`}
                      onClick={() => setSelectedPlayer(player.player_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{player.position}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{player.player_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.nfl_team} • {player.position}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Waived by: {player.owner_name || player.team_name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Total: {player.total_points || 0} pts
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {player.avg_points || 0} pts
                            </div>
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
                    <h3 className="text-lg font-semibold">Waiver Draft Board</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshWaiverData}
                      disabled={isLoading}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  {user?.is_admin ? (
                    <div className="flex items-center gap-2">
                      {draftStatus === 'scheduled' ? (
                        <Button onClick={startDraft}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Draft
                        </Button>
                      ) : draftStatus === 'in_progress' ? (
                        <>
                          {isPaused ? (
                            <Button variant="outline" onClick={resumeDraft}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </Button>
                          ) : (
                            <Button variant="outline" onClick={pauseDraft}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </Button>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">Draft Complete</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Draft controls are admin-only
                    </div>
                  )}
                </div>

                {/* Draft Order */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Draft Order</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadWaiverDraft}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                          className={`h-6 px-2 text-xs ${
                            autoRefreshEnabled 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-500 bg-gray-50'
                          }`}
                        >
                          {autoRefreshEnabled ? 'Auto' : 'Manual'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {customSequence.length > 0 ? (
                        // Show custom sequence if available
                        customSequence.map((pick, index) => {
                          // Find if this pick has been made
                          const madePick = picks.find(p => p.pick_number === pick.pick_number);
                          
                          return (
                            <div 
                              key={`${pick.team_id}-${pick.pick_number}`}
                              className={`p-2 rounded text-center text-sm ${
                                pick.pick_number === currentPick 
                                  ? 'bg-primary text-primary-foreground' 
                                  : madePick 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-muted'
                              }`}
                            >
                              <div className="font-bold">{pick.pick_number}</div>
                              <div className="text-xs">{pick.team_id}</div>
                              <div className="text-xs truncate">
                                {pick.owner_name || pick.team_name || pick.username}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                R{pick.round_number}
                              </div>
                              {madePick && (
                                <div className="mt-1 pt-1 border-t border-gray-300">
                                  <div className="text-xs font-medium text-green-700">
                                    {madePick.player_name}
                                  </div>
                                  <div className="text-xs text-green-600">
                                    {madePick.position}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback to regular draft order
                        draftOrder.map((team, index) => {
                          // Find if this pick has been made
                          const madePick = picks.find(p => p.pick_number === team.draft_order);
                          
                          return (
                            <div 
                              key={team.team_id}
                              className={`p-2 rounded text-center text-sm ${
                                team.draft_order === currentPick 
                                  ? 'bg-primary text-primary-foreground' 
                                  : madePick 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-muted'
                              }`}
                            >
                              <div className="font-bold">{team.draft_order}</div>
                              <div className="text-xs">{team.team_id}</div>
                              <div className="text-xs truncate">
                                {team.owner_name || team.team_name}
                              </div>
                              {madePick && (
                                <div className="mt-1 pt-1 border-t border-gray-300">
                                  <div className="text-xs font-medium text-green-700">
                                    {madePick.player_name}
                                  </div>
                                  <div className="text-xs text-green-600">
                                    {madePick.position}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Picks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Picks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {picks.slice(-10).reverse().map((pick, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{pick.player_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Pick {pick.pick_number} • {pick.team_name || pick.team_id}
                            </div>
                          </div>
                          <Badge variant="outline">{pick.position}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Panel - Draft Controls */}
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
                          <SelectItem key={player.player_id} value={player.player_id}>
                            {player.player_name} ({player.position} - {player.nfl_team})
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
                    <div className="space-y-2">
                      <Button 
                        onClick={makePick} 
                        disabled={!selectedPlayer || draftStatus !== 'in_progress'}
                        className="w-full"
                      >
                        Make Pick
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleUndoLastPick}
                          disabled={picks.length === 0 || draftStatus !== 'in_progress'}
                          className="flex-1"
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Undo
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleClearDraft}
                          disabled={picks.length === 0 || draftStatus !== 'in_progress'}
                          className="flex-1"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Admin Access Required</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Only administrators can submit waiver picks. Please contact an admin to make your selection.
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <div>Pick: {currentPick}/{waivedPlayers.length + picks.length}</div>
                    <div>Players Available: {waivedPlayers.length}</div>
                    <div>Picks Made: {picks.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Waiver Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Week:</span>
                      <span className="font-medium">{week}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={draftStatus === 'in_progress' ? 'default' : 'secondary'}>
                        {draftStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Timer:</span>
                      <span className="font-medium">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
