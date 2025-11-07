"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeftRight, UserPlus, Menu, X, Settings, LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useTeams, useTrades } from "@/hooks/useApi";
import { apiService } from "@/lib/api";
import type { Trade, TradePlayerItem } from "@/lib/db-types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PlayerOption = {
  id: string;
  name: string;
  position: string;
  nflTeam?: string;
};

type TeamSummary = {
  id: string;
  name: string;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "secondary",
  approved: "default",
  declined: "destructive",
  cancelled: "outline",
};

function formatPlayer(player?: TradePlayerItem | PlayerOption) {
  if (!player) return "Unknown";
  const parts = [player.position, player.name || player.playerName].filter(Boolean);
  const base = parts.join(" • ");
  const team = (player as any).nflTeam;
  return team ? `${base} (${team})` : base;
}

function getTradePerspective(trade: Trade, viewerTeamId?: string | null) {
  const proposerName = trade.proposerTeamName || trade.proposerUsername || trade.proposerTeamId;
  const recipientName = trade.recipientTeamName || trade.recipientUsername || trade.recipientTeamId;

  const isProposer = viewerTeamId ? trade.proposerTeamId === viewerTeamId : false;
  const isRecipient = viewerTeamId ? trade.recipientTeamId === viewerTeamId : false;

  if (isProposer) {
    return {
      giving: trade.offeredPlayers,
      receiving: trade.requestedPlayers,
      counterpartyName: recipientName,
      initiatedByUser: true,
      givingLabel: "You Give",
      receivingLabel: "You Receive",
      proposerName,
      recipientName,
    };
  }

  if (isRecipient) {
    return {
      giving: trade.requestedPlayers,
      receiving: trade.offeredPlayers,
      counterpartyName: proposerName,
      initiatedByUser: false,
      givingLabel: "You Give",
      receivingLabel: "You Receive",
      proposerName,
      recipientName,
    };
  }

  return {
    giving: trade.offeredPlayers,
    receiving: trade.requestedPlayers,
    counterpartyName: `${proposerName} ↔ ${recipientName}`,
    initiatedByUser: false,
    givingLabel: `${proposerName} Gives`,
    receivingLabel: `${recipientName} Gives`,
    proposerName,
    recipientName,
  };
}

async function fetchTeamRoster(teamId: string): Promise<PlayerOption[]> {
  const team = await apiService.getTeam(teamId) as any;
  const roster = team?.roster || [];
  return roster.map((player: any) => ({
    id: String(player.id ?? player.player_id ?? player.playerId ?? ""),
    name: player.name || player.player_name,
    position: player.position,
    nflTeam: player.nflTeam || player.team_name || player.nfl_team,
  })) as PlayerOption[];
}

