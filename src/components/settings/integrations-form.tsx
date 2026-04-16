"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Webhook, Plus, AlertCircle, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { signIn } from "next-auth/react";
import { BankConnectWidget } from "@/modules/bank/BankConnectWidget";
import { disconnectMonobankAccounts } from "@/modules/bank/bank.actions";
import { disconnectGoogleAction } from "@/app/dashboard/settings/actions";

export function IntegrationsForm({ 
  isMonoConnected, 
  isGoogleConnected 
}: { 
  isMonoConnected?: boolean;
  isGoogleConnected?: boolean;
}) {
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isGoogleDisconnecting, setIsGoogleDisconnecting] = React.useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    const res = await disconnectMonobankAccounts();
    setIsDisconnecting(false);
    
    if (res.success) {
      toast.success("Monobank успішно відключено");
    } else {
      toast.error(res.error || "Помилка при відключенні");
    }
  };

  const handleGoogleDisconnect = async () => {
    setIsGoogleDisconnecting(true);
    const res = await disconnectGoogleAction();
    setIsGoogleDisconnecting(false);
    
    if (res.success) {
      toast.success(res.success);
    } else {
      toast.error(res.error || "Помилка при відключенні");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden text-card-foreground">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl">Інтеграції</CardTitle>
          <CardDescription>
            Підключіть сторонні сервіси для автоматизації ваших фінансів
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Monobank */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Monobank (Основне)
            </h3>
            
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-background/50">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    Monobank API
                    {isMonoConnected && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Активно</span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Автоматична синхронізація транзакцій по карткам
                  </p>
                </div>
                <div>
                  {isMonoConnected ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={isDisconnecting} variant="destructive" className="rounded-xl h-9">
                          {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Відключити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Відключити Monobank?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Усі підключені рахунки та транзакції банку будуть видалені (внутрішні фінансові дані залишаться незмінними).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisconnect} className={buttonVariants({ variant: "destructive", className: "rounded-xl" })}>
                            Відключити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <BankConnectWidget useEnvToken={false} onConnected={() => toast.success("Monobank успішно підключено!")} />
                  )}
                </div>
              </div>
            </div>
            
            {!isMonoConnected && (
              <div className="p-4 border border-dashed rounded-xl bg-muted/5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Для підключення перейдіть до <a href="https://api.monobank.ua/" target="_blank" rel="noreferrer" className="text-primary hover:underline">api.monobank.ua</a>, створіть персональний токен і вставте його сюди при підключенні.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator border-dashed className="opacity-50" />

          {/* Google Calendar */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Google Calendar
            </h3>
            
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-background/50">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    Google API
                    {isGoogleConnected && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Активно</span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Синхронізація подій, завдань та таймерів з календарем
                  </p>
                </div>
                <div>
                  {isGoogleConnected ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={isGoogleDisconnecting} variant="destructive" className="rounded-xl h-9">
                          {isGoogleDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Відключити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Відключити Google Calendar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Існуючі імпортовані події збережуться, але автоматична синхронізація зупиниться.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={handleGoogleDisconnect} className={buttonVariants({ variant: "destructive", className: "rounded-xl" })}>
                            Відключити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      onClick={() => signIn("google", 
                        { callbackUrl: "/dashboard/settings" }, 
                        { 
                          prompt: "consent", 
                          access_type: "offline", 
                          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly" 
                        }
                      )} 
                      variant="outline" 
                      className="rounded-xl h-9"
                    >
                      Підключити
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {!isGoogleConnected && (
              <div className="p-4 border border-dashed rounded-xl bg-muted/5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Підключивши Google, ви зможете автоматично експортувати тайм-трекер та завдання в свій календар, а також переглядати події з нього прямо в дашборді.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator border-dashed className="opacity-50" />

          {/* Webhooks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks (Додаткові API)
              </h3>
              <Button onClick={() => toast.info("Можливість створення Webhook в розробці")} size="sm" variant="secondary" className="h-8 rounded-lg text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Додати Webhook
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground block max-w-xl">
              Налаштуйте URL адреси, на які будуть автоматично надсилатися POST запити при певних подіях в системі (наприклад, надходження оплати).
            </div>
            
            <div className="text-sm text-muted-foreground/60 italic text-center p-6 border border-dashed rounded-xl mt-4">
              Вебхуки поки що не налаштовані
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
