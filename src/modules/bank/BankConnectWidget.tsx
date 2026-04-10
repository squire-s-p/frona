"use client";

// ─── BankConnectWidget.tsx ────────────────────────────────────────────────────
// UI for connecting Monobank and monitoring sync status.
// Does NOT call Monobank API directly — all logic goes through server actions.

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock, Wifi, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    validateMonobankToken,
    connectMonobank,
    importBankChunk,
    refreshBankAccount,
    getBankAccounts,
    autoInitFromEnv,
} from "@/modules/bank/bank.actions";
import type { BankAccountRecord } from "@/modules/bank/bank.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportState =
    | { phase: "idle" }
    | { phase: "validating" }
    | { phase: "connecting" }
    | { phase: "importing"; month: number; total: number; inserted: number }
    | { phase: "rate_limited"; month: number; waitSeconds: number }
    | { phase: "done"; totalInserted: number }
    | { phase: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

/** Monobank rate limit: 1 statement request per 60 seconds */
const RATE_LIMIT_WAIT_S = 62;
const TOTAL_MONTHS = 12;

// ─── Main Widget ──────────────────────────────────────────────────────────────

interface BankConnectWidgetProps {
    onConnected?: () => void;
    /** If true — uses MONOBANK_API_TOKEN from env (single-user mode). No token dialog. */
    useEnvToken?: boolean;
}

export function BankConnectWidget({ onConnected, useEnvToken = true }: BankConnectWidgetProps) {
    const [open, setOpen] = useState(false);
    const [token, setToken] = useState("");
    const [state, setState] = useState<ImportState>({ phase: "idle" });
    const [countdown, setCountdown] = useState(0);
    const [_, startTransition] = useTransition();

    // ─── Single-click auto-init (env token mode) ──────────────────────────────

    const handleAutoInit = async () => {
        setState({ phase: "connecting" });
        setOpen(true);

        const initResult = await autoInitFromEnv();
        if (!initResult.success) {
            setState({ phase: "error", message: initResult.error ?? "Помилка ініціалізації" });
            return;
        }

        if (initResult.created === 0) {
            // Already initialized — just trigger import
            const accounts = await getBankAccounts();
            if (accounts.length > 0) {
                await runImport(accounts[0].id, 0);
            } else {
                setState({ phase: "error", message: "Рахунки не знайдені" });
            }
            return;
        }

        // New accounts — run full import
        const accounts = await getBankAccounts();
        if (accounts.length === 0) {
            setState({ phase: "error", message: "Рахунки не знайдені після ініціалізації" });
            return;
        }
        await runImport(accounts[0].id, 0);
    };

    const handleConnect = async () => {
        if (!token.trim()) return;

        // Step 1: Validate token
        setState({ phase: "validating" });
        const validation = await validateMonobankToken(token.trim());
        if (!validation.valid) {
            setState({ phase: "error", message: validation.error ?? "Invalid token" });
            return;
        }

        // Step 2: Connect (store accounts)
        setState({ phase: "connecting" });
        const connectResult = await connectMonobank(token.trim());
        if (!connectResult.success) {
            setState({ phase: "error", message: connectResult.error ?? "Connection failed" });
            return;
        }

        // Step 3: Get the first account to import
        const accounts = await getBankAccounts();
        if (accounts.length === 0) {
            setState({ phase: "error", message: "No accounts found" });
            return;
        }

        await runImport(accounts[0].id, 0);
    };

    const runImport = async (accountId: string, startMonth: number) => {
        let totalInserted = 0;

        for (let month = startMonth; month < TOTAL_MONTHS; month++) {
            setState({
                phase: "importing",
                month: month + 1,
                total: TOTAL_MONTHS,
                inserted: totalInserted,
            });

            const result = await importBankChunk(accountId, month);

            if (!result.ok) {
                if ("rateLimited" in result) {
                    // Wait and retry this month
                    await waitWithCountdown(RATE_LIMIT_WAIT_S, month);
                    month--; // retry same month
                    continue;
                }
                setState({ phase: "error", message: result.error });
                return;
            }

            totalInserted += result.inserted;

            if (result.done) {
                setState({ phase: "done", totalInserted });
                onConnected?.();
                return;
            }

            // Wait 62s before next month (Monobank rate limit)
            if (month < TOTAL_MONTHS - 1) {
                await waitWithCountdown(RATE_LIMIT_WAIT_S, month + 1);
            }
        }

        setState({ phase: "done", totalInserted });
        onConnected?.();
    };

    const waitWithCountdown = (seconds: number, month: number): Promise<void> => {
        return new Promise(resolve => {
            setState({ phase: "rate_limited", month: month + 1, waitSeconds: seconds });
            setCountdown(seconds);

            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        resolve();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });
    };

    const isRunning = state.phase === "importing" ||
        state.phase === "validating" ||
        state.phase === "connecting" ||
        state.phase === "rate_limited";

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={useEnvToken ? handleAutoInit : () => setOpen(true)}
                className="gap-2"
                disabled={state.phase !== "idle" && state.phase !== "error" && state.phase !== "done"}
            >
                {useEnvToken ? <Zap className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                {useEnvToken ? "Імпорт Monobank" : "Підключити Monobank"}
            </Button>

            <Dialog open={open} onOpenChange={v => { if (!isRunning) setOpen(v); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Підключення Monobank</DialogTitle>
                        <DialogDescription>
                            Введіть ваш персональний токен з{" "}
                            <a
                                href="https://api.monobank.ua"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                            >
                                api.monobank.ua
                            </a>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        {/* Token input */}
                        {(state.phase === "idle" || state.phase === "error") && (
                            <div className="space-y-3">
                                <Input
                                    type="password"
                                    placeholder="u...X (токен Monobank)"
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleConnect()}
                                />
                                {state.phase === "error" && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {state.message}
                                    </div>
                                )}
                                <Button
                                    onClick={handleConnect}
                                    disabled={!token.trim()}
                                    className="w-full"
                                >
                                    Підключити та імпортувати
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Повний імпорт за 12 місяців займе ~13 хвилин<br />
                                    (обмеження Monobank API: 1 запит/хвилину)
                                </p>
                            </div>
                        )}

                        {/* Validating */}
                        {state.phase === "validating" && (
                            <StatusRow icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Перевірка токена..." />
                        )}

                        {/* Connecting */}
                        {state.phase === "connecting" && (
                            <StatusRow icon={<Loader2 className="h-4 w-4 animate-spin" />} text="Збереження рахунків..." />
                        )}

                        {/* Importing */}
                        {state.phase === "importing" && (
                            <div className="space-y-3">
                                <StatusRow
                                    icon={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    text={`Імпорт місяця ${state.month} з ${state.total}...`}
                                />
                                <Progress value={((state.month - 1) / state.total) * 100} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    Завантажено: <strong>{state.inserted}</strong> транзакцій
                                </p>
                            </div>
                        )}

                        {/* Rate limited — waiting */}
                        {state.phase === "rate_limited" && (
                            <div className="space-y-3">
                                <StatusRow
                                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                                    text={`Зачекайте ${countdown}с перед місяцем ${state.month}...`}
                                    className="text-amber-600"
                                />
                                <Progress value={(countdown / RATE_LIMIT_WAIT_S) * 100} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    Обмеження Monobank API: 1 запит виписки на хвилину
                                </p>
                            </div>
                        )}

                        {/* Done */}
                        {state.phase === "done" && (
                            <div className="space-y-3 text-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                                <p className="font-medium">Імпорт завершено!</p>
                                <p className="text-sm text-muted-foreground">
                                    Збережено <strong>{state.totalInserted}</strong> транзакцій за 12 місяців
                                </p>
                                <Button onClick={() => setOpen(false)} className="w-full">
                                    Готово
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Per-account Sync Status Card ─────────────────────────────────────────────

interface BankAccountSyncCardProps {
    account: BankAccountRecord;
    onRefreshed?: () => void;
}

export function BankAccountSyncCard({ account, onRefreshed }: BankAccountSyncCardProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ inserted?: number; rateLimited?: boolean } | null>(null);

    const handleRefresh = () => {
        startTransition(async () => {
            const res = await refreshBankAccount(account.id);
            setResult(res);
            if (res.success) onRefreshed?.();
        });
    };

    const importReady = !!account.importDoneAt;
    const lastSync = account.lastSyncAt ? new Date(account.lastSyncAt) : null;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{account.name}</span>
                    {importReady ? (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            синхр.
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            потрібен імпорт
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {lastSync
                        ? `Оновлено: ${formatRelative(lastSync)}`
                        : "Ще не синхронізовано"}
                    {result?.rateLimited && (
                        <span className="text-amber-500 ml-2">• ліміт API, спробуйте за 1 хв</span>
                    )}
                    {result?.inserted !== undefined && result.inserted > 0 && (
                        <span className="text-emerald-500 ml-2">• +{result.inserted} нових</span>
                    )}
                </p>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRefresh}
                disabled={isPending || !importReady}
                title={importReady ? "Оновити" : "Спочатку завершіть повний імпорт"}
            >
                <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            </Button>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusRow({
    icon,
    text,
    className,
}: {
    icon: React.ReactNode;
    text: string;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-3 text-sm", className)}>
            {icon}
            <span>{text}</span>
        </div>
    );
}

function formatRelative(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "щойно";
    if (diffMin < 60) return `${diffMin} хв тому`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} год тому`;
    return date.toLocaleDateString("uk-UA");
}
