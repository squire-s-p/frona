export default function StyleguidePage() {
  return (
    <div className="space-y-10 pr-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Styleguide
        </h1>
        <p className="text-lg text-muted-foreground whitespace-pre-wrap">
          Ця сторінка створена для уніфікації компонентів дизайну по всьому дашборду.{"\n"}
          Тут ви можете скидати мені нові компоненти shadcn та інші елементи, які ми стандартизуємо.
        </p>
      </div>

      <div className="space-y-4">
        <h2 id="installation" className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Installation
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground/80">
          Для завантаження нових елементів з Shadcn UI, використовуйте наступну команду:
        </p>
        <div className="rounded-md bg-muted/50 p-4 border border-border/40 font-mono text-sm">
          npx shadcn@latest add [component-name]
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 id="usage" className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Вступ
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground/80 whitespace-pre-wrap">
          Цей гайд допомагає підтримувати візуальну чистоту додатка. Ми використовуємо сучасну палітру в просторі OKLCH для кращого сприйняття кольорів.{"\n\n"}
          Перейдіть до розділу <strong>Design Tokens</strong>, щоб побачити актуальну нейтральну палітру, кольори бренду та систему заокруглень.
        </p>
      </div>
    </div>
  );
}
