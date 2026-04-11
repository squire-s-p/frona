import Image from "next/image";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

export default async function TermsPage() {
  const session = await getAuthSession();

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased selection:bg-primary/10 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image src="/logo.svg" alt="Frona logo" width={28} height={28} className="dark:invert" />
            <span className="font-bold text-xl tracking-tight">Frona</span>
          </Link>

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

      <main className="relative z-10 flex-1 py-20">
        <div className="container mx-auto max-w-4xl px-6">
          <h1 className="mb-12 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">Умови використання</h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Загальні положення</h2>
              <p>Ці Умови використання регулюють доступ та використання сервісу Frona. Використовуючи наш додаток, ви беззастережно погоджуєтеся з усіма правилами та обмеженнями, описаними нижче.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Реєстрація та безпека</h2>
              <p>Для використання сервісу необхідно створити обліковий запис. Ви зобов'язані:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Надавати правдиву інформацію при реєстрації.</li>
                <li>Відповідати за збереження конфіденційності вашого пароля.</li>
                <li>Негайно повідомляти нас у разі підозри на злам вашого акаунту.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Обмеження відповідальності</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ми не гарантуємо безперервну та безпомилкову роботу сервісу у разі масштабних технічних збоїв або форс-мажорів.</li>
                <li>Frona надає інструменти аналізу, проте остаточне рішення щодо фінансових операцій залишається за користувачем. Ми не несемо відповідальності за ваші фінансові рішення.</li>
                <li>Ми не несемо відповідальності за роботу сторонніх партнерів (банків, API-провайдерів).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Інтелектуальна власність</h2>
              <p>Весь контент, логотипи, дизайн та програмний код Frona є власністю Squire-S-P та захищені законами про авторське право. Будь-яке копіювання або використання елементів інтерфейсу без нашого дозволу заборонено.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Припинення надання послуг</h2>
              <p>Ми залишаємо за собою право тимчасово заблокувати або назавжди видалити ваш обліковий запис у разі порушення умов використання, використання вразливостей системи або здійснення незаконних дій через наш сервіс.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Вирішення суперечок</h2>
              <p>Всі спори виникають щодо надання послуг вирішуються шляхом переговорів. Якщо згоди не досягнуто, спір вирішується згідно з чинним законодавством України.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Контактна інформація</h2>
              <p>Якщо у вас виникли питання щодо цих Умов, будь ласка, зверніться до нашої служби підтримки.</p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-50 w-full border-t border-border/40 py-16 bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center gap-10 px-4 sm:px-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2 mb-1">
               <Image src="/logo.svg" alt="Frona logo" width={24} height={24} className="dark:invert" />
               <span className="font-bold text-lg tracking-tight">Frona</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mx-auto">
               Створено для ефективного керування вашими проектами, фінанси та часом.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-semibold">
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
