/**
 * Monobank API Client
 * Documentation: https://api.monobank.ua/docs/
 */

const MONO_API_URL = "https://api.monobank.ua";

export interface MonoAccount {
    id: string;
    sendId: string;
    balance: number;
    creditLimit: number;
    type: string;
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
}

export interface MonoStatementItem {
    id: string;
    time: number;
    description: string;
    mcc: number;
    originalMcc: number;
    hold: boolean;
    amount: number;
    operationAmount: number;
    currencyCode: number;
    commissionRate: number;
    cashbackAmount: number;
    balance: number;
    comment?: string;
    receiptId?: string;
    invoiceId?: string;
    counterEdrpou?: string;
    counterIban?: string;
}

class MonobankClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${MONO_API_URL}${endpoint}`, {
            ...options,
            headers: {
                "X-Token": this.token,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ errorDescription: "Unknown error" }));
            throw new Error(`Monobank API error: ${error.errorDescription || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Отримати інформацію про клієнта та його рахунки
     */
    async getClientInfo(): Promise<MonoClientInfo> {
        return this.request<MonoClientInfo>("/personal/client-info");
    }

    /**
     * Отримати виписку за певний період
     * @param accountId ID рахунку (або "0" для дефолтного)
     * @param from Unixtime початку періоду
     * @param to Unixtime кінця періоду (за замовчуванням - зараз)
     */
    async getStatements(accountId: string, from: number, to?: number): Promise<MonoStatementItem[]> {
        const toParam = to ? `/${to}` : "";
        return this.request<MonoStatementItem[]>(`/personal/statement/${accountId}/${from}${toParam}`);
    }

    /**
     * Отримати курси валют
     */
    async getCurrencyRates(): Promise<MonoCurrencyInfo[]> {
        return this.request<MonoCurrencyInfo[]>("/bank/currency");
    }
}

export interface MonoCurrencyInfo {
    currencyCodeA: number; // Наприклад 840 (USD)
    currencyCodeB: number; // Наприклад 980 (UAH)
    date: number;
    rateSell: number;
    rateBuy: number;
    rateCross: number;
}

/**
 * Ініціалізація клієнта з перевіркою токена
 */
export function getMonobankClient(customToken?: string) {
    const token = customToken || process.env.MONOBANK_API_TOKEN;
    if (!token) {
        throw new Error("Monobank API token is not specified");
    }
    return new MonobankClient(token);
}
