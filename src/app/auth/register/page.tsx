"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { registerWithEmail } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const eTrim = email.trim().toLowerCase();
    if (!eTrim || !password) {
      toast.error("Перевірте поля", {
        description: "Введіть email і пароль (мінімум 8 символів).",
        duration: 10000,
      });
      return;
    }

    setPending(true);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", eTrim);
    fd.set("password", password);

    const res = await registerWithEmail(fd);

    setPending(false);

    if (!res.ok) {
      toast.error("Не вдалося створити акаунт", {
        description: res.message ?? "Спробуйте ще раз.",
        duration: 12000, // ✅ ще довше для помилок
      });
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border bg-background">
                <span className="text-sm font-semibold">N</span>
              </div>

              <h1 className="text-xl font-semibold">Створіть свій обліковий запис</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Вже маєте обліковий запис?{" "}
                <Link className="underline underline-offset-4" href="/login">
                  Увійти
                </Link>
              </p>
            </div>

            <form className="mt-6 space-y-3" onSubmit={onSubmit}>
              <div className="space-y-2">
                <div className="text-sm font-medium">Ім&apos;я</div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Олександр"
                  type="text"
                  autoComplete="name"
                />
              </div>

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
                <div className="text-sm font-medium">Пароль</div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>

              <Button className="w-full" type="submit" disabled={pending}>
                {pending ? "Створення..." : "Створити"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">Або</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/login?callbackUrl=/dashboard`)}
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
      </div>
    </div>
  );
}
