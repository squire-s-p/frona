"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { resetPasswordAction } from "@/app/auth/actions";
import Link from "next/link";

const initialState = {
  error: null,
  success: null,
};

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const [state, dispatch, isPending] = useActionState(resetPasswordAction as any, initialState);

  if (state?.success) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Пароль змінено!</h2>
        <p className="text-sm text-muted-foreground">
          Ваш пароль було успішно оновлено. Тепер ви можете увійти з новим паролем.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Увійти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <form action={dispatch} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Новий пароль</div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Підтвердіть пароль</div>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="bg-background"
            placeholder="••••••••"
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
            "Змінити пароль"
          )}
        </Button>
      </form>
    </div>
  );
}
