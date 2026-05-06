"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Smartphone, LogOut, Laptop, Key, Loader2, Monitor, Trash2 } from "lucide-react";
import { updatePasswordAction, revokeDeviceSessionAction, revokeAllOtherDeviceSessionsAction } from "@/app/dashboard/settings/actions";
// DeviceSession type defined locally to bypass Prisma generate issues in CI
interface DeviceSession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  lastActive: Date;
  createdAt: Date;
}

const initialPasswordState = { error: null, success: null };

interface SecurityFormProps {
  deviceSessions?: DeviceSession[];
  currentSessionId?: string;
  hasPassword?: boolean;
}

export function SecurityForm({ deviceSessions = [], currentSessionId, hasPassword = true }: SecurityFormProps) {
  const [passState, dispatchPass, isPendingPass] = useActionState(updatePasswordAction as any, initialPasswordState);
  const [isRevoking, setIsRevoking] = React.useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = React.useState(false);

  React.useEffect(() => {
    if (passState?.success) {
      toast.success(passState.success);
    }
    if (passState?.error) {
      toast.error(passState.error);
    }
  }, [passState]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-none overflow-hidden text-card-foreground">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl">Безпека</CardTitle>
          <CardDescription>
            Керуйте паролями, двофакторною автентифікацією та активними сесіями
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Change Password */}
          <form action={dispatchPass} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {hasPassword ? "Зміна паролю" : "Створення паролю"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
              {hasPassword && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium px-1">Поточний пароль</Label>
                  <Input name="currentPassword" type="password" required placeholder="••••••••" className="rounded-xl h-11 bg-background/50 focus:bg-background" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium px-1">Новий пароль</Label>
                <Input name="newPassword" type="password" required placeholder="••••••••" className="rounded-xl h-11 bg-background/50 focus:bg-background" />
              </div>
              <Button type="submit" disabled={isPendingPass} className="rounded-xl h-11" variant="secondary">
                {isPendingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {hasPassword ? "Оновити пароль" : "Створити пароль"}
              </Button>
            </div>
            {!hasPassword && (
              <p className="text-xs text-muted-foreground pt-1">
                Ваш акаунт створено через Google. Ви можете встановити пароль, щоб в майбутньому мати можливість входити також за допомогою email та пароля.
              </p>
            )}
          </form>

          <Separator border-dashed className="opacity-50" />

          {/* Active Sessions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Laptop className="h-4 w-4" />
                Активні сесії
              </h3>
              {deviceSessions.length > 1 && (
                <Button 
                  disabled={isRevokingAll}
                  onClick={async () => {
                    setIsRevokingAll(true);
                    const res = await revokeAllOtherDeviceSessionsAction(currentSessionId || "");
                    if (res?.error) toast.error(res.error);
                    else toast.success(res?.success || "Всі інші сесії завершено");
                    setIsRevokingAll(false);
                  }}
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  {isRevokingAll ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5 mr-1.5" />}
                  Вийти з усіх інших
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {deviceSessions.length === 0 ? (
                <div className="text-sm text-muted-foreground/60 italic text-center p-6 border border-dashed rounded-xl">
                  Немає даних
                </div>
              ) : (
                deviceSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  const isMobile = session.device !== "Desktop" && session.device !== "Unknown";
                  return (
                    <div key={session.id} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${isCurrent ? 'bg-primary/5 border-primary/20' : 'bg-background/50 hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center ${isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate flex items-center gap-2">
                            {session.device} 
                            {isCurrent && <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-sm">Поточний</span>}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.browser} на {session.os}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5 flex gap-1 items-center">
                            {session.ipAddress}
                            <span className="opacity-50">•</span>
                            {new Date(session.lastActive).toLocaleString('uk-UA', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {!isCurrent && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isRevoking === session.id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={async () => {
                            setIsRevoking(session.id);
                            const res = await revokeDeviceSessionAction(session.id);
                            if (res?.error) toast.error(res.error);
                            else toast.success(res?.success || "Сесію завершено");
                            setIsRevoking(null);
                          }}
                        >
                          {isRevoking === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Separator border-dashed className="opacity-50" />

          {/* API Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Токени
              </h3>
              <Button onClick={() => toast.info("Генерація API токенів в розробці.")} variant="outline" size="sm" className="h-8 rounded-lg text-xs">Створити токен</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Використовуйте токени для доступу до вашого акаунту через сторонні додатки та скрипти.
            </p>
            <div className="text-sm text-muted-foreground/60 italic text-center p-6 border border-dashed rounded-xl">
              У вас поки немає створених API токенів
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
