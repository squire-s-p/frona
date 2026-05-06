import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Відновлення пароля | Frona",
  description: "Введіть вашу електронну пошту, щоб отримати посилання для скидання пароля.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center overflow-hidden">
              <Image src="/logo.svg" alt="Frona Logo" width={80} height={80} className="size-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Забули пароль?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Введіть ваш email, і ми надішлемо вам інструкції
            </p>
          </div>
          
          <ForgotPasswordForm />
          
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Повернутися до входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
