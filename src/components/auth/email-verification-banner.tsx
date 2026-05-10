"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Mail } from "lucide-react";
import { resendVerificationEmailAction } from "@/app/auth/register/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [sending, setSending] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  const email = session?.user?.email;
  const verified = session?.user?.emailVerified;

  if (!email || verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await resendVerificationEmailAction(email);
      if (res.alreadyVerified) {
        toast.success("Пошту вже підтверджено. Оновіть сторінку.");
      } else {
        toast.success("Лист надіслано повторно");
      }
    } catch {
      toast.error("Не вдалося надіслати лист");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-3 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-700 dark:text-amber-400">Підтвердіть пошту</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {email}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-xs gap-1.5"
            onClick={handleResend}
            disabled={sending}
          >
            <Mail className="h-3 w-3" />
            {sending ? "Надсилаємо..." : "Надіслати повторно"}
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground text-xs"
          aria-label="Закрити"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
