"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordAction } from "@/app/auth/actions";

const initialState = {
  error: null,
  success: null,
};

export function ForgotPasswordForm() {
  const [state, dispatch, isPending] = useActionState(forgotPasswordAction as any, initialState);

  if (state?.success) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Перевірте пошту</h2>
        <p className="text-sm text-muted-foreground">
          Ми надіслали посилання для відновлення пароля на вашу адресу. 
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <form action={dispatch} className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Електронна пошта</div>
          <Input
            id="email"
            name="email"
            placeholder="m@example.com"
            type="email"
            autoComplete="email"
            required
            className="bg-background"
          />
        </div>
        
        {state?.error && (
          <p className="text-xs text-destructive font-medium">{state.error}</p>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Надіслати посилання"
          )}
        </Button>
      </form>
    </div>
  );
}
