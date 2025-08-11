'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Database,
  Activity,
  Edit,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email?: string;
  team: string;
  team_name?: string;
  owner_name?: string;
  is_admin: boolean;
}

interface SystemStats {
  userCount: number;
  playerCount: number;
  lineupCount: number;
  adminCount: number;
}

interface Player {
  player_ID: string;
  name: string;
  position: string;
  team: string;
  nfl_team: string;
  owner_ID: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  week6: number;
  week7: number;
  week8: number;
  week9: number;
  week10: number;
  week11: number;
  week12: number;
  week13: number;
  week14: number;
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    team: '',
    email: '',
    owner_name: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerEditForm, setPlayerEditForm] = useState({
    name: '',
    position: '',
    team: '',
    nflTeam: '',
    ownerId: '',
    week1: 0,
    week2: 0,
    week3: 0,
    week4: 0,
    week5: 0,
    week6: 0,
    week7: 0,
    week8: 0,
    week9: 0,
    week10: 0,
    week11: 0,
    week12: 0,
    week13: 0,
    week14: 0
  });
  const [isPlayerEditDialogOpen, setIsPlayerEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (!loading && user && !user.is_admin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to access this page.",
        variant: "destructive",
      });
      router.push('/dashboard');
      return;
    }

    if (user?.is_admin) {
      fetchUsers();
      fetchStats();
      fetchPlayers();
    }
  }, [user, loading, router, toast]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system statistics",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const updateUserAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId, isAdmin })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `User admin status updated successfully`,
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user admin status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `User "${username}" deleted successfully`,
        });
        fetchUsers(); // Refresh the list
        fetchStats(); // Refresh stats
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      team: user.team,
      email: user.email || '',
      owner_name: user.owner_name || ''
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEditForm({
      username: '',
      team: '',
      email: '',
      owner_name: ''
    });
    setIsEditDialogOpen(false);
  };

  const updateUserInfo = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userId: editingUser.id,
          username: editForm.username,
          team: editForm.team,
          email: editForm.email,
          owner_name: editForm.owner_name
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User information updated successfully",
        });
        closeEditDialog();
        fetchUsers(); // Refresh the list
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive",
      });
    }
  };

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const response = await fetch('/api/admin/players', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.data);
      } else {
        throw new Error('Failed to fetch players');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive",
      });
    } finally {
      setLoadingPlayers(false);
    }
  };

  const openPlayerEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setPlayerEditForm({
      name: player.name,
      position: player.position,
      team: player.team,
      nflTeam: player.nfl_team,
      ownerId: player.owner_ID,
      week1: player.week1,
      week2: player.week2,
      week3: player.week3,
      week4: player.week4,
      week5: player.week5,
      week6: player.week6,
      week7: player.week7,
      week8: player.week8,
      week9: player.week9,
      week10: player.week10,
      week11: player.week11,
      week12: player.week12,
      week13: player.week13,
      week14: player.week14
    });
    setIsPlayerEditDialogOpen(true);
  };

  const closePlayerEditDialog = () => {
    setEditingPlayer(null);
    setPlayerEditForm({
      name: '',
      position: '',
      team: '',
      nflTeam: '',
      ownerId: '',
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      week5: 0,
      week6: 0,
      week7: 0,
      week8: 0,
      week9: 0,
      week10: 0,
      week11: 0,
      week12: 0,
      week13: 0,
      week14: 0
    });
    setIsPlayerEditDialogOpen(false);
  };

  const updatePlayerInfo = async () => {
    if (!editingPlayer) return;

    try {
      const response = await fetch('/api/admin/players', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          playerId: editingPlayer.player_ID,
          name: playerEditForm.name,
          position: playerEditForm.position,
          team: playerEditForm.nflTeam, // Use nflTeam as the team parameter
          nflTeam: playerEditForm.nflTeam,
          ownerId: playerEditForm.ownerId,
          weeklyStats: {
            week1: playerEditForm.week1,
            week2: playerEditForm.week2,
            week3: playerEditForm.week3,
            week4: playerEditForm.week4,
            week5: playerEditForm.week5,
            week6: playerEditForm.week6,
            week7: playerEditForm.week7,
            week8: playerEditForm.week8,
            week9: playerEditForm.week9,
            week10: playerEditForm.week10,
            week11: playerEditForm.week11,
            week12: playerEditForm.week12,
            week13: playerEditForm.week13,
            week14: playerEditForm.week14
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: result.message || "Player information updated successfully",
        });
        closePlayerEditDialog();
        fetchPlayers(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Player update error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Player update failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update player information",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">PFL</span>
          </div>
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
            <Link
              href="/players"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
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
            {user?.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
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
                href="/players"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
              {user?.is_admin && (
                <Link
                  href="/admin"
                  className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user && (
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
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, view system statistics, and configure application settings.
            </p>
          </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="players">Player Management</TabsTrigger>
          <TabsTrigger value="stats">System Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.adminCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Users with admin privileges
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.playerCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Players in database
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Lineups</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.lineupCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Lineups saved by users
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and access levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading users...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{user.team}</span>
                            {user.team_name && (
                              <Badge variant="secondary">{user.team_name}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.is_admin}
                              onCheckedChange={(checked) => 
                                updateUserAdminStatus(user.id, checked)
                              }
                            />
                            {user.is_admin ? (
                              <Badge variant="default">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <UserX className="h-3 w-3 mr-1" />
                                User
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUser(user.id, user.username)}
                              disabled={user.id === '9'} // Prevent deleting self
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>
                Detailed system metrics and database information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading statistics...</div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Database Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-medium">{stats?.userCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin Users:</span>
                        <span className="font-medium">{stats?.adminCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular Users:</span>
                        <span className="font-medium">{(stats?.userCount || 0) - (stats?.adminCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Application Data</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Players:</span>
                        <span className="font-medium">{stats?.playerCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saved Lineups:</span>
                        <span className="font-medium">{stats?.lineupCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Player Management</CardTitle>
              <CardDescription>
                Manage player information, team assignments, and weekly statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlayers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading players...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>NFL Team</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Week 1</TableHead>
                          <TableHead>Week 2</TableHead>
                          <TableHead>Week 3</TableHead>
                          <TableHead>Week 4</TableHead>
                          <TableHead>Week 5</TableHead>
                          <TableHead>Week 6</TableHead>
                          <TableHead>Week 7</TableHead>
                          <TableHead>Week 8</TableHead>
                          <TableHead>Week 9</TableHead>
                          <TableHead>Week 10</TableHead>
                          <TableHead>Week 11</TableHead>
                          <TableHead>Week 12</TableHead>
                          <TableHead>Week 13</TableHead>
                          <TableHead>Week 14</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player) => (
                          <TableRow key={player.player_ID}>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>{player.position}</TableCell>
                            <TableCell>{player.team}</TableCell>
                            <TableCell>{player.nfl_team}</TableCell>
                            <TableCell>{player.owner_ID}</TableCell>
                            <TableCell>{player.week1}</TableCell>
                            <TableCell>{player.week2}</TableCell>
                            <TableCell>{player.week3}</TableCell>
                            <TableCell>{player.week4}</TableCell>
                            <TableCell>{player.week5}</TableCell>
                            <TableCell>{player.week6}</TableCell>
                            <TableCell>{player.week7}</TableCell>
                            <TableCell>{player.week8}</TableCell>
                            <TableCell>{player.week9}</TableCell>
                            <TableCell>{player.week10}</TableCell>
                            <TableCell>{player.week11}</TableCell>
                            <TableCell>{player.week12}</TableCell>
                            <TableCell>{player.week13}</TableCell>
                            <TableCell>{player.week14}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPlayerEditDialog(player)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right">
                Team
              </Label>
              <Input
                id="team"
                value={editForm.team}
                onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner_name" className="text-right">
                Owner Name
              </Label>
              <Input
                id="owner_name"
                value={editForm.owner_name}
                onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={updateUserInfo}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={isPlayerEditDialogOpen} onOpenChange={setIsPlayerEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Update player information and weekly statistics. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="player-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="player-name"
                  value={playerEditForm.name}
                  onChange={(e) => setPlayerEditForm({ ...playerEditForm, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="player-position" className="text-right">
                  Position
                </Label>
                <Input
                  id="player-position"
                  value={playerEditForm.position}
                  onChange={(e) => setPlayerEditForm({ ...playerEditForm, position: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="player-team" className="text-right">
                  PFL Team
                </Label>
                <Input
                  id="player-team"
                  value={playerEditForm.team}
                  onChange={(e) => setPlayerEditForm({ ...playerEditForm, team: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., A1, B2, C3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="player-nfl-team" className="text-right">
                  NFL Team
                </Label>
                <Input
                  id="player-nfl-team"
                  value={playerEditForm.nflTeam}
                  onChange={(e) => setPlayerEditForm({ ...playerEditForm, nflTeam: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Raiders, Patriots"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="player-owner" className="text-right">
                  Owner ID
                </Label>
                <Input
                  id="player-owner"
                  value={playerEditForm.ownerId}
                  onChange={(e) => setPlayerEditForm({ ...playerEditForm, ownerId: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., A1, B2, C3"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Weekly Statistics</h3>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((week) => (
                  <div key={week} className="space-y-2">
                    <Label htmlFor={`week${week}`} className="text-sm">Week {week}</Label>
                    <Input
                      id={`week${week}`}
                      type="number"
                      step="0.1"
                      value={playerEditForm[`week${week}` as keyof typeof playerEditForm] as number}
                      onChange={(e) => setPlayerEditForm({ 
                        ...playerEditForm, 
                        [`week${week}`]: parseFloat(e.target.value) || 0 
                      })}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mt-4">
                {[8, 9, 10, 11, 12, 13, 14].map((week) => (
                  <div key={week} className="space-y-2">
                    <Label htmlFor={`week${week}`} className="text-sm">Week {week}</Label>
                    <Input
                      id={`week${week}`}
                      type="number"
                      step="0.1"
                      value={playerEditForm[`week${week}` as keyof typeof playerEditForm] as number}
                      onChange={(e) => setPlayerEditForm({ 
                        ...playerEditForm, 
                        [`week${week}`]: parseFloat(e.target.value) || 0 
                      })}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePlayerEditDialog}>
              Cancel
            </Button>
            <Button onClick={updatePlayerInfo}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
}
