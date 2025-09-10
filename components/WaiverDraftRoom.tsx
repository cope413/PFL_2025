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
  SkipForward,
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
  
  const { user } = useAuth()
  const { 
    waivedPlayers: hookWaivedPlayers, 
    isLoading, 
    error, 
    refreshWaiverData,
    makeWaiverPick,
    autoPick,
    startWaiverDraft,
    completeWaiverDraft
  } = useWaiver()

  // Load waiver draft data
  useEffect(() => {
    const loadWaiverDraft = async () => {
      try {
        const response = await fetch(`/api/waiver?action=waiver-draft&week=${week}`)
        const data = await response.json()
        
        if (data.success) {
          setWaivedPlayers(data.data.waivedPlayers || [])
          setDraftOrder(data.data.draftOrder || [])
          setPicks(data.data.picks || [])
          setCurrentPick(data.data.currentPick || 1)
          setIsDraftActive(data.data.isActive || false)
          setDraftStatus(data.data.draft.status || 'scheduled')
          setDraftId(data.data.draft.id || '')
        }
      } catch (err) {
        console.error('Error loading waiver draft:', err)
      }
    }

    loadWaiverDraft()
  }, [week])

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

  const getCurrentPickingTeam = (): WaiverDraftOrder | null => {
    return draftOrder.find(team => team.draft_order === currentPick) || null
  }

  const getNextPickingTeam = (): WaiverDraftOrder | null => {
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

  const handleAutoPick = async () => {
    if (!draftId) return

    const currentTeam = getCurrentPickingTeam()
    if (!currentTeam) return

    const autoPlayer = await autoPick(draftId, currentTeam.team_id, currentPick)
    
    if (autoPlayer) {
      // Update local state
      const newPick: WaiverPick = {
        pick_number: currentPick,
        team_id: currentTeam.team_id,
        player_id: autoPlayer.playerId,
        picked_at: new Date().toISOString(),
        player_name: autoPlayer.playerName,
        position: autoPlayer.position,
        nfl_team: '',
        team_name: currentTeam.team_name,
        owner_name: currentTeam.owner_name
      }
      
      setPicks(prev => [...prev, newPick])
      setWaivedPlayers(prev => prev.filter(p => p.player_id !== autoPlayer.playerId))
      
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
  }

  const filteredPlayers = waivedPlayers.filter(player => {
    const matchesSearch = player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.nfl_team.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = positionFilter === "ALL" || player.position === positionFilter
    return matchesSearch && matchesPosition
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
                <Badge variant={draftStatus === 'in_progress' ? 'default' : 'secondary'}>
                  {draftStatus === 'scheduled' ? 'Scheduled' : 
                   draftStatus === 'in_progress' ? 'In Progress' : 'Completed'}
                </Badge>
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
                          <Button variant="outline" onClick={pauseDraft}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </Button>
                          <Button variant="outline" onClick={handleAutoPick}>
                            <SkipForward className="mr-2 h-4 w-4" />
                            Auto Pick
                          </Button>
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
                    <CardTitle className="text-sm">Draft Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {draftOrder.map((team, index) => (
                        <div 
                          key={team.team_id}
                          className={`p-2 rounded text-center text-sm ${
                            team.draft_order === currentPick 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="font-bold">{team.draft_order}</div>
                          <div className="text-xs">{team.team_id}</div>
                          <div className="text-xs truncate">
                            {team.owner_name || team.team_name}
                          </div>
                        </div>
                      ))}
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
                    <Button 
                      onClick={makePick} 
                      disabled={!selectedPlayer || draftStatus !== 'in_progress'}
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
