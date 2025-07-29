"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, ClubIcon as Football, Plus, Loader2, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function TeamsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to auth page if not logged in
  if (!authLoading && !user) {
    router.push('/auth');
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <Football className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/teams" className="text-sm font-medium transition-colors hover:text-primary">
              My Teams
            </Link>
            <Link
              href="/players"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Players
            </Link>
            <Link
              href="/leagues"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Leagues
            </Link>
            <Link
              href="/draft"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Draft
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Avatar>
              <AvatarImage src="" alt={user?.username || "User"} />
              <AvatarFallback>{user?.team || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
              <p className="text-muted-foreground">Manage your fantasy football teams across all leagues.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>The Touchdown Titans</CardTitle>
                    <CardDescription>Friends & Family League • 12 Teams • Standard</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">2-0-0</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="roster">
                  <TabsList className="mb-4">
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="matchups">Matchups</TabsTrigger>
                  </TabsList>
                  <TabsContent value="roster">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-sm font-medium">
                        <div className="col-span-4">Player</div>
                        <div className="col-span-2">Position</div>
                        <div className="col-span-2">Team</div>
                        <div className="col-span-2 text-center">Proj</div>
                        <div className="col-span-2 text-center">Status</div>
                      </div>
                      <div className="grid grid-cols-12 border-b p-3 text-sm">
                        <div className="col-span-4 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>JA</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Josh Allen</div>
                            <div className="text-xs text-muted-foreground">QB</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">QB</div>
                        <div className="col-span-2 flex items-center">BUF</div>
                        <div className="col-span-2 flex items-center justify-center">24.2</div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 border-b p-3 text-sm">
                        <div className="col-span-4 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>CM</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Christian McCaffrey</div>
                            <div className="text-xs text-muted-foreground">RB</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">RB</div>
                        <div className="col-span-2 flex items-center">SF</div>
                        <div className="col-span-2 flex items-center justify-center">26.8</div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 border-b p-3 text-sm">
                        <div className="col-span-4 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>JJ</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Justin Jefferson</div>
                            <div className="text-xs text-muted-foreground">WR</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">WR</div>
                        <div className="col-span-2 flex items-center">MIN</div>
                        <div className="col-span-2 flex items-center justify-center">22.4</div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="stats">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Total Points</div>
                          <div className="text-2xl font-bold">248.6</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Points Per Game</div>
                          <div className="text-2xl font-bold">124.3</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">League Rank</div>
                          <div className="text-2xl font-bold">3rd</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Record</div>
                          <div className="text-2xl font-bold">2-0-0</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="matchups">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Week 1</div>
                          <div className="text-sm text-muted-foreground">Win</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">124.2 pts</div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="text-2xl font-bold">98.7 pts</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">vs Team 4</div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Week 2</div>
                          <div className="text-sm text-muted-foreground">Win</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">124.4 pts</div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="text-2xl font-bold">112.3 pts</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">vs Team 7</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
