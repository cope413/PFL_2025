"use client";

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Menu,
  X,
  Loader2,
  LogOut,
  LogIn,
  Settings,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function RulesPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link
              href="/draft"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Draft
            </Link>
            <Link href="/rules" className="text-sm font-medium transition-colors hover:text-primary">
              Rules
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
                <ThemeToggle />
                <Button variant="outline" size="sm" className="hidden md:flex bg-transparent" onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Avatar>
                  <AvatarImage src="" alt={user.username} />
                  <AvatarFallback>{user.team}</AvatarFallback>
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
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={() => router.push('/auth')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
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
            )}
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
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Draft
              </Link>
              <Link
                href="/rules"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rules
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Official Fantasy League Rules</h1>
              <p className="text-muted-foreground">Prehistoric Football League 2025 (16 Teams)</p>
              <p className="text-sm text-muted-foreground mt-1">Modified 8/17/2025</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* 1.0 GENERAL */}
            <Card>
              <CardHeader>
                <CardTitle>1.0 GENERAL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">1.1</p>
                  <p className="text-muted-foreground">
                    The OWNER of the Prehistoric Football League (PFL) is John Kaneshiro. The OWNER shall maintain all money collected, distribute winnings at the completion of the season and shall be the final arbitrator of disputes that are unresolved by the COMMISSIONER.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.2</p>
                  <p className="text-muted-foreground">
                    The PFL COMMISSIONER is Tom Epperson. The COMMISSIONER will assist in processing weekly lineups, report scoring, track trading, and keep track of each team's standings and cumulative points throughout the season.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.3</p>
                  <p className="text-muted-foreground">
                    The Website Originator and Controller is Taylor Landry. Taylor will be in control of the web site, correcting issues, confirming scores and maintaining the web site. All questions on the web site, scoring or problems with working with the web site should be e-mailed to Taylor, including Tom Epperson as cc on the e-mail.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.4</p>
                  <p className="text-muted-foreground">
                    The league will consist of sixteen (16) Franchise Teams. The offer to purchase a Franchise Team will be by invitation only. Individuals who receive and accept an offer to purchase a Franchise Team, and pay the Franchise fee will become the GENERAL MANAGER of their Franchise Team.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.5</p>
                  <p className="text-muted-foreground">
                    Prior to the start of the season, the OWNER, the COMMISSIONER and selected existing GENERAL MANAGERS shall develop a list of potential GENERAL MANAGERS for the upcoming season. This List shall include persons who, in the opinion of the OWNER, COMMISSIONER, and selected existing GENERAL MANAGERS will be active participants for the duration of the season and foster a positive attitude for the benefit of the league. At the sole discretion of the OWNER AND COMISSIONER returning GENERAL MANAGERS may be given priority over other individuals, but only if the persons meet the criteria. At no time shall a GENERAL MANAGER have an interest in more than one Franchise Team.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.6</p>
                  <p className="text-muted-foreground">
                    The COMMISSIONER shall contact (by Email) persons on the List to inform the persons of the invitation, and to request promise of acceptance and payment. The cost of each franchise is $230.00 plus any remaining unpaid fees from last season. This includes an additional $30 for the current season to cover monies that may become owed at the end of the season. General Managers will receive this deposit back at the end of the season: less any money owed, or in addition to winnings earned. Payment must be received by Sunday, August 31st, 2025 (day of draft). Payment shall be made out to John Kaneshiro by VENMO (preferred) or delivered at the day of draft. Upon receipt of payment, the purchaser will officially become the GENERAL MANAGER of their Franchise Team. The Web Site Controller will only pay $100 and will not need to pay the $30 deposit.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.7</p>
                  <p className="text-muted-foreground">
                    The league will consist of 4 divisions with 4 Franchise Teams in each division for a total of sixteen (16) teams. Each team will play the other teams in their division twice and play most teams in the other divisions only once. There will be a few teams that any one team does not play in the regular season. The regular season will be fourteen weeks. Divisions and team schedules will be established according to original draft order. Trading all draft picks will also change the Team's Division and schedule, see Section 2.2 for more on trading all draft picks.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Cretaceous Division: 1st, 8th, 9th & 16th picks. Jurassic Division: 2nd, 7th, 10th & 15th picks. Mesozoic Division: 3rd, 6th, 11th & 14th picks. Neanderthal Division: 4th, 5th, 12th & 13th picks. Each team is encouraged to name team in conformance with the league theme.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">1.8</p>
                  <p className="text-muted-foreground">
                    All times referenced in these Rules shall be understood to mean Pacific Time Zone (PTZ), unless noted otherwise.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2.0 THE DRAFT */}
            <Card>
              <CardHeader>
                <CardTitle>2.0 THE DRAFT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">2.1</p>
                  <p className="text-muted-foreground">
                    After all sixteen (16) Franchise Teams have been accepted as GENERAL MANAGERS, the OWNER AND COMMISSIONER shall schedule a time and place to draw names to establish the order of the draft. General Managers' names shall be placed in a hat (or similar apparatus), and names shall be removed one by one with the first name picked drafting last; second name drawn drafting second to last; etc. The last name drawn from the hat will draft first. Results of the draft order selection will be sent to all GENERAL MANAGERS by E-mail notification as soon after the drawing as practical. Trades of draft picks will be allowed until 7:00 p.m. on the Friday before DRAFT DAY.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.2</p>
                  <p className="text-muted-foreground">
                    Trading all draft picks will result in trading Divisions and game schedules for the entire season. These trades must precede any other trades and must be completed no later than 7:00 p.m. on the Friday before Draft Day. Trading all draft picks will in effect change the team's original draft order. Teams may elect to trade all draft picks to be in another division with a favorite opponent or to avoid another opponent. The standard trade fees will apply to these trades.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.3</p>
                  <p className="text-muted-foreground">
                    DRAFT DAY is scheduled for Sunday, August 31, 2025 at 9:00 am., (weekend prior to Labor Day) at the COMMISSIONER'S residence (12442 Woodlawn Avenue, Tustin, 92780). GENERAL MANAGERS are encouraged to schedule this date early on their calendars. A TEAM PAGE will be available for GENERAL MANAGERS who choose not to show up in person for the draft. Any General Managers who wish to draft using the TEAM PAGE should call the COMMISSIONER'S residence at least one-half hour before the scheduled beginning of the draft to verify that someone will be monitoring the TEAM PAGE. Alternatively, GENERAL MANAGERS who cannot make the draft can submit a list of players to draft from. Any GENERAL MANAGER not present at the draft or in the TEAM PAGE will have players drafted for them based on player rankings for a starting lineup followed by the remaining team players. GENERAL MANAGERS will be responsible for providing their own list of NFL players to draft from (there are plenty of magazines available for this at your local newsstand).
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Player positions shall be determined in advance of DRAFT DAY. The positions established at this time shall remain in effect for the duration of the entire season (including playoffs).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.4</p>
                  <p className="text-muted-foreground">
                    The first round of the draft will begin with the number one draft pick and ending with the team drafting last. The second round will reverse the order of the first round with team # 16 drafting first (note that this will result in team # 16 having back-to-back picks). Subsequent rounds will continue reversing the order of picks. There will be a total of 16 rounds.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.5</p>
                  <p className="text-muted-foreground">
                    Each team will be given a maximum of 3 minutes to make their draft selection. Failure to select a player within the allocated time will result in loss of selection in that round. A make-up selection will be allowed the following round. However, only three minutes will be given for both picks in the subsequent round. Any picks not completed within the three minutes will be deferred to the next round again.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.6</p>
                  <p className="text-muted-foreground">
                    When it is the team's turn to draft a player, the GENERAL MANAGER may select any player that has not been selected by another team. Every NFL player shall only play for one PFL team.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">2.7</p>
                  <p className="text-muted-foreground">
                    The roster for each team shall consist of the following positions:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>2 quarterbacks</li>
                    <li>2 running backs</li>
                    <li>2 wide receivers</li>
                    <li>2 tight ends</li>
                    <li>2 kickers</li>
                    <li>2 defense/special teams (maximum 2 per team)</li>
                    <li>4 wild cards (can be any positions listed above, except def/sp team)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    Each team must always have this combination of players throughout the season, except as specifically allowed in Section 3.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3.0 TRADES & ROSTER CHANGES */}
            <Card>
              <CardHeader>
                <CardTitle>3.0 TRADES & ROSTER CHANGES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">3.1</p>
                  <p className="text-muted-foreground">
                    General Managers may change their team rosters through trades and waiver drafts as specified in this section. In addition, draft picks and waiver draft picks may also be traded as specified in this section. Any TRADE whose intended purpose is to strengthen one team at the expense of the other may be overturned by the COMMISSIONER (see Disputes for additional information). General Managers may not change Divisions or trade team positions from the positions established in the original draft order selection. Only draft picks or players may be traded.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.2</p>
                  <p className="text-muted-foreground">
                    A Trade Fee of $3.00 will be imposed on every General Manager for each completed trade and each drafted player from the Waiver Draft (except for redrafted players as specified below). Trades between two teams will each be charged the Trade Fee per team for any number of players traded. However, all players involved in the trade must be reported to the COMMISSIONER at the same time (i.e. calling in a two player trade at 5:00 p.m. and then calling in another player later will be two separate trades).
                  </p>
                  <p className="text-muted-foreground mt-2">
                    When more than two Franchise Teams are involved in the trade, then each team involved in the trade will be charged a Trade Fee per Franchise Team. General Managers should note that trading a player for a waiver pick could result in a Trade Fee for the trade and another Trade Fee when a player is drafted during the Waiver Draft. Trades involving all draft picks will be charged $3.00 for each team involved.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.3</p>
                  <p className="text-muted-foreground">
                    Trades and waiver picks will only be allowed at specified times during the season. Trades can include draft positions, players, and/or waiver draft positions. Once all parties involved in a trade agree to the terms, the trade will be considered PENDING until all parties involved in the trade have contacted the COMMISSIONER to verify the terms of the trade. The trade must be completed before the deadline, or the trade will not be allowed. General Managers shall not "shop" players or draft positions that are part of a Pending Trade. As soon as all parties have confirmed the trade, the trade will be considered complete. A General Manager shall not fail to contact the COMMISSIONER in an attempt to cancel a trade.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.4</p>
                  <p className="text-muted-foreground">
                    Draft Day draft positions may be traded until 7:00 p.m. on the Friday immediately before Draft Day. This will provide the COMMISSIONER enough time to prepare the final draft order before Draft Day. After completion of the draft on Draft Day, players may be traded until 7:00 p.m. on the first Friday following Draft Day. Any trades not reported to the COMMISSIONER by 7:00 p.m. on the Friday following Draft Day will not be allowed.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.5</p>
                  <p className="text-muted-foreground">
                    During the season, trades will be allowed following PFL week 2 games through week 13 (until the Friday before week 13 games). Trades must be reported to the Commissioner by 9:00 p.m. the Wednesday before the start of games for that week. For example, players that are part of a trade being reported on the Wednesday before week 6 games can be used by the new owner in the week 6 games. This allows the Commissioner the opportunity to update the rosters on the weekly spreadsheet for the upcoming week.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.6</p>
                  <p className="text-muted-foreground">
                    During the season, players may become injured or may no longer be considered valuable to the team. The Waiver Draft provides the General Manager with an opportunity to replace the underperforming player with an undrafted player. During selected weeks, General Managers may place one or more of their players on the Waiver List. Players put on the Waiver List, aka Waived Players, will become available for other teams to draft during the Waiver Draft. Teams that place players on the Waiver List will receive one Waiver Draft pick for each player waived. Teams will not be charged a Trade Fee for placing players on the Waver List. However, a Trade Fee will be imposed for each player drafted by a General Manager during the Waiver Draft. The only exception to this is when a player is waived and then is redrafted by the team who waived him after waiting one draft round (allowing every other team with a draft pick at least one chance to draft the player).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.7</p>
                  <p className="text-muted-foreground">
                    Waiver Drafts will be conducted between weeks 2 & 3 (after game 2 & before game 3), between weeks 5 & 6, weeks 8 & 9, and weeks 11 & 12. Players must be waived (placed on the Waiver List and available for another team to draft) by 7:00 p.m. on the Friday preceding the 2nd, 5th, 8th, and 11th weeks.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    To waive a player, GENERAL MANAGERS must notify the COMMISSIONER which player(s) are being waived by 7:00 p.m. on the Friday preceding the draft weeks (before games 2, 5, 8 and 11). The order of the players waived may be significant to the Waiver Draft. Any team who wants to pick up a player from the Waver List must waive at least one player or trade for another team's waiver pick. Waived Players are eligible to be drafted by another Franchise Team. Players drafted from the Waiver Draft are eligible to start in games for the following week (either week 1, 3, 6, 9 or 12).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.8</p>
                  <p className="text-muted-foreground">
                    The order of the waiver draft during the season will be established after the scores are official for the games in the week preceding draft week (i.e. after games in weeks 2, 5, 8 and 11). The order of the Waiver Draft will be established using the following with the worst team drafting first: a) worst record; b) lowest points scored; and c) highest draft order.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.9</p>
                  <p className="text-muted-foreground">
                    The waiver draft will be held and completed on the Wednesday night during the waiver draft week (after games in weeks 2, 5, 8, and 11). The waiver draft will be held in TEAM PAGE. The draft will start at 8:00 pm and each player will be given a maximum of 3 minutes to select a player. If a team cannot be present for the draft, then that team's GENERAL MANAGER shall designate someone else to represent them during the draft or provide a list to the COMMISSIONER for the purpose of identifying the players to draft in the order desired. If a team's GENERAL MANAGER is not present on the TEAM PAGE at the time of his pick and his 3 minutes are expired, but becomes present after the time for his pick expires, the GENERAL MANAGER will get to make his pick at the end of the round (prior to the next round of picks). If a team waives players and does not have representation at the waiver draft nor provided a list to draft from, then the team shall pass the first round of the draft, and the COMMISSIONER shall draft the original players waived by the team in the order that the players were waived. If a player waived is no longer available or all of the players in the list are unavailable, then the COMMISSIONER shall draft the highest average scoring player from the current PFL points listing for the position(s) to be filled in order of players waived. The COMMISSIONER shall resolve any conflicts during the draft and make every effort to complete the draft the same night.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">3.10</p>
                  <p className="text-muted-foreground">
                    During waiver draft weeks, rosters may deviate from the requirements for specified number of players per position and total number of players, provided that at the end of the waiver draft week, the rosters are back into compliance. The penalty for errors in a roster discovered during or after the draft or at the end of waiver draft weeks shall be suspension of non-complying players (as determined by the COMMISSIONER) for a period up to the next waiver draft week (during which the team shall correct the error). If the error occurs in the last waiver draft, then the suspension period shall be to the end of the season (including playoffs). At his sole discretion, the COMMISSIONER may shorten the suspension if the team's roster is corrected through a trade.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 4.0 GAME SCHEDULE */}
            <Card>
              <CardHeader>
                <CardTitle>4.0 GAME SCHEDULE</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-semibold mb-2">4.1</p>
                  <p className="text-muted-foreground">
                    The PFL Fantasy League Game Schedule 2025 shall apply based on original draft order. Each week, all sixteen Franchise Teams shall play other Franchise Teams based on this schedule.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5.0 LINEUPS */}
            <Card>
              <CardHeader>
                <CardTitle>5.0 LINEUPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">5.1</p>
                  <p className="text-muted-foreground">
                    For each week in which the Franchise Team has a game, the GENERAL MANAGER shall submit a starting lineup for that game. For the regular season, PFL weeks 1 through 14, all teams shall submit lineups. Lineups shall be submitted up to week 17 for teams that make the playoffs.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    The GENERAL MANAGER shall submit on the Web Site or by E-mail to the COMMISSIONER, OWNER and opposing GENERAL MANAGER a starting lineup for their team NO LATER THAN 1.0 HOUR BEFORE GAMETIME on the DAY OF THE GAME FOR GAMES STARTING ON THURSDAY, FRIDAY OR SATURDAY. NO LATE LINEUPS WILL BE ACCEPTED FOR GAMES STARTING ON THURSDAY, FRIDAY OR SATURDAY.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    It is the GENERAL MANAGER's responsibility to ensure that his starting lineup has all of the necessary players and positions conforming to Subsection 5.4.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    For games that start on Sunday, Monday, Tuesday or Wednesday, lineups shall be submitted on the Web Site or by E-mail to the COMMISSIONER, OWNER and opposing GENERAL MANAGER by 9:00 am on Sunday before the Sunday games. Lineups posted after 9:00 am but before the start of the 10:00 games will be considered LATE. No lineups shall be accepted after 10:00 am on Sunday. GENERAL MANAGERS that do not turn in a complete lineup by the deadline shall be fined according to Subsection 5.2 (NO EXCEPTIONS). Failure to submit a complete lineup shall result in a lineup being submitted per Subsection 5.3. During weeks when there are Thursday, Friday, or Saturday games, teams who want to start players in those games must submit at least a partial lineup (of the players who will be playing in those games) no later than 1.0 hour before the game start time based on the date and time shown on the Web Site or E-mail and NFL posted game start time. Late lineups will be accepted on Sunday morning between 9:00 am and 10:00 am and will be fined per Subsection 5.2. Lineups may be turned in early and then modified (without fines) as often as desired prior to the deadlines.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">5.2</p>
                  <p className="text-muted-foreground">
                    Lineups received after the 9:00 a.m. deadline but before the 10:00 am on the Sunday that they are due will be considered a late lineup. Late lineups shall be fined $5.00 for each player added to the lineup or changed in the lineup between 9:00 a.m. and 10:00 am on Sunday, to a maximum of $25.00. Failure to submit a complete lineup by 10:00 a.m. on Sunday shall constitute an incomplete lineup. Incomplete lineups will result in a fine of $10.00 for each player missing from the lineup to a maximum of $50.00.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    The maximum combination of fines for late and incomplete lineups shall not exceed $50.00 in any one week. These fines shall apply even if all available players for a position are off that week.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">5.3</p>
                  <p className="text-muted-foreground">
                    Incomplete lineups shall be completed by the COMMISSIONER using players that were in the team's lineup for the previous week, except for players in Thursday, Friday or Saturday games who must be started explicitly. In the case of the first week of the season, the players shall be included for the missing positions based on highest draft selection, excluding players who played before Sunday. Where players are not available due to a trade, formation conflict or played in a game before Sunday, then the COMMISSIONER shall fill the empty positions using players of highest value who have not played before Sunday of that week.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    If the COMMISSIONER's team is playing against the team with the incomplete lineup then the OWNER shall make the player selections to complete the lineup. This will eliminate games where one team has no players (or is short players) in the lineup. The COMMISSIONER will not be responsible for replacing players submitted in a lineup by a team where the players have a bye week, are injured, or otherwise would be known to not play in the upcoming week (this is the GENERAL MANAGER's responsibility to know who is playing).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">5.4</p>
                  <p className="text-muted-foreground">
                    Each team's weekly starting lineup shall conform to one of the three formations shown below. Each formation may be used as many times as desired during the regular season and during the playoffs. Positions can only be filled with players eligible for the position as determined on Draft Day. Note that players identified by the NFL as Full Backs will be considered Running Backs.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="border rounded-lg p-4">
                      <p className="font-semibold mb-2">Standard</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>1 quarterback</li>
                        <li>2 running backs</li>
                        <li>2 wide receivers</li>
                        <li>1 tight end</li>
                        <li>1 kicker</li>
                        <li>1 defense/special teams</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="font-semibold mb-2">Single Setback</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>1 quarterback</li>
                        <li>1 running back</li>
                        <li>3 wide receivers</li>
                        <li>1 tight end</li>
                        <li>1 kicker</li>
                        <li>1 defense/special teams</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="font-semibold mb-2">Short Yardage</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>1 quarterback</li>
                        <li>3 running backs</li>
                        <li>1 wide receiver</li>
                        <li>1 tight end</li>
                        <li>1 kicker</li>
                        <li>1 defense/special teams</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">5.5</p>
                  <p className="text-muted-foreground">
                    Lineups must be submitted on the Web Site or by E-mail to the OWNER, COMMISSIONER and the opposing GENERAL MANAGER. The E-mail shall state the player's name, team and position.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">5.6</p>
                  <p className="text-muted-foreground">
                    A complete lineup must be submitted for every week that the team has a game. Failure to submit a complete lineup shall result in a fine, per Subsection 5.2. Failure for a GENERAL MANAGER to submit a second lineup shall result in an additional fine and possible removal as GENERAL MANAGER from the team, see Disputes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 6.0 SCORING */}
            <Card>
              <CardHeader>
                <CardTitle>6.0 SCORING</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">6.1</p>
                  <p className="text-muted-foreground">
                    Points will be awarded according to the attached PFL Fantasy League Scoring Schedule. The team with the highest score in each game as determined by the COMMISSIONER shall be considered the winning team.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">6.2</p>
                  <p className="text-muted-foreground">
                    Scores will be posted on the Web Site automatically or by the Web Site Controller and can be sent by E-mail to all GENERAL MANAGERS who request it within a reasonable time after the last game of the week has been played. Goal is to post the results on the Web Site by end of day Tuesday. Each General Manager is encouraged to check the scores posted and to report any suspected errors to the COMMISSIONER and OWNER and their Opponent GENERAL MANAGER as soon as possible. All game scores will become final 72 hours following the last game of the week or 48 hours after the scores are posted, whichever occurs last (in case the COMMISSIONER is late posting scores). Unless a scoring error is reported to the COMMISSIONER and OWNER and the Opponent GENERAL MANAGER within the allotted time, the posted results will be considered final. See Disputes on the procedure to report a scoring error.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7.0 PLAYOFFS */}
            <Card>
              <CardHeader>
                <CardTitle>7.0 PLAYOFFS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">7.1</p>
                  <p className="text-muted-foreground">
                    The Playoffs will consist of a Winner's Bracket (see subsection 7.2) and a Loser's Bracket (see subsection 7.6).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.2</p>
                  <p className="text-muted-foreground">
                    The Winner's Bracket will include the four Divisional Champions and four Wildcard teams and will consist of a three game playoff series beginning in NFL week 15. The team with the best record in each division will be the Division champions for their respective divisions. The Divisional champions will be ranked from best record, Div1, to worst, Div4. From the remaining teams, the four teams with the best records will become the Wildcard teams. The Wildcard teams will be ranked from best record, WC1, to worst, WC4.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.3</p>
                  <p className="text-muted-foreground">
                    In the first round of the Winner's Bracket, NFL Week 15, the Divisional Champion with the best record (Div1) will play the Wildcard team with the worst record (WC4); Team Div2 will play WC3; Team Div3 will play WC2; and Team Div4 will play WC1.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.4</p>
                  <p className="text-muted-foreground">
                    In the second round of the Winner's Bracket, NFL week 16, the winner of Div1 vs. WC4 will play the winner of Div4 vs. WC1; the second game will feature the other two winning teams.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.5</p>
                  <p className="text-muted-foreground">
                    The two winning teams from round two of the playoffs will play each other for the PFL Super Bowl XXVI in NFL week 17.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.6</p>
                  <p className="text-muted-foreground">
                    The Loser's Bracket will include all eight teams that did not make the Winner's Bracket and will consist of a three game playoff series beginning in NFL week 15. These eight teams will be seeded from B1 (best) to B8 (worst), regardless of division.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.7</p>
                  <p className="text-muted-foreground">
                    In the first round of the Loser's Bracket, NFL Week 15, the highest seeded team (B1) will play the lowest seeded team (B8). The second highest seeded team (B2) will play the second lowest seeded team (B7); Team B3 will play Team B6, and Team B4 will play Team B5.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.8</p>
                  <p className="text-muted-foreground">
                    In the second round of the Loser's Bracket, NFL week 16, the winning teams from Round 1 will be reseeded (B1 thru B4). The remaining team with the highest seed (B1) will play the remaining team with the lowest seed (B4), and Team B2 will play Team B3.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">7.9</p>
                  <p className="text-muted-foreground">
                    The two winning teams from round two of the Loser's Bracket will play each other for the PFL Second Chance Bowl XXVI in NFL week 17.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8.0 TIES */}
            <Card>
              <CardHeader>
                <CardTitle>8.0 TIES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">8.1</p>
                  <p className="text-muted-foreground">
                    At the end of the regular season, if two or more teams eligible for the playoffs have identical standings (wins, losses and ties), then the tiebreaker rule shall be applied. The tiebreaker shall be applied to all tied teams and used to identify a Clear Winner, Clear Loser, or select one team to remove from further consideration and then be reapplied until only one team is left.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    If more than one team will be selected (such as for wildcard positions), then the tiebreaker shall be used to fill one position at a time until all team positions have been filled. All divisional winners shall be identified first and then each wildcard position in decreasing order (best to worst). For example, assume three teams (A, B and C) are tied for Division 1. The tiebreaker in Section 8.3 is applied, there is no Clear Winner, and let's say that Team A ends up last among the three tied teams and is subsequently removed before proceeding with the next step. Team B and C must still use the tiebreaker rules (this time Section 8.2) to determine which one gets the first spot. If three teams are tied but the teams did not play each other the same number of times, but one team beat all the other teams tied and never lost to any of the tied teams, then that team is declared the Clear Winner and no additional tiebreaker rules are applied.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">8.2</p>
                  <p className="text-muted-foreground">
                    At the end of the regular season, if only two (see subsection 8.3 for more than two teams tied) teams eligible for the playoffs have identical standings (wins, losses and ties), the following tiebreaker shall apply: 1) head-to-head winning percentage in games against each other, 2) highest average points scored in games against each other, 3) divisional record (if teams tied are in the same division, otherwise this does not apply), 4) most points scored overall, 5) least points allowed overall, 6) team with the lowest original draft position (worst original draft order).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">8.3</p>
                  <p className="text-muted-foreground">
                    At the end of the regular season, if more than two teams eligible for the playoffs have identical standings (wins, losses and ties), then the following tiebreaker shall apply: 1) Clear Winner is declared when one team has won at least one game against all other teams tied, has never lost against any of the tied teams, and has played every tied team at least once, 2) Clear Loser is declared when one team has played all other tied teams at least once and has lost all games played between the tied teams, 3) head-to-head winning percentage in games against the teams tied (this only applies if all teams tied have played all other teams tied the same number of times), 4) most points scored overall, 5) least points allowed overall, 6) team with the lowest original draft position(worst original draft order).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">8.4</p>
                  <p className="text-muted-foreground">
                    For playoff games only, GENERAL MANAGERS shall submit an overtime order of their nonstarters. In the event of a tie, the Overtime Players will be compared one at a time (sudden death) until a winner emerges, with all applied points being added to the regulation score. Once a winner is determined, the remaining Overtime Players do not add points to the score. If the teams are still tied, then the highest (best) seeded playoff team shall be the winner (in such a case, one point shall be awarded to the team with the higher playoff position).
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">8.5</p>
                  <p className="text-muted-foreground">
                    An Overtime Player cannot be added to a lineup (even if no lineup was submitted) after that player has played in Thursday, Friday or Saturday games. Teams which fail to submit Overtime Players (or only submit a partial list) will have their remaining nonstarters ordered alphabetically (last name then first name for players [according to NFL.com], team name [not city] for ST/Def), excluding players who played in Thursday, Friday or Saturday games.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 9.0 WINNINGS */}
            <Card>
              <CardHeader>
                <CardTitle>9.0 WINNINGS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">9.1</p>
                  <p className="text-muted-foreground">
                    Winnings will be paid by the OWNER from monies received at the beginning of the season within 4 to 6 weeks after completion of post season play. There will be a $70 charge for getting live stats from NFL which will be charged to all teams.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.2</p>
                  <p className="text-muted-foreground">
                    In addition to the year-end pot, there will be a weekly head-to-head competition between teams, whereby the losing team will pay the winning team 10 cents per point by the margin of victory. The weekly winnings will be netted against the losses and winnings paid/collected at the end of the season. The $0.10 per point pay-outs will not be in effect during the playoffs.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.3</p>
                  <p className="text-muted-foreground">
                    Special prizes will be awarded for the following categories for the first half of the regular season (end of week 7) and for the second half of the regular season (weeks 8 through 14). These prizes do not apply to the playoffs. Each bonus prize is worth $40 for each half of the season.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>High Game Score: The team with the highest single game score.</li>
                    <li>High Losing Score: The team with the highest single game score in a game where the team lost the game (excludes ties).</li>
                    <li>Tough Schedule: The team with the most points scored against them.</li>
                    <li>Best Loser: The team with the most points scored in games in which they lost.</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    In addition, at the end of the regular season, the team, that did not make the Winner Bracket Playoffs with the most total points scored (for all 14 games), shall be awarded a bonus prize worth $40.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.4</p>
                  <p className="text-muted-foreground">
                    Winner's Bracket: The prize money will be split in the following manner:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>Wildcard teams will receive $175 each</li>
                    <li>First place team in each division will receive $250 each</li>
                    <li>Teams that win in the First Round of the Playoffs will win an additional $80 each</li>
                    <li>Teams that win in the Second Round of the Playoffs will win an additional $140 each</li>
                    <li>The team that wins the PFL Super Bowl XXVI will receive an additional $260 plus half of the trade money collected</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.5</p>
                  <p className="text-muted-foreground">
                    Loser's Bracket: The prize money will be split in the following manner:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>Teams that win in the First Round of the Loser's Bracket will win an additional $20 each</li>
                    <li>Teams that win in the Second Round of the Loser's Bracket will win an additional $40 each</li>
                    <li>The team that wins the PFL Second Chance Bowl XXVI will receive an additional $80</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.6</p>
                  <p className="text-muted-foreground">
                    Half of the trade money will go to the Super Bowl Winner.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.7</p>
                  <p className="text-muted-foreground">
                    The other half of the trade money will be distributed in the following manner: $60 used for the above winnings and the remaining to the league for trophy (engrave name of Super Bowl winner on the plaque) and other league expenses.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 10.0 DISPUTES */}
            <Card>
              <CardHeader>
                <CardTitle>10.0 DISPUTES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">10.1</p>
                  <p className="text-muted-foreground">
                    If a team has a dispute, the GENERAL MANAGER of the team shall communicate the dispute to the COMMISSIONER and the OWNER. The COMMISSIONER will resolve all disputes except in situations where the dispute involves his team. The COMMISSIONER shall defer all disputes to which he is a party to the league OWNER. Disputes involving both the OWNER and COMMISSIONER shall be referred to a non-interested party agreed to by both the OWNER and COMMISSIONER. Any comments or questions will be taken into consideration by the COMMISSIONER and the OWNER. The COMMISSIONER and the OWNER may modify the RULES at any time in order to clarify a rule or correct an error.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">10.2</p>
                  <p className="text-muted-foreground">
                    The league considers the failure to submit a lineup a serious offense. Failure to submit two lineups during the season shall be considered grounds for removal of the GENERAL MANAGER for the team at the desecration of the OWNER and COMMISSIONER.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">10.3</p>
                  <p className="text-muted-foreground">
                    If for any reason, a GENERAL MANAGER is removed from having control of a team, then the GENERAL MANAGER shall be notified of the removal with the reason(s) stated, and the OWNER AND COMMISSIONER shall select another person to replace the removed GENERAL MANAGER. The replacement GENERAL MANAGER shall not have a controlling interest in another team. The outgoing GENERAL MANAGER will be responsible for trade fees, fines, and charges imposed through the replacement date and will be eligible for winnings through the replacement date. After the replacement date, the new GENERAL MANAGER shall be responsible for any new fees, fines, and charges.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">10.4</p>
                  <p className="text-muted-foreground">
                    Scores - Player statistics, which are used to calculate game scores, will be obtained from the NFL web site. If an error in these statistics is reported to the OWNER and COMMISSIONER, then the play-by-play results or additional web sites (at the discretion of the OWNER and COMMISSIONER) will be consulted to resolve the issue. Scoring errors shall be reported to the OWNER and COMMISSIONER as soon as the error is detected. The GENERAL MANAGER reporting the error shall report to the OWNER, COMMISSIONER AND THEIR OPPONENT exactly which player statistic is incorrect and the GENERAL MANAGER's source for the statistic. All scores will become final 72 hours after the final game of the week (Monday night) or 48 hours after final scores are posted, whichever occurs last. Disputes regarding player statistics or other scoring errors will be resolved by the OWNER and COMMISSIONER.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    (Revised: 8/17/2025)
                  </p>
                </div>
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

