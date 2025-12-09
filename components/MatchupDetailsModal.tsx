import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trophy, Calendar, Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { MatchupDetails, PlayerScore } from '@/hooks/useMatchupDetails';
import { PlayerBreakdownModal } from './PlayerBreakdownModal';

interface MatchupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchupDetails: MatchupDetails | null;
  loading: boolean;
  error: string | null;
}

export function MatchupDetailsModal({ 
  isOpen, 
  onClose, 
  matchupDetails, 
  loading, 
  error 
}: MatchupDetailsModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');
  const [selectedPlayer, setSelectedPlayer] = useState<{
    playerId: string;
    playerName: string;
    position: string;
    week: number;
  } | null>(null);

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

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB':
        return 'bg-blue-100 text-blue-800'
      case 'RB':
        return 'bg-green-100 text-green-800'
      case 'WR':
        return 'bg-purple-100 text-purple-800'
      case 'TE':
        return 'bg-orange-100 text-orange-800'
      case 'K':
        return 'bg-yellow-100 text-yellow-800'
      case 'DEF':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePlayerClick = (player: PlayerScore) => {
    setSelectedPlayer({
      playerId: player.playerId,
      playerName: player.playerName,
      position: player.position,
      week: matchupDetails?.week || 1
    });
  };

  const renderPlayerRow = (player: PlayerScore, isUserTeam: boolean) => (
    <div 
      key={player.playerId} 
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => handlePlayerClick(player)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {player.playerName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">{player.playerName}</div>
          <div className="text-xs text-muted-foreground">
            {player.position} - {player.nflTeam}
            {player.opponentInfo && (
              <div className="mt-1">
                <span className="font-medium">{player.opponentInfo.displayText}</span>
                <span className="ml-2 text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {player.opponentInfo.kickoffTime}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-medium">{player.points} pts</div>
        </div>
        <Badge variant="outline" className={`text-xs ${getPositionColor(player.position)}`}>
          {player.position}
        </Badge>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matchup Details</DialogTitle>
            <DialogDescription>Loading matchup information...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading matchup details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matchup Details</DialogTitle>
            <DialogDescription>An error occurred while loading matchup information.</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!matchupDetails) {
    return null;
  }


  const team1 = matchupDetails.team1;
  const team2 = matchupDetails.team2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week {matchupDetails.week} Matchup Details
          </DialogTitle>
          <DialogDescription>
            View detailed scoring breakdown and player performances for {team1.teamName} vs {team2.teamName}
          </DialogDescription>
        </DialogHeader>

        {/* Matchup Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {team1.teamName} vs {team2.teamName}
                </CardTitle>
                <CardDescription>
                  Week {matchupDetails.week} • {matchupDetails.isComplete ? 'Final' : 'TBD'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {team1.totalScore} - {team2.totalScore}
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getResultColor(matchupDetails.result)} font-bold`}
                >
                  {matchupDetails.result}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-lg font-medium">{team1.teamName}</div>
                <div className="text-3xl font-bold text-green-600">{team1.totalScore}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">{team2.teamName}</div>
                <div className="text-3xl font-bold text-red-600">{team2.totalScore}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Selection Tabs */}
        <div className="flex gap-2">
          <Button
            variant={selectedTeam === 'team1' ? 'default' : 'outline'}
            onClick={() => setSelectedTeam('team1')}
            className="flex-1"
          >
            {team1.teamName}
          </Button>
          <Button
            variant={selectedTeam === 'team2' ? 'default' : 'outline'}
            onClick={() => setSelectedTeam('team2')}
            className="flex-1"
          >
            {team2.teamName}
          </Button>
        </div>

        {/* Selected Team's Lineup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedTeam === 'team1' ? team1.teamName : team2.teamName} Lineup
            </CardTitle>
            <CardDescription>
              Week {matchupDetails.week} starting lineup and player scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedTeam === 'team1' 
                ? team1.players.map(player => renderPlayerRow(player, true))
                : team2.players.map(player => renderPlayerRow(player, false))
              }
            </div>
          </CardContent>
        </Card>

        {/* Overtime Players Section - Only for Playoff Weeks (15-17) */}
        {matchupDetails.week >= 15 && matchupDetails.week <= 17 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Clock className="h-5 w-5" />
                Overtime Players (Tie-Breakers)
              </CardTitle>
              <CardDescription className="text-orange-700">
                Playoff games cannot end in a tie. These players are used as tie-breakers in order if the game ends in a tie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team 1 Overtime Players */}
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">{team1.teamName}</h4>
                  <div className="space-y-2">
                    {team1.overtimePlayers && team1.overtimePlayers.length > 0 ? (
                      team1.overtimePlayers.map((player, index) => (
                        <div 
                          key={player.playerId} 
                          className="flex items-center justify-between p-2 rounded-lg border border-orange-200 bg-white"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs min-w-[3rem]">
                              OT {index + 1}
                            </Badge>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {player.playerName.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{player.playerName}</div>
                              <div className="text-xs text-muted-foreground">
                                {player.position} - {player.nflTeam}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{player.points} pts</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic p-2">
                        No overtime players selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Team 2 Overtime Players */}
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">{team2.teamName}</h4>
                  <div className="space-y-2">
                    {team2.overtimePlayers && team2.overtimePlayers.length > 0 ? (
                      team2.overtimePlayers.map((player, index) => (
                        <div 
                          key={player.playerId} 
                          className="flex items-center justify-between p-2 rounded-lg border border-orange-200 bg-white"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs min-w-[3rem]">
                              OT {index + 1}
                            </Badge>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {player.playerName.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{player.playerName}</div>
                              <div className="text-xs text-muted-foreground">
                                {player.position} - {player.nflTeam}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{player.points} pts</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic p-2">
                        No overtime players selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Key statistics for {selectedTeam === 'team1' ? team1.teamName : team2.teamName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedTeam === 'team1' ? team1.totalScore : team2.totalScore}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedTeam === 'team1' 
                    ? (team1.players.length > 0 ? Math.floor(team1.totalScore / team1.players.length) : 0)
                    : (team2.players.length > 0 ? Math.floor(team2.totalScore / team2.players.length) : 0)
                  }
                </div>
                <div className="text-sm text-muted-foreground">Avg per Player</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Breakdown Modal */}
        {selectedPlayer && (
          <PlayerBreakdownModal
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            playerId={selectedPlayer.playerId}
            playerName={selectedPlayer.playerName}
            position={selectedPlayer.position}
            week={selectedPlayer.week}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 