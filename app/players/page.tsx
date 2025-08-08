"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClubIcon as Football,
  Settings,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  StarHalf,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

export default function PlayersPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Remove authentication requirement for public access
  
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
            <Link href="/players" className="text-sm font-medium transition-colors hover:text-primary">
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
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
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
                <LogOut className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
            
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
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
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
              <h1 className="text-3xl font-bold tracking-tight">Players</h1>
              <p className="text-muted-foreground">Browse, search, and analyze player stats and projections.</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Search</CardTitle>
                <CardDescription>Find players by name, team, position, or status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search players..." className="pl-8" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <SelectItem value="qb">QB</SelectItem>
                        <SelectItem value="rb">RB</SelectItem>
                        <SelectItem value="wr">WR</SelectItem>
                        <SelectItem value="te">TE</SelectItem>
                        <SelectItem value="k">K</SelectItem>
                        <SelectItem value="def">DEF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        <SelectItem value="ari">ARI</SelectItem>
                        <SelectItem value="atl">ATL</SelectItem>
                        <SelectItem value="bal">BAL</SelectItem>
                        <SelectItem value="buf">BUF</SelectItem>
                        <SelectItem value="car">CAR</SelectItem>
                        <SelectItem value="chi">CHI</SelectItem>
                        <SelectItem value="cin">CIN</SelectItem>
                        <SelectItem value="cle">CLE</SelectItem>
                        <SelectItem value="dal">DAL</SelectItem>
                        <SelectItem value="den">DEN</SelectItem>
                        <SelectItem value="det">DET</SelectItem>
                        <SelectItem value="gb">GB</SelectItem>
                        <SelectItem value="hou">HOU</SelectItem>
                        <SelectItem value="ind">IND</SelectItem>
                        <SelectItem value="jax">JAX</SelectItem>
                        <SelectItem value="kc">KC</SelectItem>
                        <SelectItem value="lv">LV</SelectItem>
                        <SelectItem value="lac">LAC</SelectItem>
                        <SelectItem value="lar">LAR</SelectItem>
                        <SelectItem value="mia">MIA</SelectItem>
                        <SelectItem value="min">MIN</SelectItem>
                        <SelectItem value="ne">NE</SelectItem>
                        <SelectItem value="no">NO</SelectItem>
                        <SelectItem value="nyg">NYG</SelectItem>
                        <SelectItem value="nyj">NYJ</SelectItem>
                        <SelectItem value="phi">PHI</SelectItem>
                        <SelectItem value="pit">PIT</SelectItem>
                        <SelectItem value="sf">SF</SelectItem>
                        <SelectItem value="sea">SEA</SelectItem>
                        <SelectItem value="tb">TB</SelectItem>
                        <SelectItem value="ten">TEN</SelectItem>
                        <SelectItem value="was">WAS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Players</CardTitle>
                <CardDescription>Highest scoring players this week</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Proj</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>PM</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Patrick Mahomes</div>
                            <div className="text-sm text-muted-foreground">QB</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>QB</TableCell>
                      <TableCell>KC</TableCell>
                      <TableCell className="text-right font-medium">28.5</TableCell>
                      <TableCell className="text-right text-muted-foreground">24.2</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>CM</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Christian McCaffrey</div>
                            <div className="text-sm text-muted-foreground">RB</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>RB</TableCell>
                      <TableCell>SF</TableCell>
                      <TableCell className="text-right font-medium">32.1</TableCell>
                      <TableCell className="text-right text-muted-foreground">26.8</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="Player" />
                            <AvatarFallback>TH</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Tyreek Hill</div>
                            <div className="text-sm text-muted-foreground">WR</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>WR</TableCell>
                      <TableCell>MIA</TableCell>
                      <TableCell className="text-right font-medium">29.8</TableCell>
                      <TableCell className="text-right text-muted-foreground">22.4</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PFL. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
