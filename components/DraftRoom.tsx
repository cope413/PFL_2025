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
  Undo2
} from "lucide-react"

interface Player {
  id: string
  name: string
  position: string
  team: string
  adp: number
  projectedPoints: number
  bye: number
}

interface DraftPick {
  round: number
  pick: number
  team: string
  player: Player | null
  timestamp: Date
}

interface DraftRoomProps {
  onClose: () => void
}

const DRAFT_ORDER = [
  "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
  "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
]

const MOCK_PLAYERS: Player[] = [
  { id: "1", name: "Christian McCaffrey", position: "RB", team: "SF", adp: 1.2, projectedPoints: 350, bye: 9 },
  { id: "2", name: "Tyreek Hill", position: "WR", team: "MIA", adp: 2.1, projectedPoints: 320, bye: 11 },
  { id: "3", name: "Breece Hall", position: "RB", team: "NYJ", adp: 3.5, projectedPoints: 310, bye: 7 },
  { id: "4", name: "Ja'Marr Chase", position: "WR", team: "CIN", adp: 4.2, projectedPoints: 305, bye: 12 },
  { id: "5", name: "Saquon Barkley", position: "RB", team: "PHI", adp: 5.1, projectedPoints: 300, bye: 10 },
  { id: "6", name: "CeeDee Lamb", position: "WR", team: "DAL", adp: 6.3, projectedPoints: 295, bye: 7 },
  { id: "7", name: "Bijan Robinson", position: "RB", team: "ATL", adp: 7.2, projectedPoints: 290, bye: 11 },
  { id: "8", name: "Amon-Ra St. Brown", position: "WR", team: "DET", adp: 8.1, projectedPoints: 285, bye: 9 },
  { id: "9", name: "Travis Kelce", position: "TE", team: "KC", adp: 9.5, projectedPoints: 280, bye: 10 },
  { id: "10", name: "Derrick Henry", position: "RB", team: "BAL", adp: 10.2, projectedPoints: 275, bye: 13 },
  { id: "11", name: "Josh Allen", position: "QB", team: "BUF", adp: 11.1, projectedPoints: 270, bye: 13 },
  { id: "12", name: "Stefon Diggs", position: "WR", team: "HOU", adp: 12.3, projectedPoints: 265, bye: 7 },
  { id: "13", name: "Nick Chubb", position: "RB", team: "CLE", adp: 13.2, projectedPoints: 260, bye: 5 },
  { id: "14", name: "Davante Adams", position: "WR", team: "LV", adp: 14.1, projectedPoints: 255, bye: 13 },
  { id: "15", name: "Patrick Mahomes", position: "QB", team: "KC", adp: 15.5, projectedPoints: 250, bye: 10 },
  { id: "16", name: "Austin Ekeler", position: "RB", team: "WAS", adp: 16.2, projectedPoints: 245, bye: 14 },
  { id: "17", name: "DeVonta Smith", position: "WR", team: "PHI", adp: 17.3, projectedPoints: 240, bye: 10 },
  { id: "18", name: "Mark Andrews", position: "TE", team: "BAL", adp: 18.1, projectedPoints: 235, bye: 13 },
  { id: "19", name: "Jahmyr Gibbs", position: "RB", team: "DET", adp: 19.2, projectedPoints: 230, bye: 9 },
  { id: "20", name: "DK Metcalf", position: "WR", team: "SEA", adp: 20.1, projectedPoints: 225, bye: 11 },
]

