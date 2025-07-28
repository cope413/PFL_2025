"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api';
import { Team } from '@/lib/types';

export function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    owner: '',
    leagueId: 'l1'
  });

  // Load teams
  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getTeams() as Team[];
      setTeams(data);
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // Create team
  const createTeam = async () => {
    if (!newTeam.name || !newTeam.owner) {
      setError('Name and owner are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const createdTeam = await apiService.createTeam(newTeam) as Team;
      setTeams(prev => [...prev, createdTeam]);
      setNewTeam({ name: '', owner: '', leagueId: 'l1' });
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // Update team
  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTeam = await apiService.updateTeam(teamId, updates) as Team;
      setTeams(prev => prev.map(team => team.id === teamId ? updatedTeam : team));
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  // Delete team
  const deleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    setLoading(true);
    setError(null);
    try {
      await apiService.deleteTeam(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
    } catch (err) {
      setError(apiService.handleError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Load Teams Button */}
          <Button onClick={loadTeams} disabled={loading}>
            {loading ? 'Loading...' : 'Load Teams'}
          </Button>

          {/* Create New Team Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={newTeam.name}
                onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={newTeam.owner}
                onChange={(e) => setNewTeam(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Enter owner name"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={createTeam} disabled={loading || !newTeam.name || !newTeam.owner}>
                Create Team
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {/* Teams List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Teams ({teams.length})</h3>
            {teams.map(team => (
              <div key={team.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">Owner: {team.owner}</p>
                    <p className="text-sm text-muted-foreground">
                      Record: {team.record.wins}-{team.record.losses}-{team.record.ties}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Points: {team.pointsFor} PF, {team.pointsAgainst} PA
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTeam(team.id, { 
                        pointsFor: team.pointsFor + 10 
                      })}
                      disabled={loading}
                    >
                      Add 10 Points
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTeam(team.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 