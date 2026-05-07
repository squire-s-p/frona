// NOTE: FinanceProvider is unused until multi-provider support is implemented
export interface FinanceProvider {
  connect(userId: string): Promise<void>;
  syncAccounts(connectionId: string): Promise<void>;
  syncTransactions(connectionId: string): Promise<void>;
}