export default function TradesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, logout } = useAuth();

  const { data: teamsData, loading: teamsLoading } = useTeams();
  const {
    data: tradesData,
    loading: tradesLoading,
    refetch: refetchTrades,
    setData: setTradesData,
  } = useTrades(user?.team, Boolean(user?.team));
  const {
    data: commissionerData,
    loading: commissionerLoading,
    refetch: refetchCommissionerTrades,
  } = useTrades('all', Boolean(user?.is_admin));

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [userRoster, setUserRoster] = useState<PlayerOption[]>([]);
  const [partnerRoster, setPartnerRoster] = useState<PlayerOption[]>([]);
  const [userRosterLoading, setUserRosterLoading] = useState<boolean>(false);
  const [partnerRosterLoading, setPartnerRosterLoading] = useState<boolean>(false);
  const [offeredPlayers, setOfferedPlayers] = useState<string[]>([]);
  const [requestedPlayers, setRequestedPlayers] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.team) return;

    let isMounted = true;
    setUserRosterLoading(true);
    fetchTeamRoster(user.team)
      .then((roster) => {
        if (!isMounted) return;
        setUserRoster(roster);
      })
      .catch((error) => {
        console.error("Failed to load user roster", error);
        toast({
          title: "Unable to load roster",
          description: "We couldn't load your team roster. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setUserRosterLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.team, toast]);

  useEffect(() => {
    if (!teamsData || !user?.team || selectedTeamId) return;

    const otherTeam = (teamsData as TeamSummary[]).find((team) => team.id !== user.team);
    if (otherTeam) {
      setSelectedTeamId(otherTeam.id);
    }
  }, [teamsData, user?.team, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setPartnerRoster([]);
      setRequestedPlayers([]);
      return;
    }

    let isMounted = true;
    setPartnerRosterLoading(true);
    fetchTeamRoster(selectedTeamId)
      .then((roster) => {
        if (!isMounted) return;
        setPartnerRoster(roster);
        setRequestedPlayers((prev) => prev.filter((id) => roster.some((player) => player.id === id)));
      })
      .catch((error) => {
        console.error("Failed to load partner roster", error);
        toast({
          title: "Unable to load opponent roster",
          description: "We couldn't load the selected team's roster. Please try another team.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setPartnerRosterLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTeamId, toast]);

  const availableTeams: TeamSummary[] = useMemo(() => {
    if (!teamsData || !Array.isArray(teamsData)) return [];
    return (teamsData as TeamSummary[]).filter((team) => team.id !== user?.team);
  }, [teamsData, user?.team]);

  const trades: Trade[] = useMemo(() => {
    if (!tradesData) return [];
    return tradesData as Trade[];
  }, [tradesData]);

  const commissionerTrades: Trade[] = useMemo(() => {
    if (!commissionerData || !Array.isArray(commissionerData)) return [];
    return (commissionerData as Trade[]).filter((trade) => trade.status === 'accepted');
  }, [commissionerData]);

  const incomingTrades = useMemo(
    () => trades.filter((trade) => trade.recipientTeamId === user?.team),
    [trades, user?.team]
  );

  const outgoingTrades = useMemo(
    () => trades.filter((trade) => trade.proposerTeamId === user?.team),
    [trades, user?.team]
  );

  const handleToggleOfferedPlayer = (playerId: string) => {
    setOfferedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleToggleRequestedPlayer = (playerId: string) => {
    setRequestedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const resetForm = () => {
    setOfferedPlayers([]);
    setRequestedPlayers([]);
    setMessage("");
    setFormError(null);
  };

  const handleCreateTrade = async () => {
    if (!user?.team) {
      setFormError("You must belong to a team to propose trades.");
      return;
    }

    if (!selectedTeamId) {
      setFormError("Please select a team to trade with.");
      return;
    }

    if (offeredPlayers.length === 0 && requestedPlayers.length === 0) {
      setFormError("Select at least one player to include in the trade.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await apiService.proposeTrade({
        recipientTeamId: selectedTeamId,
        offeredPlayerIds: offeredPlayers,
        requestedPlayerIds: requestedPlayers,
        message: message.trim() || undefined,
      });

      const newTrade = result as Trade;
      setTradesData([newTrade, ...trades]);
      resetForm();
      toast({
        title: "Trade proposed",
        description: "Your trade has been sent to the opposing team.",
      });
    } catch (error: any) {
      const description = error?.message || "Failed to create trade. Please try again.";
      toast({
        title: "Trade proposal failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTradeAction = async (
    tradeId: string,
    action: "accept" | "decline" | "cancel" | "approve",
    promptLabel?: string,
  ) => {
    try {
      const note = promptLabel ? window.prompt(promptLabel) || undefined : undefined;
      await apiService.updateTrade(tradeId, action, note);
      await refetchTrades();

      if (user?.is_admin) {
        await refetchCommissionerTrades();
      }

      const resultMessage =
        action === "accept"
          ? "Trade accepted"
          : action === "decline"
          ? "Trade declined"
          : action === "cancel"
          ? "Trade cancelled"
          : "Trade approved";

      toast({
        title: resultMessage,
        description: note ? "Your note was sent with the response." : undefined,
      });
    } catch (error: any) {
      toast({
        title: "Trade update failed",
        description: error?.message || "We couldn't update the trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading trades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/PFL Logo.png" alt="PFL Logo" className="h-6 w-6" />
            <span className="text-xl font-bold">PFL</span>
          </div>

          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/leagues" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Standings
            </Link>
            <Link href="/scoreboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scoreboard
            </Link>
            <Link href="/players" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Players
            </Link>
            <Link href="/team-dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Team Dashboard
            </Link>
            <Link href="/teams" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Teams
            </Link>
            <Link href="/trades" className="text-sm font-medium transition-colors hover:text-primary">
              Trades
            </Link>
            <Link href="/draft" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Draft
            </Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex bg-transparent"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>{user?.team || "U"}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push("/auth")}>
                Login
              </Button>
            )}

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
                href="/trades"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trades
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
                className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
              <div className="pt-2 border-t">
                {user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => {
                      router.push("/settings");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => {
                      router.push("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="container mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <Badge variant="outline" className="px-4 py-1 text-sm">
            Trade Center
          </Badge>
          <h1 className="text-3xl font-bold">Manage Trades</h1>
          <p className="text-muted-foreground max-w-2xl">
            Propose new trades, review offers from other teams, and keep your roster competitive throughout the season.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Propose a Trade
              </CardTitle>
              <CardDescription>
                Select a team, choose the players to offer and request, and send a proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Choose a team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={(value) => {
                    setSelectedTeamId(value);
                    setRequestedPlayers([]);
                  }}
                  disabled={teamsLoading || availableTeams.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select a team"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">You're Offering</h3>
                    <p className="text-xs text-muted-foreground">Select players from your roster</p>
                  </div>
                  <Card className="border-dashed">
                    <CardContent className="p-0">
                      <ScrollArea className="h-64">
                        <div className="divide-y">
                          {userRosterLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Loading roster...</span>
                            </div>
                          ) : userRoster.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Your roster is currently empty.
                            </div>
                          ) : (
                            userRoster.map((player) => (
                              <label
                                key={player.id}
                                className="flex items-center justify-between gap-4 px-3 py-3 text-sm hover:bg-muted/40"
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{formatPlayer(player)}</span>
                                </div>
                                <Checkbox
                                  checked={offeredPlayers.includes(player.id)}
                                  onCheckedChange={() => handleToggleOfferedPlayer(player.id)}
                                  aria-label={`Toggle ${player.name}`}
                                />
                              </label>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">You're Requesting</h3>
                    <p className="text-xs text-muted-foreground">Select players from the other team</p>
                  </div>
                  <Card className="border-dashed">
                    <CardContent className="p-0">
                      <ScrollArea className="h-64">
                        <div className="divide-y">
                          {partnerRosterLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Loading roster...</span>
                            </div>
                          ) : partnerRoster.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Select a team to view their roster.
                            </div>
                          ) : (
                            partnerRoster.map((player) => (
                              <label
                                key={player.id}
                                className="flex items-center justify-between gap-4 px-3 py-3 text-sm hover:bg-muted/40"
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{formatPlayer(player)}</span>
                                </div>
                                <Checkbox
                                  checked={requestedPlayers.includes(player.id)}
                                  onCheckedChange={() => handleToggleRequestedPlayer(player.id)}
                                  aria-label={`Toggle ${player.name}`}
                                />
                              </label>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-message">Message (optional)</Label>
                <Textarea
                  id="trade-message"
                  placeholder="Add context to the trade or highlight why it helps both teams."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                />
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleCreateTrade} disabled={isSubmitting || !selectedTeamId} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Proposal
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Trade Proposal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <TradeListCard
              title="Incoming Offers"
              emptyMessage="You don't have any pending offers right now."
              trades={incomingTrades}
              loading={tradesLoading}
              viewerTeamId={user.team}
              onAction={handleTradeAction}
              isAdmin={user?.is_admin}
            />

            <TradeListCard
              title="Your Proposals"
              emptyMessage="Send a trade offer to see it tracked here."
              trades={outgoingTrades}
              loading={tradesLoading}
              viewerTeamId={user.team}
              onAction={handleTradeAction}
              isOutgoing
              isAdmin={user?.is_admin}
            />

            {user?.is_admin && (
              <CommissionerTradeList
                trades={commissionerTrades}
                loading={commissionerLoading}
                onAction={handleTradeAction}
              />
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

interface TradeListCardProps {
  title: string;
  emptyMessage: string;
  trades: Trade[];
  loading: boolean;
  viewerTeamId?: string | null;
  isOutgoing?: boolean;
  onAction: (tradeId: string, action: "accept" | "decline" | "cancel" | "approve", promptLabel?: string) => Promise<void>;
  isAdmin?: boolean;
}

function TradeListCard({ title, emptyMessage, trades, loading, viewerTeamId, isOutgoing, onAction, isAdmin }: TradeListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isOutgoing
            ? "Track proposals you've sent to other teams."
            : "Review offers that other teams have sent to you."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading trades...</span>
          </div>
        ) : trades.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                viewerTeamId={viewerTeamId}
                isOutgoing={isOutgoing}
                onAction={onAction}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TradeCardProps {
  trade: Trade;
  viewerTeamId?: string | null;
  isOutgoing?: boolean;
  onAction: (tradeId: string, action: "accept" | "decline" | "cancel" | "approve", promptLabel?: string) => Promise<void>;
  isAdmin?: boolean;
  commissionerView?: boolean;
}

function TradeCard({ trade, viewerTeamId, isOutgoing, onAction, isAdmin }: TradeCardProps) {
  const perspective = getTradePerspective(trade, viewerTeamId);
  const createdDate = trade.createdAt ? new Date(trade.createdAt) : null;
  const isPending = trade.status === "pending";
  const viewerIsParticipant = Boolean(
    viewerTeamId && (trade.recipientTeamId === viewerTeamId || trade.proposerTeamId === viewerTeamId)
  );
  const canAct = isPending && viewerIsParticipant;
  const canApprove = Boolean(isAdmin && trade.status === "accepted");
  const proposerDisplay = perspective.proposerName;
  const recipientDisplay = perspective.recipientName;

  let headerDescription: string;
  if (viewerIsParticipant) {
    const isProposerViewer = viewerTeamId === trade.proposerTeamId;
    headerDescription = isProposerViewer ? `Sent to ${recipientDisplay}` : `From ${proposerDisplay}`;
  } else {
    headerDescription = `${proposerDisplay} ↔ ${recipientDisplay}`;
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {headerDescription}
          </div>
          {createdDate && (
            <div className="text-xs text-muted-foreground">
              Proposed {createdDate.toLocaleString()}
            </div>
          )}
        </div>
        <Badge variant={statusVariant[trade.status] ?? "secondary"} className="capitalize">
          {trade.status}
        </Badge>
      </div>

      {trade.proposerMessage && (
        <div className="mt-3 rounded-md bg-muted p-3 text-sm">
          <span className="font-medium">Message:</span> {trade.proposerMessage}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">{perspective.givingLabel || "Players"}</h4>
          <ul className="mt-2 space-y-1">
            {perspective.giving.length > 0 ? (
              perspective.giving.map((item) => (
                <li key={item.id} className="rounded-md bg-muted px-3 py-2 text-sm">
                  {formatPlayer(item)}
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                Nothing added from your roster
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">{perspective.receivingLabel || "Players"}</h4>
          <ul className="mt-2 space-y-1">
            {perspective.receiving.length > 0 ? (
              perspective.receiving.map((item) => (
                <li key={item.id} className="rounded-md bg-muted px-3 py-2 text-sm">
                  {formatPlayer(item)}
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                No players requested
              </li>
            )}
          </ul>
        </div>
      </div>

      {trade.responseMessage && (
        <Alert className="mt-4">
          <AlertDescription>
            <span className="font-medium">Response note:</span> {trade.responseMessage}
          </AlertDescription>
        </Alert>
      )}

      {trade.status === 'accepted' && (
        <div className="mt-4 text-sm text-muted-foreground">
          Awaiting commissioner approval.
        </div>
      )}

      {trade.status === 'approved' && (
        <div className="mt-4 text-sm text-green-600">
          Approved by commissioner.
        </div>
      )}

      {canAct && (
        <div className="mt-4 flex flex-wrap gap-2">
          {trade.recipientTeamId === viewerTeamId && (
            <>
              <Button size="sm" onClick={() => onAction(trade.id, "accept")}>
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(trade.id, "decline", "Add an optional note for the proposer")}
              >
                Decline
              </Button>
            </>
          )}
          {trade.proposerTeamId === viewerTeamId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(trade.id, "cancel", "Add a note about why you're cancelling (optional)")}
            >
              Cancel Proposal
            </Button>
          )}
        </div>
      )}

      {canApprove && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onAction(trade.id, "approve", "Send a note with your approval (optional)")}
          >
            Approve Trade
          </Button>
        </div>
      )}
    </div>
  );
}

interface CommissionerTradeListProps {
  trades: Trade[];
  loading: boolean;
  onAction: (tradeId: string, action: "approve", promptLabel?: string) => Promise<void>;
}

function CommissionerTradeList({ trades, loading, onAction }: CommissionerTradeListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commissioner Approvals</CardTitle>
        <CardDescription>Trades that have been accepted by teams and are waiting for approval.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading trades...</span>
          </div>
        ) : trades.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No trades are awaiting approval.
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                viewerTeamId={null}
                onAction={onAction}
                isAdmin
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

