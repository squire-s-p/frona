import Image from "next/image";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  LayoutDashboard,
  Timer,
  CreditCard,
  Target,
  FileText
} from "lucide-react";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export default async function Home() {
  const session = await getAuthSession();

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased selection:bg-primary/10 overflow-x-hidden">
      {/* Shadcn-style Dot Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
            <Image src="/logo.svg" alt="Frona logo" width={28} height={28} className="dark:invert" />

          <div className="flex items-center gap-4">
            {session ? (
              <Button size="sm" asChild className="h-9 rounded-md px-4">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 size-4" />
                  Дашборд
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Увійти</Link>
                <Button size="sm" asChild className="h-9 rounded-md px-5 shadow-sm">
                  <Link href="/auth/register">Почати</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 pt-24 pb-12 text-center md:pt-32 md:pb-24 px-4">
          <Badge variant="secondary" className="bg-muted px-4 py-1.5 font-medium tracking-tight">
            Next-gen Business OS
          </Badge>
          
          <h1 className="max-w-[900px] text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-[1.2]">
            Твій новий стандарт <br />
            керування бізнесом.
          </h1>
          
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl md:text-2xl mt-2">
            Організуйте свої проекти, фінанси та час в одному професійному просторі. 
            Створено для тих, хто будує майбутнє.
          </p>

          <div className="flex flex-col gap-4 min-[400px]:flex-row mt-8 justify-center">
            <Button size="lg" asChild className="h-12 rounded-md px-10 text-base shadow-lg">
              <Link href="/auth/register">
                Створити акаунт
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 rounded-md px-10 text-base">
              <Link href="/login">
                Увійти до кабінету
              </Link>
            </Button>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="container mx-auto px-4 sm:px-8 pb-32 flex justify-center">
          <div className="relative group max-w-5xl w-full">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-zinc-200 to-zinc-100 opacity-25 blur transition duration-1000 group-hover:opacity-40 dark:from-zinc-800 dark:to-zinc-900" />
            <DashboardPreview />
          </div>
        </section>

        {/* Features Grid - Centered */}
        <section id="features" className="container mx-auto px-4 sm:px-8 pb-32">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Timer className="size-6" />, title: "Тайм-трекінг", desc: "Контроль продуктивності." },
              { icon: <CreditCard className="size-6" />, title: "Банкінг", desc: "Синхронізація з Mono." },
              { icon: <Target className="size-6" />, title: "Проекти", desc: "Керування клієнтами." },
              { icon: <FileText className="size-6" />, title: "Нотатки", desc: "База знань з Markdown." }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center gap-3 bg-background p-10 transition-colors hover:bg-muted/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm mb-2">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-normal">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="container mx-auto px-4 sm:px-8 pb-32 text-center flex justify-center">
            <div className="w-full max-w-4xl rounded-3xl border border-dashed border-border p-12 md:p-24 bg-muted/20 flex flex-col items-center">
                <h2 className="text-4xl font-bold tracking-tight mb-4 text-center">Готові почати роботу?</h2>
                <p className="text-muted-foreground mb-10 max-w-sm text-center">
                    Приєднуйтесь до професіоналів, які вже використовують Frona для масштабування бізнесу.
                </p>
                <Button size="lg" asChild className="rounded-md px-10">
                    <Link href="/auth/register">Спробувати безкоштовно</Link>
                </Button>
            </div>
        </section>
      </main>

      {/* Footer - Final click fix and centering */}
      <footer className="relative z-[150] w-full border-t border-border/40 py-16 bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center gap-10 px-4 sm:px-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2 mb-1">
               <Image src="/logo.svg" alt="Frona logo" width={24} height={24} className="dark:invert" />
               <span className="font-bold text-lg tracking-tight">Frona</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mx-auto">
               Створено для ефективного керування вашими проектами, фінансами та часом.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-semibold relative z-[200]">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground hover:underline underline-offset-8 transition-all px-4 py-2 block">
               Конфіденційність
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground hover:underline underline-offset-8 transition-all px-4 py-2 block">
               Умови
            </Link>
          </div>

          <div className="text-xs text-muted-foreground/50 border-t border-border/30 pt-8 w-full text-center">
            © 2026 Frona. Побудовано з використанням Next.js & Shadcn UI.
          </div>
        </div>
      </footer>
    </div>
  );
}
