"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BankConnectionStatusBadge } from "./bank-connection-status-badge";
import { ConnectMonobankDialog } from "./connect-monobank-dialog";
import {
  getBankConnections,
  disconnectBankConnection,
} from "../actions/monobank-connection.actions";
import type { BankConnectionStatusEnum } from "../types";

interface ConnectionItem {
  id: string;
  provider: string;
  status: BankConnectionStatusEnum;
  connectedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
}

export function BankConnectionsCard() {
  const [connections, setConnections] = React.useState<ConnectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);

  const loadConnections = React.useCallback(async () => {
    try {
      const data = await getBankConnections();
      setConnections(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnected = () => {
    setDialogOpen(false);
    loadConnections();
    toast.success("Monobank успішно підключено!");
  };

  const handleDisconnect = async (id: string) => {
    setDisconnectingId(id);
    const res = await disconnectBankConnection(id);
    setDisconnectingId(null);
    if (res.success) {
      toast.success("Підключення видалено");
      loadConnections();
    } else {
      toast.error(res.error || "Помилка при відключенні");
    }
  };

  const activeConnections = connections.filter((c) => c.status === "CONNECTED");
  const hasActive = activeConnections.length > 0;

  return (
    <>
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-none overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bank Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Завантаження...
            </div>
          )}

          {!loading && connections.length === 0 && (
            <div className="text-sm text-muted-foreground text-center p-4">
              Немає підключених банків
            </div>
          )}

          {!loading &&
            connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Monobank</span>
                    <BankConnectionStatusBadge status={conn.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {conn.connectedAt
                      ? `Підключено: ${formatDate(conn.connectedAt)}`
                      : conn.failedAt
                        ? `Помилка: ${conn.failureReason ?? "Невідома"}`
                        : "Очікує підтвердження"}
                  </p>
                </div>

                {hasActive && conn.status === "CONNECTED" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={disconnectingId === conn.id}
                      >
                        {disconnectingId === conn.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Відключити Monobank?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Усі підключені рахунки та транзакції банку будуть видалені (внутрішні фінансові дані залишаться незмінними).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisconnect(conn.id)}
                          className={buttonVariants({ variant: "destructive", className: "rounded-xl" })}
                        >
                          Відключити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}

          {!loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="w-full gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Підключити Monobank
            </Button>
          )}
        </CardContent>
      </Card>

      <ConnectMonobankDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={handleConnected}
      />
    </>
  );
}

function formatDate(date: Date): string {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
