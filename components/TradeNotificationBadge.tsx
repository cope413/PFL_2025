"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePendingTradeNotifications } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export function TradeNotificationBadge() {
  const { user } = useAuth();
  const { count } = usePendingTradeNotifications(!!user?.team);

  if (!user?.team || count === 0) {
    return null;
  }

  return (
    <Link
      href="/trades"
      className="relative flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
      title={`${count} pending trade${count !== 1 ? 's' : ''}`}
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      <Badge
        variant="destructive"
        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </Link>
  );
}


