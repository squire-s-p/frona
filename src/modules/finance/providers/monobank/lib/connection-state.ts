import type { BankConnectionStatusEnum } from "../types";

type Transition = { from: BankConnectionStatusEnum; to: BankConnectionStatusEnum };

const VALID_TRANSITIONS: Transition[] = [
  { from: "PENDING", to: "WAITING_CONFIRMATION" },
  { from: "PENDING", to: "FAILED" },
  { from: "WAITING_CONFIRMATION", to: "CONNECTED" },
  { from: "WAITING_CONFIRMATION", to: "FAILED" },
  { from: "WAITING_CONFIRMATION", to: "EXPIRED" },
  { from: "FAILED", to: "PENDING" },
  { from: "EXPIRED", to: "PENDING" },
  { from: "CONNECTED", to: "FAILED" },
];

export function canTransition(
  from: BankConnectionStatusEnum,
  to: BankConnectionStatusEnum
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function nextStatus(
  current: BankConnectionStatusEnum,
  event: "auth_created" | "auth_confirmed" | "auth_denied" | "auth_expired" | "auth_failed" | "retry"
): BankConnectionStatusEnum {
  switch (event) {
    case "auth_created":
      return current === "PENDING" ? "WAITING_CONFIRMATION" : current;
    case "auth_confirmed":
      return current === "WAITING_CONFIRMATION" ? "CONNECTED" : current;
    case "auth_denied":
    case "auth_failed":
      return current === "WAITING_CONFIRMATION" || current === "PENDING" ? "FAILED" : current;
    case "auth_expired":
      return current === "WAITING_CONFIRMATION" ? "EXPIRED" : current;
    case "retry":
      return current === "FAILED" || current === "EXPIRED" ? "PENDING" : current;
    default:
      return current;
  }
}
