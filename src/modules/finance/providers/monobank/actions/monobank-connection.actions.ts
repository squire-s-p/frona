"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/require-user";
import { encryptToken } from "@/modules/bank/bank.crypto";
import { MonoBankService } from "@/modules/bank/bank.service";
import { mapMonoAccountMeta, buildAccountName } from "@/modules/bank/bank.mapper";
import { ensureFinanceAccount } from "@/modules/bank/bank.bridge";
import { upsertBankAccount } from "@/modules/bank/bank.repository";
import { importMonthChunk } from "@/modules/bank/bank.sync";
import {
  createAuthRequest,
  checkAuthRequest,
  isProviderApiConfigured,
} from "../server/monobank-auth";
import { nextStatus } from "../lib/connection-state";
import type {
  BankConnectionStatusEnum,
  CreateAuthSessionResult,
  PollConnectionResult,
  FinalizeConnectionResult,
} from "../types";
import { CONNECTION_EXPIRY_MINUTES } from "../types";

export async function isProviderAuthAvailable(): Promise<boolean> {
  return isProviderApiConfigured();
}

export async function getBankConnections(): Promise<
  {
    id: string;
    provider: string;
    status: BankConnectionStatusEnum;
    connectedAt: Date | null;
    failedAt: Date | null;
    failureReason: string | null;
    lastSyncAt: Date | null;
    createdAt: Date;
  }[]
