// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DEFAULT_SCORING_RULES, getFieldGoalPoints, getYardsAllowedPoints, getPassYardPoints, getRushingYardPoints, getReceivingYardPoints, getReceptionPoints, getCarryPoints, getTouchdownPoints, getBonusPoints, calculateDstPoints, getPointsAllowedPoints, ScoringRules } from '@/lib/scoring-rules';

interface ScoringEventComment {
  id: number;
  week?: number;
  quarter?: string | null;
  minute?: string | null;
  team_name?: string | null;
  comment: string;
}

interface PlayerStats {
  player_id: number;
  player_name: string;
  team_id: number;
  season_id?: number;
  game_id: number;
  week: number;
  position?: string;
  // Offensive stats
  pass_yards?: number;
  pass_touchdowns?: number;
  pass_two_pt?: number;
  total_rushes?: number;
  rush_yards?: number;
  rush_touchdowns?: number;
  rush_two_pt?: number;
  receptions?: number;
  receiving_yards?: number;
  rec_touchdowns?: number;
  rec_two_pt?: number;
  extra_point?: number;
  two_point_conversions?: number;
  pass_td_distances?: string;
  rush_td_distances?: string;
  rec_td_distances?: string;
  FG_length?: string;
  // D/ST stats
  sacks?: number;
  turnovers?: number;
  safeties?: number;
  two_point_returns?: number;
  yards_allowed?: number;
  defensive_tds?: number;
  defensive_td_distances?: string;
  points_allowed?: number;
  qtr1_points?: number;
  qtr2_points?: number;
  qtr3_points?: number;
  qtr4_points?: number;
  overtime_points?: number;
  comments?: ScoringEventComment[];
}

interface PlayerBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  position: string;
  week: number;
}

// Use the centralized scoring rules
const SCORING_RULES = DEFAULT_SCORING_RULES;

