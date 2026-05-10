"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { verifyEmailAction } from "./actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [status, setStatus] = React.useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMsg("Посилання недійсне — відсутні параметри.");
      return;
    }

    verifyEmailAction(token, email).then((res) => {
      if (res.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Помилка верифікації");
      }
    }).catch(() => {
      setStatus("error");
      setErrorMsg("Сталася помилка. Спробуйте пізніше.");
    });
  }, [token, email]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Image src="/logo.svg" alt="Frona" width={64} height={64} className="brightness-0 invert" />
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Підтвердження пошти...</p>
          </div>
        )}

        {status === "ok" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <h1 className="text-2xl font-bold">Пошту підтверджено!</h1>
            <p className="text-muted-foreground">Тепер можете увійти в акаунт.</p>
            <Button onClick={() => router.push("/login")} className="mt-2">
              Увійти
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-14 w-14 text-destructive" />
            <h1 className="text-2xl font-bold">Помилка верифікації</h1>
            <p className="text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" onClick={() => router.push("/login")}>
              На сторінку входу
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
