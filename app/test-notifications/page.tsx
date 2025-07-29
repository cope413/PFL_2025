"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TestNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [notificationType, setNotificationType] = useState("welcome");
  const [targetUserId, setTargetUserId] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Test data for different notification types
  const [testData, setTestData] = useState({
    week: 1,
    record: "2-1",
    points: 125.5,
    rank: 3,
    fromTeam: "Dino Destroyers",
    players: ["Patrick Mahomes", "Christian McCaffrey"],
    opponent: "T-Rex Titans",
    playerName: "Aaron Rodgers",
    team: "NYJ",
    injury: "Achilles tendon rupture",
    resetLink: "https://pfl.com/reset-password?token=test123"
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  const handleSendNotification = async () => {
    if (!targetUserId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      let data = {};
      switch (notificationType) {
        case 'welcome':
          data = {};
          break;
        case 'weeklyRecap':
          data = {
            week: testData.week,
            record: testData.record,
            points: testData.points,
            rank: testData.rank
          };
          break;
        case 'tradeOffer':
          data = {
            fromTeam: testData.fromTeam,
            players: testData.players
          };
          break;
        case 'matchupReminder':
          data = {
            opponent: testData.opponent,
            week: testData.week
          };
          break;
        case 'injuryAlert':
          data = {
            playerName: testData.playerName,
            team: testData.team,
            injury: testData.injury
          };
          break;
        case 'passwordReset':
          data = {
            resetLink: testData.resetLink
          };
          break;
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: notificationType,
          userId: targetUserId,
          data
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Email Notifications</h1>
            <p className="text-muted-foreground">Send test email notifications to users</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Test Notification
            </CardTitle>
            <CardDescription>
              Send a test email notification to verify the email system is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notificationType">Notification Type</Label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="weeklyRecap">Weekly Recap</SelectItem>
                    <SelectItem value="tradeOffer">Trade Offer</SelectItem>
                    <SelectItem value="matchupReminder">Matchup Reminder</SelectItem>
                    <SelectItem value="injuryAlert">Injury Alert</SelectItem>
                    <SelectItem value="passwordReset">Password Reset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetUserId">Target User ID</Label>
                <Input
                  id="targetUserId"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user ID to send notification to"
                />
              </div>
            </div>

            <Button 
              onClick={handleSendNotification} 
              disabled={loading || !targetUserId}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Sending...' : 'Send Test Notification'}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p><strong>Note:</strong> Make sure you have configured SMTP settings in your environment variables:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>SMTP_HOST (e.g., smtp.gmail.com)</li>
                <li>SMTP_PORT (e.g., 587)</li>
                <li>SMTP_USER (your email address)</li>
                <li>SMTP_PASS (your email password or app password)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 