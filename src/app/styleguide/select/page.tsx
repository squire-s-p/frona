"use client";

import * as React from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function SelectPage() {
  const [alignItemWithTrigger, setAlignItemWithTrigger] = React.useState(true);

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Select
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a list of options for the user to pick from—triggered by a button.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Align Item With Trigger
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
            <FieldGroup className="w-full max-w-xs">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="align-item">Align Item</FieldLabel>
                  <FieldDescription>
                    Toggle to align the item with the trigger.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="align-item"
                  checked={alignItemWithTrigger}
                  onCheckedChange={setAlignItemWithTrigger}
                />
              </Field>
              <Field className="mt-4">
                <Select defaultValue="banana">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position={alignItemWithTrigger ? "item-aligned" : "popper"}
                  >
                    <SelectGroup>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Groups
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
            <Select>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Vegetables</SelectLabel>
                  <SelectItem value="carrot">Carrot</SelectItem>
                  <SelectItem value="broccoli">Broccoli</SelectItem>
                  <SelectItem value="spinach">Spinach</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Scrollable
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
            <Select>
              <SelectTrigger className="w-full max-w-64">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>North America</SelectLabel>
                  <SelectItem value="est">Eastern Standard Time</SelectItem>
                  <SelectItem value="cst">Central Standard Time</SelectItem>
                  <SelectItem value="mst">Mountain Standard Time</SelectItem>
                  <SelectItem value="pst">Pacific Standard Time</SelectItem>
                  <SelectItem value="akst">Alaska Standard Time</SelectItem>
                  <SelectItem value="hst">Hawaii Standard Time</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Europe & Africa</SelectLabel>
                  <SelectItem value="gmt">Greenwich Mean Time</SelectItem>
                  <SelectItem value="cet">Central European Time</SelectItem>
                  <SelectItem value="eet">Eastern European Time</SelectItem>
                  <SelectItem value="west">Western European Summer Time</SelectItem>
                  <SelectItem value="cat">Central Africa Time</SelectItem>
                  <SelectItem value="eat">East Africa Time</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Asia</SelectLabel>
                  <SelectItem value="msk">Moscow Time</SelectItem>
                  <SelectItem value="ist">India Standard Time</SelectItem>
                  <SelectItem value="cst_china">China Standard Time</SelectItem>
                  <SelectItem value="jst">Japan Standard Time</SelectItem>
                  <SelectItem value="kst">Korea Standard Time</SelectItem>
                  <SelectItem value="ist_indonesia">
                    Indonesia Central Standard Time
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Australia & Pacific</SelectLabel>
                  <SelectItem value="awst">Australian Western Standard Time</SelectItem>
                  <SelectItem value="acst">Australian Central Standard Time</SelectItem>
                  <SelectItem value="aest">Australian Eastern Standard Time</SelectItem>
                  <SelectItem value="nzst">New Zealand Standard Time</SelectItem>
                  <SelectItem value="fjt">Fiji Time</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>South America</SelectLabel>
                  <SelectItem value="art">Argentina Time</SelectItem>
                  <SelectItem value="bot">Bolivia Time</SelectItem>
                  <SelectItem value="brt">Brasilia Time</SelectItem>
                  <SelectItem value="clt">Chile Standard Time</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
