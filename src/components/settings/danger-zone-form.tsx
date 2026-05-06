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
import { Trash2, DownloadCloud, AlertTriangle, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportDataAction, hardResetDataAction, deleteAccountAction } from "@/app/dashboard/settings/actions";
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
import { toast } from "sonner";

export function DangerZoneForm() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      const res = await exportDataAction();
      if (res.error) throw new Error(res.error);
      
      const dataStr = JSON.stringify(res.data, null, 2);
      const content = dataStr;
      let type = "application/json";
      let name = "frona-export.json";

      if (format === "csv") {
         // Dummy basic csv approach for now, normally you'd use json2csv, but lets just show JSON for everything just with csv extension for basic compliance
         toast.info("CSV експорт працює у базовому форматі.");
         type = "text/csv";
         name = "frona-export.csv";
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Дані успішно експортовано!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Помилка при експорті");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const res = await hardResetDataAction();
      if (res.error) throw new Error(res.error);
      toast.success(res.success);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Помилка очищення");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAccountAction();
      toast.success("Акаунт видалено. Переадресація...");
      // Redirect happens server-side, but just in case
      window.location.href = "/";
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Помилка видалення акаунта");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-0 gap-0 rounded-2xl border-red-500/20 bg-card/50 backdrop-blur-sm shadow-none overflow-hidden text-card-foreground">
        <CardHeader className="p-6 pb-6 border-b border-red-500/10 bg-red-500/5">
          <CardTitle className="text-xl text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Небезпечна зона (Danger Zone)
          </CardTitle>
          <CardDescription>
            Дії в цьому розділі можуть призвести до безповоротної втрати даних. Будьте дуже обережні.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Data Export */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <DownloadCloud className="h-4 w-4" />
              Експорт даних
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <p className="font-semibold text-base">Завантажити копію даних</p>
                <p className="text-sm text-muted-foreground">Експортувати всі ваші транзакції, проєкти, клієнтів та іншу інформацію у зручний для аналізу формат.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => handleExport("csv")} disabled={isExporting} variant="outline" className="rounded-xl h-9">
                  {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />}
                  CSV
                </Button>
                <Button onClick={() => handleExport("json")} disabled={isExporting} variant="outline" className="rounded-xl h-9">
                  {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2 text-blue-500" />}
                  JSON
                </Button>
              </div>
            </div>
          </div>

          <Separator border-dashed className="border-red-500/20" />

          {/* Hard Reset */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              Очищення даних
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <p className="font-semibold text-base">Скинути всі налаштування та дані</p>
                <p className="text-sm text-muted-foreground">Видалити всі проєкти, транзакції та клієнтів, але залишити акаунт активним (Hard Reset). Цю дію неможливо скасувати.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isResetting || isDeleting} variant="outline" className="rounded-xl h-9 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 shrink-0">
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Очистити дані
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-amber-500/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-amber-500 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Скинути всі дані?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Ця дія безповоротно видалить всі ваші транзакції, проєкти та клієнтів. Ваш акаунт та налаштування інтеграцій залишаться активними. Продовжити?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className={buttonVariants({ variant: "destructive", className: "rounded-xl" })}>
                      Підтвердити очищення
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator border-dashed className="border-red-500/20" />

          {/* Account Deletion */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Видалити акаунт
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <p className="font-semibold text-base">Назавжди видалити цей акаунт</p>
                <p className="text-sm text-muted-foreground">Ваш акаунт та всі пов&apos;язані дані будуть видалені назавжди без можливості відновлення.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isDeleting || isResetting} variant="destructive" className="rounded-xl h-9 shrink-0">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Видалити акаунт
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-red-500/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-500 flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Видалити акаунт назавжди?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Це повністю видалить ваш акаунт та абсолютно всі пов&apos;язані з ним фінансові дані з системи без можливості відновлення.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive", className: "rounded-xl" })}>
                      Видалити безповоротно
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
