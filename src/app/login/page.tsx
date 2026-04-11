import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import LoginForm from "./login-form";

type SP = {
  callbackUrl?: string;
  error?: string;
  registered?: string;
};

export default async function LoginPage(props: { searchParams: Promise<SP> }) {
  const session = await getAuthSession();

  const sp = await props.searchParams;
  const callbackUrl = sp?.callbackUrl ?? "/dashboard";
  const error = sp?.error ?? null;

  const registered = sp?.registered === "1";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <Suspense fallback={<div>Завантаження...</div>}>
          <LoginForm callbackUrl={callbackUrl} error={error} registered={registered} />
        </Suspense>
      </div>
    </div>
  );
}
