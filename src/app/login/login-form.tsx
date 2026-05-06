"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const TOAST_ERROR = {
  className: "border border-destructive/30 bg-destructive/10 text-destructive",
  descriptionClassName: "text-destructive/90",
  duration: 12000,
} as const;

const TOAST_NEUTRAL = {
  duration: 9000,
} as const;

function errorMessage(error: string | null) {
  if (!error) return null;

  if (error === "OAuthAccountNotLinked") return "Цей email уже зареєстрований іншим способом.";
  if (error === "AccessDenied") return "Доступ заборонено.";
  if (error === "Configuration") return "Помилка конфігурації автентифікації.";
  if (error === "CredentialsSignin") return "Невірний email або пароль.";

  return "Не вдалося увійти. Спробуйте ще раз.";
}

export default function LoginForm({
  callbackUrl,
  error,
  registered,
}: {
  callbackUrl: string;
  error: string | null;
  registered?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const shownRegisteredToast = React.useRef(false);
  const shownErrorToast = React.useRef(false);

  // ✅ нейтральний toast після реєстрації (не зелений)
  React.useEffect(() => {
    if (!registered) return;
    if (shownRegisteredToast.current) return;
    shownRegisteredToast.current = true;

    toast("Акаунт створено", {
      description: "Тепер увійдіть за допомогою email і пароля.",
      ...TOAST_NEUTRAL,
    });

    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("registered");
    const qs = sp.toString();
    router.replace(qs ? `/login?${qs}` : "/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registered]);

  // ✅ error з URL — червоний toast + прибираємо параметр
  React.useEffect(() => {
    const msg = errorMessage(error);
    if (!msg) return;
    if (shownErrorToast.current) return;
    shownErrorToast.current = true;

    toast.error("Помилка входу", {
      description: msg,
      ...TOAST_ERROR,
    });

    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("error");
    const qs = sp.toString();
    router.replace(qs ? `/login?${qs}` : "/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();

    const eTrim = email.trim().toLowerCase();
    if (!eTrim || !password) {
      toast.error("Перевірте поля", {
        description: "Введіть email і пароль.",
        ...TOAST_ERROR,
      });
      return;
    }

    setPending(true);
    const res = await signIn("credentials", {
      email: eTrim,
      password,
      callbackUrl,
      redirect: false,
    });
    setPending(false);

    if (res?.error) {
      toast.error("Помилка входу", {
        description: errorMessage(res.error) ?? "Не вдалося увійти.",
        ...TOAST_ERROR,
      });
      return;
    }

    if (res?.url) {
      window.location.href = res.url;
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex size-20 items-center justify-center overflow-hidden">
            <Image src="/logo.svg" alt="Frona Logo" width={80} height={80} className="size-full object-contain brightness-0 invert" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Ласкаво просимо до Frona</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Перейдіть до вашої панелі керування
          </p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={onEmailLogin}>
          <div className="space-y-2">
            <div className="text-sm font-medium">Email</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Пароль</div>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Забули пароль?
              </Link>
            </div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Вхід..." : "Увійти"}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Немає облікового запису?{" "}
            <Link className="underline underline-offset-4" href="/auth/register">
              Створити
            </Link>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">Або</span>
          <Separator className="flex-1" />
        </div>

        <div className="grid gap-2">
          <Button
            variant="outline"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Продовжити з Google
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Натискаючи «Продовжити», ви погоджуєтеся з нашими{" "}
          <Link className="underline underline-offset-4" href="/terms">
            Умовами надання послуг
          </Link>{" "}
          та{" "}
          <Link className="underline underline-offset-4" href="/privacy">
            Політикою конфіденційності
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
