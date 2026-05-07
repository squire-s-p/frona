"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { MonobankQRCode } from "./monobank-qr-code";
import { BankConnectionStatusBadge } from "./bank-connection-status-badge";
import {
  createAuthSession,
  pollConnectionStatus,
  finalizeConnection,
  startInitialSync,
} from "../actions/monobank-connection.actions";
import type {
  BankConnectionStatusEnum,
  CreateAuthSessionResult,
} from "../types";

type DialogPhase =
  | "idle"
  | "creating"
  | "waiting"
  | "connecting"
  | "syncing"
  | "done"
  | "error";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 200;

interface ConnectMonobankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

async function pollUntilResolved(
  connectionId: string,
  onStatus: (status: BankConnectionStatusEnum) => void,
  signal: { cancelled: boolean }
): Promise<{ status: "CONNECTED" | "FAILED" | "EXPIRED" | "TIMEOUT" }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (signal.cancelled) return { status: "EXPIRED" };

    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    if (signal.cancelled) return { status: "EXPIRED" };

    const result = await pollConnectionStatus(connectionId);
    if (!result.success) {
      return { status: "FAILED" };
    }

    const { status } = result.data;
    onStatus(status);

    if (status === "CONNECTED" || status === "FAILED" || status === "EXPIRED") {
      return { status };
    }
  }

  return { status: "TIMEOUT" };
}

export function ConnectMonobankDialog({
  open,
  onOpenChange,
  onConnected,
}: ConnectMonobankDialogProps) {
  const [phase, setPhase] = useState<DialogPhase>("idle");
  const [authData, setAuthData] = useState<CreateAuthSessionResult | null>(null);
  const [status, setStatus] = useState<BankConnectionStatusEnum>("PENDING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelRef = useRef({ cancelled: false });

  const stopPolling = useCallback(() => {
    cancelRef.current.cancelled = true;
  }, []);

  const handleStart = async () => {
    setPhase("creating");
    setErrorMessage(null);

    const result = await createAuthSession();

    if (!result.success) {
      setPhase("error");
      setErrorMessage(result.error);
      return;
    }

    setAuthData(result.data);
    setStatus("WAITING_CONFIRMATION");
    setPhase("waiting");

    cancelRef.current = { cancelled: false };

    const pollResult = await pollUntilResolved(
      result.data.connectionId,
      (s) => setStatus(s),
      cancelRef.current
    );

    if (cancelRef.current.cancelled) return;

    switch (pollResult.status) {
      case "CONNECTED": {
        setPhase("connecting");

        const finalizeResult = await finalizeConnection(result.data.connectionId);
        if (!finalizeResult.success) {
          setPhase("error");
          setErrorMessage(finalizeResult.error ?? "Помилка збереження рахунків");
          return;
        }

        setPhase("syncing");
        const syncResult = await startInitialSync(result.data.connectionId);
        if (!syncResult.success) {
          toast.warning("Синхронізація почнеться автоматично");
        }

        setPhase("done");
        onConnected?.();
        break;
      }
      case "FAILED":
        setPhase("error");
        setErrorMessage("Користувач відхилив запит на доступ");
        break;
      case "EXPIRED":
        setPhase("error");
        setErrorMessage("Сесія авторизації прострочена. Спробуйте ще раз.");
        break;
      case "TIMEOUT":
        setPhase("error");
        setErrorMessage("Час очікування вичерпано. Спробуйте ще раз.");
        break;
    }
  };

  const handleRetry = () => {
    stopPolling();
    setPhase("idle");
    setAuthData(null);
    setStatus("PENDING");
    setErrorMessage(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      stopPolling();
    }
    onOpenChange(nextOpen);
  };

  const isRunning =
    phase === "creating" || phase === "waiting" || phase === "connecting" || phase === "syncing";

  return (
    <Dialog open={open} onOpenChange={isRunning ? undefined : handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Підключити Monobank
          </DialogTitle>
          <DialogDescription>
            {phase === "idle" && "Відскануйте QR код у додатку Monobank для підключення"}
            {phase === "waiting" && "Відскануйте QR код або відкрийте посилання у додатку"}
            {phase === "connecting" && "Збереження рахунків..."}
            {phase === "syncing" && "Синхронізація транзакцій..."}
            {phase === "done" && "Підключення завершено!"}
            {phase === "error" && "Помилка підключення"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {phase === "idle" && (
            <div className="text-center space-y-4">
              <div className="p-6 border border-dashed rounded-xl bg-muted/5">
                <Smartphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Відкрийте додаток Monobank, відскануйте QR код та підтвердьте доступ
                </p>
              </div>
              <Button onClick={handleStart} className="w-full">
                Згенерувати QR код
              </Button>
            </div>
          )}

          {phase === "creating" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Створення сесії авторизації...
              </div>
              <Skeleton className="h-56 w-56 mx-auto rounded-xl" />
            </div>
          )}

          {phase === "waiting" && authData && (
            <div className="space-y-4">
              <MonobankQRCode
                qrDataUrl={authData.qrDataUrl}
                deeplink={authData.deeplink}
              />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Очікування підтвердження...
                <BankConnectionStatusBadge status={status} />
              </div>
            </div>
          )}

          {phase === "connecting" && (
            <div className="flex items-center gap-3 text-sm justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Збереження рахунків...
            </div>
          )}

          {phase === "syncing" && (
            <div className="flex items-center gap-3 text-sm justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Запуск синхронізації...
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-medium">Monobank підключено!</p>
              <p className="text-sm text-muted-foreground">
                Рахунки збережено та синхронізовано
              </p>
              <Button onClick={() => handleClose(false)} className="w-full">
                Готово
              </Button>
            </div>
          )}

          {phase === "error" && errorMessage && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Спробувати ще раз
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
