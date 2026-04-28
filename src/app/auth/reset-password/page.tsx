import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Новий пароль | Frona",
  description: "Введіть новий пароль для вашого акаунта.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-destructive font-medium border border-destructive/30 bg-destructive/10 p-4 rounded-xl">
          Помилка: Токен або email відсутні в посиланні.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="Frona Logo" className="size-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Новий пароль</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Встановіть новий надійний пароль для вашого акаунта
            </p>
          </div>
          
          <ResetPasswordForm token={token} email={email} />
        </div>
      </div>
    </div>
  );
}
