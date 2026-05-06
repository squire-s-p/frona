"use client";

import * as React from "react";
import { useActionState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Info, Loader2, Trash2, Upload } from "lucide-react";
import { updateProfileAction, uploadAvatarAction, deleteAvatarAction } from "@/app/dashboard/settings/actions";

interface ProfileFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    targetHourlyRate?: number;
  };
}

const initialState = {
  error: null,
  success: null,
};

export function ProfileForm({ user }: ProfileFormProps) {
  // useActionState provides [state, dispatch, isPending]
  const [state, dispatch, isPending] = useActionState(updateProfileAction as any, initialState);

  const { update } = useSession();

  React.useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      update(); // Update NextAuth session immediately so sidebar name updates
    }
    if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл занадто великий (макс. 5 МБ)");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploading(true);
    const res = await uploadAvatarAction(formData);
    setIsUploading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      await update();
      toast.success(res?.success || "Фото успішно оновлено");
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeleting(true);
    const res = await deleteAvatarAction();
    setIsDeleting(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      await update();
      toast.success(res?.success || "Фото видалено");
    }
  };

  const initials = (user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase();

  return (
    <form action={dispatch} className="space-y-6">
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-none overflow-hidden text-card-foreground">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl">Особиста інформація</CardTitle>
          <CardDescription>
            Ваше ім&apos;я та контактні дані для системи
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-dashed pb-8">
            <div className="relative group">
              <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <Avatar className={`h-24 w-24 ring-4 ring-background shadow-none transition-transform group-hover:scale-105 ${isUploading ? 'opacity-50' : ''}`}>
                <AvatarImage src={user.image ?? ""} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-semibold text-lg">{user.name ?? "Користувач"}</h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
              <div className="flex justify-center sm:justify-start gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isDeleting}
                  className="rounded-xl h-8 px-4 text-xs font-medium"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                  Оновити фото
                </Button>
                {user.image && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDeleteAvatar}
                    disabled={isUploading || isDeleting}
                    className="rounded-xl h-8 px-4 text-xs text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                    Видалити
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium px-1">Повне ім&apos;я</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Як вас звати?"
                autoComplete="name"
                required
                className="rounded-xl h-11 bg-background/50 focus:bg-background transition-all"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium px-1">Електронна пошта</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user.email ?? ""}
                  disabled
                  className="rounded-xl h-11 pl-10 bg-muted/20 cursor-not-allowed border-dashed opacity-70"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="targetHourlyRate" className="text-sm font-medium px-1">Цільова ставка (₴/год)</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground font-bold text-xs">₴</span>
                <Input
                  id="targetHourlyRate"
                  name="targetHourlyRate"
                  type="number"
                  defaultValue={user.targetHourlyRate ?? 0}
                  placeholder="Наприклад, 1000"
                  className="rounded-xl h-11 pl-10 bg-background/50 focus:bg-background transition-all"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 px-6 py-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Зміни будуть застосовані після збереження
          </div>
          <Button 
            type="submit" 
            disabled={isPending}
            className="rounded-xl px-8 shadow-none min-w-[120px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Збереження...
              </>
            ) : (
              "Зберегти"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
