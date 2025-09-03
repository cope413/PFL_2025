"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ClubIcon as Football,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Save,
  Zap,
  Clock,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Target,
  Award,
  LogOut,
  Menu,
  X,
  Plus,
  Filter,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import DraftRoom from "@/components/DraftRoom"

export default function DraftPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDraftRoomOpen, setIsDraftRoomOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if no user is authenticated
      router.push('/auth')
      return
    }
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>
          
          {/* Desktop Navigation */}
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
            <Link href="/scoreboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scoreboard
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
            <Link href="/draft" className="text-sm font-medium transition-colors hover:text-primary">
              Draft
            </Link>
            {user?.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
                href="/scoreboard"
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scoreboard
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
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Draft
              </Link>
              {user?.is_admin && (
                <Link
                  href="/admin"
                  className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
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
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Draft Central</h1>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Drafts</CardTitle>
                <CardDescription>Your scheduled live drafts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-bold">PFL</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>August 31, 2025 • 8:00 AM PST</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4" />
                          <span>16 Teams • Snake Draft</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setIsDraftRoomOpen(true)}>Enter Draft Room</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Draft Tools</CardTitle>
                <CardDescription>Resources to help you prepare for your draft</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rankings">
                  <TabsList className="mb-4">
                    <TabsTrigger value="rankings">Rankings</TabsTrigger>
  
                    <TabsTrigger value="sleepers">Sleepers</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rankings">image.png
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Draft Rankings</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                          </Button>
                          <Button size="sm">Customize Rankings</Button>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Pos</TableHead>
                            <TableHead className="text-right">Bye</TableHead>
                            <TableHead className="text-right">Proj Pts</TableHead>
    
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{`P${i + 1}`}</AvatarFallback>
                                  </Avatar>
                                  <div>Player {i + 1}</div>
                                </div>
                              </TableCell>
                              <TableCell>Team</TableCell>
                              <TableCell>Pos</TableCell>
                              <TableCell className="text-right">{7 + i}</TableCell>
                              <TableCell className="text-right">{350 - i * 15}</TableCell>
                              
                              <TableCell className="text-right">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">+{5 - i}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex items-center justify-center mt-4">
                        <Button variant="outline" className="mx-2 bg-transparent">
                          Previous
                        </Button>
                        <Button variant="outline" className="mx-2 bg-transparent">
                          Next
                        </Button>
                      </div>
                    </div>
                  </TabsContent>


                  <TabsContent value="sleepers">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Sleeper Picks</h3>
                      <p className="text-sm text-muted-foreground">
                        Sleepers are players who are undervalued in drafts and have the potential to outperform their
                        draft position. Here are our top sleeper picks for the 2025 season.
                      </p>

                      <div className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Card key={i}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium">Sleeper Player {i + 1}</CardTitle>

                              </div>
                              <CardDescription>Team • Position</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                This player has tremendous upside due to a new offensive system and increased
                                opportunity. Could easily outperform their current draft position.
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="strategy">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Draft Strategy</h3>
                      <p className="text-sm text-muted-foreground">
                        Prepare for your draft with these expert strategies and tips.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Position Scarcity</CardTitle>
                            <CardDescription>Understanding when to draft each position</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Position scarcity refers to the limited number of elite players at certain positions.
                              Understanding this concept can help you prioritize which positions to draft early.
                            </p>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">RB</span>
                                <div className="h-2 w-[200px] rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-red-500" style={{ width: "30%" }}></div>
                                </div>
                                <span className="text-sm">High Scarcity</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">WR</span>
                                <div className="h-2 w-[200px] rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: "60%" }}></div>
                                </div>
                                <span className="text-sm">Medium Scarcity</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">QB</span>
                                <div className="h-2 w-[200px] rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-green-500" style={{ width: "80%" }}></div>
                                </div>
                                <span className="text-sm">Low Scarcity</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Value-Based Drafting</CardTitle>
                            <CardDescription>Maximizing player value at each pick</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Value-Based Drafting (VBD) is a strategy that compares a player&apos;s projected points to a
                              baseline at their position. This helps you identify which players offer the most value
                              relative to their draft position.
                            </p>
                            <div className="mt-4">
                              <Button variant="outline" className="w-full bg-transparent">
                                Download VBD Cheat Sheet
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Draft Day Checklist</CardTitle>
                            <CardDescription>Essential preparations for draft day</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded border flex items-center justify-center">
                                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                                </div>
                                <span className="text-sm">Prepare custom rankings</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded border flex items-center justify-center">
                                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                                </div>
                                <span className="text-sm">Research injury updates</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded border flex items-center justify-center">
                                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                                </div>
                                <span className="text-sm">Create position tiers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded border flex items-center justify-center">
                                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                                </div>
                                <span className="text-sm">Identify sleepers and potential busts</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded border flex items-center justify-center">
                                  <div className="h-3 w-3 rounded-sm bg-primary"></div>
                                </div>
                                <span className="text-sm">Test your internet connection</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Draft Room Modal */}
      {isDraftRoomOpen && (
        <DraftRoom onClose={() => setIsDraftRoomOpen(false)} />
      )}
    </div>
  )
}
