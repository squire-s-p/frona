"use client";

import * as React from "react";

export default function TypographyPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Typography
        </h1>
        <p className="text-lg text-muted-foreground">
          Styles for headings, paragraphs, lists...etc.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">H1</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
              Taxing Laughter: The Joke Tax Chronicles
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">H2</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
              The People of the Kingdom
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">H3</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
              The Joke Tax
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">H4</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-foreground">
              People stopped telling jokes
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">P</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground">
              The king, seeing how much happier his subjects were, realized the error of
              his ways and repealed the joke tax.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Blockquote</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <blockquote className="mt-6 border-l-2 pl-6 italic text-foreground">
              &quot;After all,&quot; he said, &quot;everyone enjoys a good joke, so
              it&apos;s only fair that they should pay for the privilege.&quot;
            </blockquote>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Table</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full text-foreground">
                <thead>
                  <tr className="m-0 border-t p-0 even:bg-muted">
                    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                      King&apos;s Treasury
                    </th>
                    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
                      People&apos;s happiness
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="m-0 border-t p-0 even:bg-muted">
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Empty
                    </td>
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Overflowing
                    </td>
                  </tr>
                  <tr className="m-0 border-t p-0 even:bg-muted">
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Modest
                    </td>
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Satisfied
                    </td>
                  </tr>
                  <tr className="m-0 border-t p-0 even:bg-muted">
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Full
                    </td>
                    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
                      Ecstatic
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">List</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground">
              <li>1st level of puns: 5 gold coins</li>
              <li>2nd level of jokes: 10 gold coins</li>
              <li>3rd level of one-liners : 20 gold coins</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inline Code</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground">
              @radix-ui/react-alert-dialog
            </code>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Lead</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <p className="text-xl text-muted-foreground">
              A modal dialog that interrupts the user with important content and expects
              a response.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Large</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <div className="text-lg font-semibold text-foreground">Are you absolutely sure?</div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Small</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <small className="text-sm leading-none font-medium text-foreground">Email address</small>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Muted</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Enter your email address.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
