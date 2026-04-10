// ─── bank.types.ts ───────────────────────────────────────────────────────────
// All types for the bank sync module.
// Finance module must NOT import from here — use its own domain types.

// ── Monobank API raw types ────────────────────────────────────────────────────

export interface MonoStatementItem {
    id: string;
    time: number;           // unix timestamp
    description: string;
    mcc: number;
    originalMcc: number;
    hold: boolean;
    amount: number;         // kopecks (negative = expense)
    operationAmount: number;
    currencyCode: number;   // ISO 4217 numeric
    commissionRate: number;
    cashbackAmount: number;
    balance: number;
    comment?: string;
    receiptId?: string;
    invoiceId?: string;
    counterEdrpou?: string;
    counterIban?: string;
}

export interface MonoAccount {
    id: string;
    sendId: string;
    balance: number;        // kopecks
    creditLimit: number;
    type: string;           // white, black, platinum, iron, fop, yellow
    currencyCode: number;
    cashbackType: string;
    maskedPan: string[];
    iban: string;
}

export interface MonoClientInfo {
    clientId: string;
    name: string;
    webHookUrl: string;
    permissions: string;
    accounts: MonoAccount[];
    jars?: MonoJar[];
}

export interface MonoJar {
    id: string;
    sendId: string;
    title: string;
    description: string;
    currencyCode: number;
    balance: number;
    goal: number;
}

// ── Internal domain types ─────────────────────────────────────────────────────

export interface BankAccountRecord {
    id: string;
    userId: string;
    monoAccountId: string;
    name: string;
    type: string;
    currencyCode: number;
    balance: bigint;
    creditLimit: bigint;
    iban: string | null;
    maskedPan: string[];
    lastSyncAt: Date | null;
    importDoneAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // NOTE: monoToken is never included in return types — only used internally
}

export interface BankTransactionRecord {
    id: string;
    bankAccountId: string;
    monoTransactionId: string;
    time: Date;
    amount: number;
    operationAmount: number;
    currencyCode: number;
    mcc: number;
    description: string;
    comment: string | null;
    cashbackAmount: number;
    commissionRate: number;
    hold: boolean;
    receiptId: string | null;
    counterEdrpou: string | null;
    counterIban: string | null;
    raw: Record<string, unknown>;
}

// ── Sync result types ─────────────────────────────────────────────────────────

export type SyncStatus =
    | { ok: true; inserted: number; accountId: string }
    | { ok: false; rateLimited: true; accountId: string }
    | { ok: false; error: string; accountId: string };

export interface ImportProgress {
    accountId: string;
    monthIndex: number;     // 0 = latest, 11 = oldest
    totalMonths: number;
    inserted: number;
}

export interface ConnectBankInput {
    userId: string;
    monoToken: string;      // plain token — will be encrypted before storage
}