export default function DraftRoom({ onClose }: DraftRoomProps) {
  const [currentRound, setCurrentRound] = useState(1)
  const [currentPick, setCurrentPick] = useState(1)
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(MOCK_PLAYERS)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [isDraftActive, setIsDraftActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(90) // 90 seconds per pick
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("ALL")

  // Initialize draft picks
  useEffect(() => {
    const picks: DraftPick[] = []
    for (let round = 1; round <= 16; round++) {
      for (let pick = 1; pick <= 16; pick++) {
        const teamIndex = (round % 2 === 1) ? pick - 1 : 16 - pick
        picks.push({
          round,
          pick,
          team: DRAFT_ORDER[teamIndex],
          player: null,
          timestamp: new Date()
        })
      }
    }
    setDraftPicks(picks)
  }, [])

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isDraftActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-pick the highest ADP available player
            autoPick()
            return 90
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isDraftActive, timeRemaining])

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

  const makePick = () => {
    if (!selectedPlayer) return

    const player = availablePlayers.find(p => p.id === selectedPlayer)
    if (!player) return

    const pickIndex = (currentRound - 1) * 16 + (currentPick - 1)
    if (pickIndex >= draftPicks.length) return
    
    const updatedPicks = [...draftPicks]
    updatedPicks[pickIndex].player = player
    updatedPicks[pickIndex].timestamp = new Date()
    setDraftPicks(updatedPicks)

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
    setTimeRemaining(90)
  }

  const autoPick = () => {
    if (availablePlayers.length === 0) return

    // Pick the highest ADP available player
    const player = availablePlayers[0]
    const pickIndex = (currentRound - 1) * 16 + (currentPick - 1)
    if (pickIndex >= draftPicks.length) return
    
    const updatedPicks = [...draftPicks]
    updatedPicks[pickIndex].player = player
    updatedPicks[pickIndex].timestamp = new Date()
    setDraftPicks(updatedPicks)

    // Remove player from available list
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))

    // Move to next pick
    if (currentPick === 16) {
      if (currentRound === 16) {
        setIsDraftActive(false)
      } else {
        setCurrentRound(prev => prev + 1)
        setCurrentPick(1)
      }
    } else {
      setCurrentPick(prev => prev + 1)
    }

    // Reset timer
    setTimeRemaining(90)
  }

  const startDraft = () => {
    setIsDraftActive(true)
    setCurrentRound(1)
    setCurrentPick(1)
    setTimeRemaining(90)
  }

  const pauseDraft = () => {
    setIsDraftActive(false)
  }

  const skipPick = () => {
    autoPick()
  }

  const undoLastPick = () => {
    if (draftPicks.length === 0) return

    const lastPickIndex = draftPicks.findLastIndex(p => p.player !== null)
    if (lastPickIndex === -1) return

    const lastPick = draftPicks[lastPickIndex]
    if (!lastPick.player) return

    // Add player back to available list
    setAvailablePlayers(prev => [lastPick.player!, ...prev].sort((a, b) => a.adp - b.adp))

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

    setTimeRemaining(90)
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">PFL Draft Room</h2>
            <p className="text-muted-foreground">Round {currentRound}, Pick {currentPick}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Current Team</div>
              <div className="text-xl font-bold">{getCurrentTeam()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Next Team</div>
              <div className="text-xl font-bold">{getNextTeam()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Time Remaining</div>
              <div className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-500' : ''}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Available Players */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="space-y-4">
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
                      selectedPlayer === player.id ? 'ring-2 ring-primary' : ''
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
                          <div className="text-sm font-medium">ADP: {player.adp}</div>
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
                <h3 className="text-lg font-semibold">Draft Board</h3>
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
                      <Button variant="outline" onClick={skipPick}>
                        <SkipForward className="mr-2 h-4 w-4" />
                        Skip
                      </Button>
                      <Button variant="outline" onClick={undoLastPick}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Undo
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(17, minmax(80px, 1fr))' }}>
                    {/* Header */}
                    <div className="font-medium text-center p-2 bg-muted rounded">Round</div>
                    {DRAFT_ORDER.map((team, index) => (
                      <div key={index} className="font-medium text-center p-2 bg-muted rounded">
                        {team}
                      </div>
                    ))}

                    {/* Draft Rounds */}
                    {Array.from({ length: 16 }, (_, round) => (
                      <div key={round + 1} className="contents">
                        <div className="font-medium text-center p-2 bg-muted rounded">
                          {round + 1}
                        </div>
                        {DRAFT_ORDER.map((team, teamIndex) => {
                          const pickIndex = round * 16 + teamIndex
                          const pick = draftPicks[pickIndex]
                          const isCurrentPick = round + 1 === currentRound && teamIndex + 1 === currentPick
                          
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
                </div>
                
                <Button 
                  onClick={makePick} 
                  disabled={!selectedPlayer || !isDraftActive}
                  className="w-full"
                >
                  Make Pick
                </Button>

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
  )
}