> {
  const user = await requireUser();
  const { prisma } = await import("@/lib/prisma");
  return prisma.bankConnection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      status: true,
      connectedAt: true,
      failedAt: true,
      failureReason: true,
      lastSyncAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAuthSession(): Promise<
  | { success: true; data: CreateAuthSessionResult }
  | { success: false; error: string }
> {
  const user = await requireUser();

  try {
    const { tokenRequestId, qrLink, deeplink, qrDataUrl } =
      await createAuthRequest();

    const expiresAt = new Date(
      Date.now() + CONNECTION_EXPIRY_MINUTES * 60 * 1000
    );

    const { prisma } = await import("@/lib/prisma");
    const connection = await prisma.bankConnection.create({
      data: {
        userId: user.id,
        provider: "monobank",
        status: "WAITING_CONFIRMATION",
        tokenRequestId,
        qrLink,
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        connectionId: connection.id,
        tokenRequestId,
        qrLink,
        deeplink,
        qrDataUrl,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function pollConnectionStatus(
  connectionId: string
): Promise<
  | { success: true; data: PollConnectionResult }
  | { success: false; error: string }
> {
  const user = await requireUser();

  try {
    const { prisma } = await import("@/lib/prisma");
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        userId: true,
        status: true,
        tokenRequestId: true,
        expiresAt: true,
      },
    });

    if (!connection || connection.userId !== user.id) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.status === "CONNECTED") {
      return {
        success: true,
        data: { status: "CONNECTED", tokenRequestId: connection.tokenRequestId ?? "" },
      };
    }

    if (connection.status === "FAILED" || connection.status === "EXPIRED") {
      return {
        success: true,
        data: { status: connection.status, tokenRequestId: connection.tokenRequestId ?? "" },
      };
    }

    if (!connection.tokenRequestId) {
      return { success: false, error: "No auth request in progress" };
    }

    if (connection.expiresAt && connection.expiresAt < new Date()) {
      const newStatus = nextStatus(connection.status as BankConnectionStatusEnum, "auth_expired");
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: { status: newStatus, failedAt: new Date(), failureReason: "Auth session expired" },
      });
      return {
        success: true,
        data: { status: "EXPIRED", tokenRequestId: connection.tokenRequestId },
      };
    }

    const authResult = await checkAuthRequest(connection.tokenRequestId);

    switch (authResult.status) {
      case "pending":
        return {
          success: true,
          data: { status: "WAITING_CONFIRMATION", tokenRequestId: connection.tokenRequestId },
        };

      case "granted": {
        const encryptedToken = encryptToken(authResult.token);
        const newStatus = nextStatus(
          connection.status as BankConnectionStatusEnum,
          "auth_confirmed"
        );

        await prisma.bankConnection.update({
          where: { id: connectionId },
          data: {
            status: newStatus,
            accessToken: encryptedToken,
            connectedAt: new Date(),
          },
        });

        return {
          success: true,
          data: { status: "CONNECTED", tokenRequestId: connection.tokenRequestId },
        };
      }

      case "denied": {
        const newStatus = nextStatus(
          connection.status as BankConnectionStatusEnum,
          "auth_denied"
        );
        await prisma.bankConnection.update({
          where: { id: connectionId },
          data: {
            status: newStatus,
            failedAt: new Date(),
            failureReason: "User denied access",
          },
        });
        return {
          success: true,
          data: { status: "FAILED", tokenRequestId: connection.tokenRequestId },
        };
      }

      case "expired": {
        const newStatus = nextStatus(
          connection.status as BankConnectionStatusEnum,
          "auth_expired"
        );
        await prisma.bankConnection.update({
          where: { id: connectionId },
          data: {
            status: newStatus,
            failedAt: new Date(),
            failureReason: "Auth request expired",
          },
        });
        return {
          success: true,
          data: { status: "EXPIRED", tokenRequestId: connection.tokenRequestId },
        };
      }

      default:
        return {
          success: true,
          data: { status: "WAITING_CONFIRMATION", tokenRequestId: connection.tokenRequestId },
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function finalizeConnection(
  connectionId: string
): Promise<FinalizeConnectionResult> {
  const user = await requireUser();

  try {
    const { prisma } = await import("@/lib/prisma");
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        userId: true,
        status: true,
        accessToken: true,
      },
    });

    if (!connection || connection.userId !== user.id) {
      return { success: false, connectionId, accountsCreated: 0, error: "Connection not found" };
    }

    if (connection.status !== "CONNECTED" || !connection.accessToken) {
      return {
        success: false,
        connectionId,
        accountsCreated: 0,
        error: "Connection not in CONNECTED state",
      };
    }

    const { decryptToken } = await import("@/modules/bank/bank.crypto");
    const plainToken = decryptToken(connection.accessToken);
    const service = new MonoBankService(plainToken);
    const clientInfo = await service.getClientInfo();

    let accountsCreated = 0;

    for (const monoAccount of clientInfo.accounts) {
      const meta = mapMonoAccountMeta(monoAccount);

      await upsertBankAccount(user.id, {
        ...meta,
        monoToken: connection.accessToken,
        name: buildAccountName(monoAccount),
        bankConnectionId: connectionId,
      });

      const currency =
        monoAccount.currencyCode === 980
          ? "UAH"
          : monoAccount.currencyCode === 840
            ? "USD"
            : monoAccount.currencyCode === 978
              ? "EUR"
              : "UAH";

      await ensureFinanceAccount(user.id, monoAccount.id, {
        name: buildAccountName(monoAccount),
        currency,
        balance: Number(monoAccount.balance) / 100,
        type: monoAccount.type,
      });

      accountsCreated++;
    }

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/settings");

    return { success: true, connectionId, accountsCreated };
  } catch (err) {
    return {
      success: false,
      connectionId,
      accountsCreated: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function startInitialSync(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();

  try {
    const { prisma } = await import("@/lib/prisma");
    const accounts = await prisma.bankAccount.findMany({
      where: { bankConnectionId: connectionId, userId: user.id },
      select: { id: true },
    });

    for (const account of accounts) {
      for (let month = 0; month < 12; month++) {
        const result = await importMonthChunk(account.id, month);
        if (!result.ok && "rateLimited" in result) {
          return { success: false, error: "Rate limited — sync will continue automatically" };
        }
        if (!result.ok) {
          return { success: false, error: result.error };
        }
        if (result.ok && result.done) break;
      }
    }

    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function disconnectBankConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();

  try {
    const { prisma } = await import("@/lib/prisma");
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
      select: { userId: true },
    });

    if (!connection || connection.userId !== user.id) {
      return { success: false, error: "Connection not found" };
    }

    await prisma.bankConnection.delete({ where: { id: connectionId } });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