export function PlayerBreakdownModal({ 
  isOpen, 
  onClose, 
  playerId, 
  playerName, 
  position, 
  week 
}: PlayerBreakdownModalProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && playerId && week) {
      fetchPlayerStats();
    }
  }, [isOpen, playerId, week]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/player-stats?playerId=${playerId}&week=${week}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        setPlayerStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch player stats');
      }
    } catch (err) {
      setError('Failed to fetch player stats');
      console.error('Error fetching player stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate touchdown points from distance array
  const calculateTouchdownPointsFromDistances = (distances: string | null, label: string) => {
    if (!distances || distances === '[]' || distances === 'null') return null;
    try {
      const tdLengths = JSON.parse(distances);
      if (Array.isArray(tdLengths) && tdLengths.length > 0) {
        let totalPoints = 0;
        tdLengths.forEach((distance: number) => {
          totalPoints += getTouchdownPoints(distance);
        });
        return {
          label,
          value: `${tdLengths.length} (${tdLengths.join(', ')} yds)` as any,
          points: totalPoints
        };
      }
    } catch (e) {
      console.error(`Error parsing TD distances for ${label}:`, e);
    }
    return null;
  };

  // Helper function to calculate field goal points from distance array
  const calculateFieldGoalPointsFromDistances = (distances: string | null, label: string) => {
    if (!distances || distances === '[]' || distances === 'null') return null;
    try {
      const fgLengths = JSON.parse(distances);
      if (Array.isArray(fgLengths) && fgLengths.length > 0) {
        let totalPoints = 0;
        fgLengths.forEach((distance: number) => {
          totalPoints += getFieldGoalPoints(distance);
        });
        return {
          label,
          value: `${fgLengths.length} (${fgLengths.join(', ')} yds)` as any,
          points: totalPoints
        };
      }
    } catch (e) {
      console.error(`Error parsing FG distances for ${label}:`, e);
    }
    return null;
  };

  const calculatePoints = (stats: PlayerStats, pos: string) => {
    const rules = SCORING_RULES[pos as keyof typeof SCORING_RULES];
    if (!rules || !stats) return [];

    const breakdown: Array<{ label: string; value: number | string; points: number; isPrimary?: boolean }> = [];

    switch (pos) {
      case 'QB':
        const qbPassYardPoints = getPassYardPoints(stats.pass_yards);
        const qbRushYardPoints = getRushingYardPoints(stats.rush_yards);
        const qbTwoPtPoints = (stats.pass_two_pt + stats.rush_two_pt) * rules.twoPointConversion;

        if (stats.pass_yards > 0) breakdown.push({ label: 'Pass Yards', value: stats.pass_yards, points: qbPassYardPoints });
        if (stats.rush_yards > 0) breakdown.push({ label: 'Rush Yards', value: stats.rush_yards, points: qbRushYardPoints });
        if ((stats.pass_two_pt + stats.rush_two_pt) > 0) breakdown.push({ label: '2-Point Conversions', value: stats.pass_two_pt + stats.rush_two_pt, points: qbTwoPtPoints });

        // Handle touchdown distances
        const qbPassTdBreakdown = calculateTouchdownPointsFromDistances(stats.pass_td_distances, 'Pass TDs');
        if (qbPassTdBreakdown) {
          breakdown.push(qbPassTdBreakdown);
        } else if (stats.pass_touchdowns > 0) {
          const fallbackPoints = stats.pass_touchdowns * rules.passTdPoints;
          breakdown.push({ label: 'Pass TDs', value: stats.pass_touchdowns, points: fallbackPoints });
        }

        const qbRushTdBreakdown = calculateTouchdownPointsFromDistances(stats.rush_td_distances, 'Rush TDs');
        if (qbRushTdBreakdown) {
          breakdown.push(qbRushTdBreakdown);
        } else if (stats.rush_touchdowns > 0) {
          const fallbackPoints = stats.rush_touchdowns * rules.rushTdPoints;
          breakdown.push({ label: 'Rush TDs', value: stats.rush_touchdowns, points: fallbackPoints });
        }

        // Calculate bonus points (QB can have passing + rushing, or passing + receiving if they somehow catch a pass)
        const qbBonusPoints = getBonusPoints(stats.pass_yards, stats.rush_yards, stats.receiving_yards);
        if (qbBonusPoints > 0) {
          breakdown.push({ label: 'Bonus Points', value: 'Yardage Bonus', points: qbBonusPoints });
        }
        break;

      case 'RB':
      case 'WR':
      case 'TE':
        // Calculate rushing points
        const skillRushYardPoints = getRushingYardPoints(stats.rush_yards);
        const skillRushPoints = getCarryPoints(stats.total_rushes);
        const skillRushMax = Math.max(skillRushYardPoints, skillRushPoints);

        // Calculate receiving points
        const skillRecYardPoints = getReceivingYardPoints(stats.receiving_yards);
        const skillRecPoints = getReceptionPoints(stats.receptions);
        const skillRecMax = Math.max(skillRecYardPoints, skillRecPoints);

        const skillRecTdPoints = stats.rec_touchdowns * rules.recTdPoints;
        const skillRushTdPoints = stats.rush_touchdowns * rules.rushTdPoints;
        const skillTwoPtPoints = (stats.rec_two_pt + stats.rush_two_pt) * rules.twoPointConversion;

        // Show rushing breakdown - calculate which gives more points
        if (stats.rush_yards > 0 || stats.total_rushes > 0) {
          if (skillRushYardPoints >= skillRushPoints) {
            // Yards are greater or equal
            if (stats.rush_yards > 0) breakdown.push({ label: 'Rush Yards', value: stats.rush_yards, points: skillRushYardPoints, isPrimary: true });
            if (stats.total_rushes > 0) breakdown.push({ label: 'Rushes', value: stats.total_rushes, points: skillRushPoints, isPrimary: false });
          } else {
            // Carries are greater
            if (stats.total_rushes > 0) breakdown.push({ label: 'Rushes', value: stats.total_rushes, points: skillRushPoints, isPrimary: true });
            if (stats.rush_yards > 0) breakdown.push({ label: 'Rush Yards', value: stats.rush_yards, points: skillRushYardPoints, isPrimary: false });
          }
        }

        // Show receiving breakdown - calculate which gives more points
        if (stats.receiving_yards > 0 || stats.receptions > 0) {
          if (skillRecYardPoints >= skillRecPoints) {
            // Yards are greater or equal
            if (stats.receiving_yards > 0) breakdown.push({ label: 'Rec. Yards', value: stats.receiving_yards, points: skillRecYardPoints, isPrimary: true });
            if (stats.receptions > 0) breakdown.push({ label: 'Receptions', value: stats.receptions, points: skillRecPoints, isPrimary: false });
          } else {
            // Receptions are greater
            if (stats.receptions > 0) breakdown.push({ label: 'Receptions', value: stats.receptions, points: skillRecPoints, isPrimary: true });
            if (stats.receiving_yards > 0) breakdown.push({ label: 'Rec. Yards', value: stats.receiving_yards, points: skillRecYardPoints, isPrimary: false });
          }
        }

        if ((stats.rec_two_pt + stats.rush_two_pt) > 0) breakdown.push({ label: '2-Point Conversions', value: stats.rec_two_pt + stats.rush_two_pt, points: skillTwoPtPoints });

        // Handle touchdown distances
        const skillRecTdBreakdown = calculateTouchdownPointsFromDistances(stats.rec_td_distances, 'Rec. TDs');
        if (skillRecTdBreakdown) {
          breakdown.push(skillRecTdBreakdown);
        } else if (stats.rec_touchdowns > 0) {
          breakdown.push({ label: 'Rec. TDs', value: stats.rec_touchdowns, points: skillRecTdPoints });
        }

        const skillRushTdBreakdown = calculateTouchdownPointsFromDistances(stats.rush_td_distances, 'Rush TDs');
        if (skillRushTdBreakdown) {
          breakdown.push(skillRushTdBreakdown);
        } else if (stats.rush_touchdowns > 0) {
          breakdown.push({ label: 'Rush TDs', value: stats.rush_touchdowns, points: skillRushTdPoints });
        }

        // Calculate bonus points (RB/WR/TE can have rushing + receiving, or passing + rushing/receiving)
        const skillBonusPoints = getBonusPoints(stats.pass_yards, stats.rush_yards, stats.receiving_yards);
        if (skillBonusPoints > 0) {
          breakdown.push({ label: 'Bonus Points', value: 'Yardage Bonus', points: skillBonusPoints });
        }
        break;

      case 'PK':
        const extraPointPoints = stats.extra_point * rules.extraPoint;
        if (stats.extra_point > 0) breakdown.push({ label: 'Extra Points', value: stats.extra_point, points: extraPointPoints });
        
        // Handle field goal distances
        const fgBreakdown = calculateFieldGoalPointsFromDistances(stats.FG_length, 'Field Goals');
        if (fgBreakdown) {
          breakdown.push(fgBreakdown);
        }
        break;

      case 'D/ST':
        const dstRules = rules as ScoringRules['D/ST'];
        
        // Sacks
        if (stats.sacks && stats.sacks > 0) {
          const sackPoints = stats.sacks * dstRules.sackPoints;
          breakdown.push({ label: 'Sacks', value: stats.sacks, points: sackPoints });
        }
        
        // Turnovers
        if (stats.turnovers && stats.turnovers > 0) {
          const turnoverPoints = stats.turnovers * dstRules.turnoverPoints;
          breakdown.push({ label: 'Turnovers', value: stats.turnovers, points: turnoverPoints });
        }
        
        // Safeties
        if (stats.safeties && stats.safeties > 0) {
          const safetyPoints = stats.safeties * dstRules.safetyPoints;
          breakdown.push({ label: 'Safeties', value: stats.safeties, points: safetyPoints });
        }
        
        // 2-Point Returns
        if (stats.two_point_returns && stats.two_point_returns > 0) {
          const twoPtReturnPoints = stats.two_point_returns * dstRules.twoPointReturnPoints;
          breakdown.push({ label: '2-Point Returns', value: stats.two_point_returns, points: twoPtReturnPoints });
        }
        
        // Yards Allowed
        if (stats.yards_allowed !== undefined && stats.yards_allowed !== null) {
          const yardsAllowedPoints = getYardsAllowedPoints(stats.yards_allowed, dstRules);
          breakdown.push({ label: 'Yards Allowed', value: stats.yards_allowed, points: yardsAllowedPoints });
        }
        
        // Defensive TDs (using distance-based scoring like other TDs)
        const defensiveTdBreakdown = calculateTouchdownPointsFromDistances(stats.defensive_td_distances, 'D/ST Touchdowns');
        if (defensiveTdBreakdown) {
          breakdown.push(defensiveTdBreakdown);
        } else if (stats.defensive_tds && stats.defensive_tds > 0) {
          // Fallback if distances not available, use simple count * 6
          const defensiveTdPoints = stats.defensive_tds * dstRules.defensiveTdPoints;
          breakdown.push({ label: 'D/ST Touchdowns', value: stats.defensive_tds, points: defensiveTdPoints });
        }
        
        // Points Allowed
        if (stats.qtr1_points !== undefined && stats.qtr2_points !== undefined && 
            stats.qtr3_points !== undefined && stats.qtr4_points !== undefined) {
          const quarterPoints = [
            stats.qtr1_points || 0,
            stats.qtr2_points || 0,
            stats.qtr3_points || 0,
            stats.qtr4_points || 0
          ];
          const overtimePoints = stats.overtime_points || 0;
          const pointsAllowedResult = getPointsAllowedPoints(quarterPoints, overtimePoints, dstRules);
          
          // Add breakdown for each quarter or shutout
          if (pointsAllowedResult.breakdown.length > 0) {
            pointsAllowedResult.breakdown.forEach(item => {
              breakdown.push({ 
                label: `Points Allowed (${item.quarter})`, 
                value: item.description, 
                points: item.points 
              });
            });
          }
          
          // Also show total points allowed for reference
          if (stats.points_allowed !== undefined && stats.points_allowed !== null) {
            // Don't add as a breakdown item if we already have quarter breakdowns
            // This is just for display context
          }
        }
        break;
    }

    return breakdown;
  };

  const formatEventMeta = (event: ScoringEventComment) => {
    const parts: string[] = [];

    if (event.quarter) {
      const quarter = event.quarter.toString().toUpperCase().startsWith('Q')
        ? event.quarter.toString().toUpperCase()
        : `Q${event.quarter}`;
      parts.push(quarter);
    }

    if (event.minute) {
      parts.push(event.minute.toString());
    }

    if (event.team_name) {
      parts.push(event.team_name);
    }

    return parts.join(' • ');
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-blue-100 text-blue-800';
      case 'RB': return 'bg-green-100 text-green-800';
      case 'WR': return 'bg-purple-100 text-purple-800';
      case 'TE': return 'bg-orange-100 text-orange-800';
      case 'PK': return 'bg-yellow-100 text-yellow-800';
      case 'D/ST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Player Breakdown</DialogTitle>
            <DialogDescription>Loading player statistics...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading player stats...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Player Breakdown</DialogTitle>
            <DialogDescription>An error occurred while loading player statistics.</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!playerStats) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Player Breakdown</DialogTitle>
            <DialogDescription>No statistics available for this player.</DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">No stats available for this player.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const breakdown = calculatePoints(playerStats, position);
  
  // Only count primary stats in the total (for RB/WR/TE, only the greater of yards or carries/receptions)
  const totalPoints = breakdown.reduce((sum, item) => {
    // For RB/WR/TE stats where we show both, only count if it's the primary
    if (item.isPrimary !== undefined) {
      return sum + (item.isPrimary ? item.points : 0);
    }
    // For other stats (like TDs, 2-point conversions, etc.), always count them
    return sum + item.points;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {playerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{playerName}</div>
              <div className="text-sm text-muted-foreground">Week {week}</div>
            </div>
          </DialogTitle>
          <DialogDescription>Detailed point breakdown for Week {week}</DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Point Breakdown</CardTitle>
              <Badge className={`text-xs ${getPositionColor(position)}`}>
                {position}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.length > 0 ? (
                <>
                  {breakdown.map((item, index) => (
                    <div key={index} className={`flex items-center justify-between py-2 border-b last:border-b-0 ${item.isPrimary ? 'bg-green-50 rounded px-2' : ''}`}>
                      <span className={`text-sm ${item.isPrimary ? 'font-bold' : 'font-medium'}`}>{item.label}:</span>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{item.value}</span>
                        <span className={`ml-2 font-medium ${item.isPrimary ? 'text-green-700 font-bold' : 'text-green-600'}`}>
                          = {item.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{totalPoints} pts</span>
                  </div>
                  {playerStats?.comments && playerStats.comments.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Scoring Notes
                      </h4>
                      <ul className="space-y-2">
                        {playerStats.comments.map((event) => {
                          const meta = formatEventMeta(event);
                          return (
                            <li key={event.id} className="rounded-md bg-muted/40 p-2 text-sm">
                              {meta && (
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  {meta}
                                </div>
                              )}
                              <div className="text-foreground">{event.comment}</div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stats recorded for this week
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
