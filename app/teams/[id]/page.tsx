"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Users, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMatchupDetails } from "@/hooks/useMatchupDetails";
import { MatchupDetailsModal } from "@/components/MatchupDetailsModal";

interface TeamData {
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
  nflTeam: string;
  team: string;
  isStarter: boolean;
  points?: number;
  projectedPoints?: number;
}

interface Matchup {
  id: string;
  week: number;
  team1_id: string;
  team2_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  team1_projected: number;
  team2_projected: number;
  date: string;
  result?: 'W' | 'L' | 'T';
}

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekForDetails, setSelectedWeekForDetails] = useState<number | null>(null);
  const [isMatchupModalOpen, setIsMatchupModalOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<{ team1Id: string; team2Id: string } | null>(null);
  const { matchupDetails, loading: matchupDetailsLoading, error: matchupDetailsError, fetchMatchupDetails } = useMatchupDetails(selectedWeekForDetails || undefined, selectedTeamIds);

  const teamId = params.id as string;

  const handleMatchupClick = (week: number, team1Id: string, team2Id: string) => {
    setSelectedWeekForDetails(week);
    setIsMatchupModalOpen(true);
    setSelectedTeamIds({ team1Id, team2Id });
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch team standings data
        const standingsResponse = await fetch('/api/standings');
        if (!standingsResponse.ok) {
          throw new Error('Failed to fetch standings');
        }
        const standingsData = await standingsResponse.json();
        
        // Find the specific team
        const team = standingsData.data.find((t: TeamData) => t.id === teamId);
        if (!team) {
          throw new Error('Team not found');
        }
        setTeamData(team);

        // Fetch team roster using the public teams API
        const rosterResponse = await fetch(`/api/teams?teamId=${teamId}`);
        if (rosterResponse.ok) {
          const rosterData = await rosterResponse.json();
          setPlayers(rosterData.data?.roster || []);
        }

        // Fetch team matchups for all weeks using batch endpoint
        try {
          const matchupsResponse = await fetch(`/api/teams/${teamId}/matchups`);
          if (matchupsResponse.ok) {
            const matchupsData = await matchupsResponse.json();
            if (matchupsData.success && matchupsData.data) {
              setMatchups(matchupsData.data);
              console.log(`✅ Fetched ${matchupsData.data.length} matchups for team ${teamId} in single request`);
            } else {
              console.error('Failed to fetch matchups:', matchupsData.error);
              setMatchups([]);
            }
          } else {
            console.error('Matchups API request failed:', matchupsResponse.statusText);
            setMatchups([]);
          }
        } catch (error) {
          console.error('Error fetching team matchups:', error);
          setMatchups([]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="text-lg">Loading team details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Team not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const winPercentage = teamData.wins + teamData.losses + teamData.ties > 0 
    ? ((teamData.wins + teamData.ties * 0.5) / (teamData.wins + teamData.losses + teamData.ties) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Team Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{teamData.teamField}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{teamData.teamName}</h1>
              <p className="text-muted-foreground">
                {teamData.teamField} • Division {teamData.division}
              </p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold">{winPercentage}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Season Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Season Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{teamData.wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{teamData.losses}</div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{teamData.ties}</div>
                    <div className="text-sm text-muted-foreground">Ties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{teamData.pointsFor.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Points For</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{teamData.pointsAgainst.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Points Against</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Matchups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Matchups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchups.length > 0 ? (
                  <div className="space-y-3">
                    {matchups.slice(0, 5).map((matchup) => {
                      const isHomeTeam = matchup.team1_id === teamId;
                      const opponent = isHomeTeam ? matchup.team2_name : matchup.team1_name;
                      const teamScore = isHomeTeam ? matchup.team1_score : matchup.team2_score;
                      const opponentScore = isHomeTeam ? matchup.team2_score : matchup.team1_score;
                      const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
                      
                      return (
                        <div key={matchup.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMatchupClick(matchup.week, matchup.team1_id, matchup.team2_id)}>
                          <div className="flex items-center gap-3">
                            <Badge variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}>
                              {result}
                            </Badge>
                            <div>
                              <div className="font-medium">Week {matchup.week}</div>
                              <div className="text-sm text-muted-foreground">
                                {isHomeTeam ? 'vs' : '@'} {opponent}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{teamScore.toFixed(1)} - {opponentScore.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">{matchup.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No matchups found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roster" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Roster
                </CardTitle>
                <CardDescription>
                  Current roster and player statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {players.length > 0 ? (
                  <div className="space-y-3">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.nflTeam}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{player.points?.toFixed(1) || '0.0'}</div>
                          <div className="text-sm text-muted-foreground">
                            Proj: {player.projectedPoints?.toFixed(1) || '0.0'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No roster data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Full Schedule
                </CardTitle>
                <CardDescription>
                  Complete season schedule and results • Click any matchup to view lineups
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchups.length > 0 ? (
                  <div className="space-y-3">
                    {matchups.map((matchup) => {
                      const isHomeTeam = matchup.team1_id === teamId;
                      const opponent = isHomeTeam ? matchup.team2_name : matchup.team1_name;
                      const teamScore = isHomeTeam ? matchup.team1_score : matchup.team2_score;
                      const opponentScore = isHomeTeam ? matchup.team2_score : matchup.team1_score;
                      const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
                      
                      return (
                        <div key={matchup.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMatchupClick(matchup.week, matchup.team1_id, matchup.team2_id)}>
                          <div className="flex items-center gap-3">
                            <Badge variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}>
                              {result}
                            </Badge>
                            <div>
                              <div className="font-medium">Week {matchup.week}</div>
                              <div className="text-sm text-muted-foreground">
                                {isHomeTeam ? 'vs' : '@'} {opponent}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{teamScore.toFixed(1)} - {opponentScore.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">{matchup.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No schedule data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Matchup Details Modal */}
        <MatchupDetailsModal
          isOpen={isMatchupModalOpen}
          onClose={() => setIsMatchupModalOpen(false)}
          matchupDetails={matchupDetails}
          loading={matchupDetailsLoading}
          error={matchupDetailsError}
        />
      </div>
    </div>
  );
}
