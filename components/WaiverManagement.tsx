"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { useWaiver } from "@/hooks/useWaiver"
import { 
  Clock, 
  Users, 
  AlertTriangle,
  Calendar,
  UserMinus,
  UserPlus,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react"

interface WaiverManagementProps {
  teamId: string
}

interface TeamRosterPlayer {
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

interface WaiverStatus {
  currentWeek: number
  isWaiverWeek: boolean
  deadline: string | null
  canWaivePlayers: boolean
}

export default function WaiverManagement({ teamId }: WaiverManagementProps) {
  const [teamRoster, setTeamRoster] = useState<TeamRosterPlayer[]>([])
  const [waivedPlayers, setWaivedPlayers] = useState<any[]>([])
  const [waiverStatus, setWaiverStatus] = useState<WaiverStatus | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { user } = useAuth()
  const { waivePlayer, removeWaivedPlayer, refreshWaiverData } = useWaiver()

  // Load team roster
  const loadTeamRoster = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/waiver/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'get-team-roster',
          teamId
        })
      })

      const data = await response.json()
      if (data.success) {
        setTeamRoster(data.data)
      } else {
        setError(data.error || 'Failed to load team roster')
      }
    } catch (err) {
      console.error('Error loading team roster:', err)
      setError('Failed to load team roster')
    } finally {
      setIsLoading(false)
    }
  }

  // Load waiver status
  const loadWaiverStatus = async () => {
    try {
      const response = await fetch('/api/waiver/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'check-waiver-status'
        })
      })

      const data = await response.json()
      if (data.success) {
        setWaiverStatus(data.data)
      }
    } catch (err) {
      console.error('Error loading waiver status:', err)
    }
  }

  // Load waived players for this team
  const loadWaivedPlayers = async () => {
    try {
      const response = await fetch(`/api/waiver/players?teamId=${teamId}`)
      const data = await response.json()
      if (data.success) {
        setWaivedPlayers(data.data)
      }
    } catch (err) {
      console.error('Error loading waived players:', err)
    }
  }

  // Load initial data
  useEffect(() => {
    loadTeamRoster()
    loadWaiverStatus()
    loadWaivedPlayers()
  }, [teamId])

  const handleWaivePlayers = async () => {
    if (selectedPlayers.length === 0) {
      setError('Please select at least one player to waive')
      return
    }

    if (!waiverStatus?.canWaivePlayers) {
      setError('Players cannot be waived at this time. Check waiver deadlines.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      let successCount = 0
      let currentOrder = 1

      // Get the next available waiver order for this team
      const waivedPlayers = await fetch(`/api/waiver/players?teamId=${teamId}`)
        .then(res => res.json())
        .then(data => data.success ? data.data : [])
        .catch(() => [])

      if (waivedPlayers.length > 0) {
        currentOrder = Math.max(...waivedPlayers.map((p: any) => p.waiver_order)) + 1
      }

      // Check for duplicates before attempting to waive
      const alreadyWaivedPlayerIds = waivedPlayers.map((p: any) => p.player_id)
      const duplicatePlayers = selectedPlayers.filter(playerId => alreadyWaivedPlayerIds.includes(playerId))
      
      if (duplicatePlayers.length > 0) {
        setError(`The following players have already been waived: ${duplicatePlayers.join(', ')}`)
        setIsLoading(false)
        return
      }

      for (const playerId of selectedPlayers) {
        const success = await waivePlayer(playerId, teamId, currentOrder)
        if (success) {
          successCount++
          currentOrder++
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully waived ${successCount} player(s)`)
        setSelectedPlayers([])
        await loadTeamRoster()
        await loadWaivedPlayers()
        await refreshWaiverData()
      } else {
        setError('Failed to waive any players')
      }
    } catch (err) {
      console.error('Error waiving players:', err)
      setError('Failed to waive players')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveWaivedPlayer = async (playerId: string) => {
    if (!waiverStatus?.canWaivePlayers) {
      setError('Players cannot be removed from waiver list at this time. Check waiver deadlines.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const success = await removeWaivedPlayer(playerId, teamId)
      if (success) {
        setSuccess('Player removed from waiver list successfully')
        await loadTeamRoster()
        await loadWaivedPlayers()
        await refreshWaiverData()
      } else {
        setError('Failed to remove player from waiver list')
      }
    } catch (err) {
      console.error('Error removing waived player:', err)
      setError('Failed to remove player from waiver list')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlayerSelection = (playerId: string) => {
    // Check if player is already waived
    const isAlreadyWaived = waivedPlayers.some(p => p.player_id === playerId)
    if (isAlreadyWaived) {
      setError('This player has already been waived')
      return
    }

    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'N/A'
    return new Date(deadline).toLocaleString()
  }

  const isPlayerSelected = (playerId: string) => selectedPlayers.includes(playerId)

  return (
    <div className="space-y-6">
      {/* Waiver Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Waiver Status
          </CardTitle>
          <CardDescription>Current waiver period information</CardDescription>
        </CardHeader>
        <CardContent>
          {waiverStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Current Week</div>
                <div className="text-2xl font-bold">{waiverStatus.currentWeek}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Waiver Week</div>
                <Badge variant={waiverStatus.isWaiverWeek ? 'default' : 'secondary'}>
                  {waiverStatus.isWaiverWeek ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Deadline</div>
                <div className="text-sm font-medium">
                  {formatDeadline(waiverStatus.deadline)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Loading waiver status...</div>
          )}
        </CardContent>
      </Card>

      {/* Waiver Instructions */}
      {waiverStatus?.isWaiverWeek && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Waiver Period Active:</strong> You can waive players until {formatDeadline(waiverStatus.deadline)}. 
            Each waived player gives you one waiver draft pick. Players must be waived by 7:00 PM EST on Friday 
            before the waiver draft week.
          </AlertDescription>
        </Alert>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Currently Waived Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Waived Players
          </CardTitle>
          <CardDescription>Players you have waived for this waiver period</CardDescription>
        </CardHeader>
        <CardContent>
          {waivedPlayers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No players waived yet
            </div>
          ) : (
            <div className="space-y-2">
              {waivedPlayers.map((player) => (
                <div key={player.player_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{player.position}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.player_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.nfl_team} • {player.position}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Date(player.waived_at).toLocaleDateString()}
                      </div>
                    </div>
                    {waiverStatus?.canWaivePlayers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveWaivedPlayer(player.player_id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserPlus className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Roster */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Roster
          </CardTitle>
          <CardDescription>Select players to waive</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading roster...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleWaivePlayers}
                  disabled={selectedPlayers.length === 0 || !waiverStatus?.canWaivePlayers || isLoading}
                  className="flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Waive Selected Players ({selectedPlayers.length})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadTeamRoster}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>NFL Team</TableHead>
                    <TableHead className="text-right">Avg Points</TableHead>
                    <TableHead className="text-right">Bye Week</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRoster.map((player) => {
                    const isAlreadyWaived = waivedPlayers.some(p => p.player_id === player.id)
                    return (
                      <TableRow 
                        key={player.id}
                        className={`transition-colors ${
                          isAlreadyWaived 
                            ? 'opacity-50 cursor-not-allowed' 
                            : isPlayerSelected(player.id) 
                              ? 'bg-primary/10 cursor-pointer' 
                              : 'cursor-pointer'
                        }`}
                        onClick={() => !isAlreadyWaived && togglePlayerSelection(player.id)}
                      >
                        <TableCell>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isAlreadyWaived
                              ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
                              : isPlayerSelected(player.id) 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                          }`}>
                            {isPlayerSelected(player.id) && !isAlreadyWaived && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-sm"></div>
                            )}
                            {isAlreadyWaived && (
                              <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                            )}
                          </div>
                        </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{player.position}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {player.name}
                              {isAlreadyWaived && (
                                <span className="ml-2 text-xs text-muted-foreground">(Already Waived)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.position}</Badge>
                      </TableCell>
                      <TableCell>{player.nflTeam}</TableCell>
                      <TableCell className="text-right">{player.avgPoints?.toFixed(1) || '0.0'}</TableCell>
                      <TableCell className="text-right">{player.byeWeek || '-'}</TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiver Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Waiver Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <strong>Waiver Periods:</strong> Players can be waived during weeks 2, 5, 8, and 11
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <strong>Deadline:</strong> Players must be waived by 7:00 PM EST on Friday before the waiver draft week
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <strong>Waiver Picks:</strong> Each waived player gives you one waiver draft pick
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <strong>Draft Order:</strong> Based on worst record, lowest points scored
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <strong>No Trade Fee:</strong> Waiving players is free, but drafting players costs a trade fee
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
