"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
  useComboboxAnchor,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox";

// Using standard div structure for the 'Item' component which seems to be custom in their setup
function Item({ size, className, children }: any) {
  return <div className={`flex flex-col ${className || ""}`}>{children}</div>;
}
function ItemContent({ children }: any) {
  return <div>{children}</div>;
}
function ItemTitle({ className, children }: any) {
  return <div className={`font-semibold ${className || ""}`}>{children}</div>;
}
function ItemDescription({ children }: any) {
  return <div className="text-xs text-muted-foreground">{children}</div>;
}

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const;

const timezones = [
  {
    value: "Americas",
    items: [
      "(GMT-5) New York",
      "(GMT-8) Los Angeles",
      "(GMT-6) Chicago",
    ],
  },
  {
    value: "Europe",
    items: [
      "(GMT+0) London",
      "(GMT+1) Paris",
      "(GMT+1) Berlin",
    ],
  },
] as const;

const countries = [
  { code: "", value: "", continent: "", label: "Select country" },
  { code: "us", value: "united-states", label: "United States", continent: "North America" },
  { code: "gb", value: "united-kingdom", label: "United Kingdom", continent: "Europe" },
  { code: "ua", value: "ukraine", label: "Ukraine", continent: "Europe" },
];

export default function ComboboxPage() {
  const anchor = useComboboxAnchor();

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Combobox
        </h1>
        <p className="text-lg text-muted-foreground">
          Autocomplete input and command palette with a list of suggestions.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Combobox items={frameworks}>
            <ComboboxInput placeholder="Select a framework" />
            <ComboboxContent>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: any) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Multiple
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Combobox multiple autoHighlight items={frameworks} defaultValue={[frameworks[0]]}>
            <ComboboxChips ref={anchor} className="w-full max-w-xs">
              <ComboboxValue>
                {(values: any) => (
                  <React.Fragment>
                    {values.map((value: string) => (
                      <ComboboxChip key={value}>{value}</ComboboxChip>
                    ))}
                    <ComboboxChipsInput />
                  </React.Fragment>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: any) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Clear Button
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Combobox items={frameworks} defaultValue={frameworks[0]}>
            <ComboboxInput placeholder="Select a framework" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: any) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Groups and Separator
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[350px]">
          <Combobox items={timezones}>
            <ComboboxInput placeholder="Select a timezone" />
            <ComboboxContent>
              <ComboboxEmpty>No timezones found.</ComboboxEmpty>
              <ComboboxList>
                {(group: any, index: number) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxLabel>{group.value}</ComboboxLabel>
                    <ComboboxCollection>
                      {(item: any) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                    {index < timezones.length - 1 && <ComboboxSeparator />}
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Custom Items
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Combobox
            items={countries.filter((country) => country.code !== "")}
            itemToStringValue={(country: (typeof countries)[number]) => country.label}
          >
            <ComboboxInput placeholder="Search countries..." />
            <ComboboxContent>
              <ComboboxEmpty>No countries found.</ComboboxEmpty>
              <ComboboxList>
                {(country: any) => (
                  <ComboboxItem key={country.code} value={country}>
                    <Item size="xs" className="p-0">
                      <ItemContent>
                        <ItemTitle className="whitespace-nowrap">{country.label}</ItemTitle>
                        <ItemDescription>{country.continent} ({country.code})</ItemDescription>
                      </ItemContent>
                    </Item>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Popup
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Combobox items={countries} defaultValue={countries[0]}>
            <ComboboxTrigger render={<Button variant="outline" className="w-64 justify-between font-normal"><ComboboxValue /></Button>} />
            <ComboboxContent>
              <ComboboxInput showTrigger={false} placeholder="Search" />
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: any) => (
                  <ComboboxItem key={item.code} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    </div>
  );
}
