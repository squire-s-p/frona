"use client";

import * as React from "react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldContent,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function FieldPage() {
  const [value, setValue] = React.useState<[number, number]>([200, 800]);

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Field
        </h1>
        <p className="text-lg text-muted-foreground">
          A building block for creating forms and inputs with standard layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Input
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldSet className="w-full max-w-xs">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input id="username" type="text" placeholder="Max Leiter" />
                  <FieldDescription>
                    Choose a unique username for your account.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                  <Input id="password" type="password" placeholder="••••••••" />
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Textarea
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldSet className="w-full max-w-xs">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
                  <Textarea
                    id="feedback"
                    placeholder="Your feedback helps us improve..."
                    rows={4}
                  />
                  <FieldDescription>
                    Share your thoughts about our service.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Select
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Field className="w-full max-w-xs">
              <FieldLabel>Department</FieldLabel>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Select your department or area of work.
              </FieldDescription>
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Slider
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Field className="w-full max-w-xs">
              <FieldTitle>Price Range</FieldTitle>
              <FieldDescription>
                Set your budget range ($
                <span className="font-medium tabular-nums">{value[0]}</span> -{" "}
                <span className="font-medium tabular-nums">{value[1]}</span>).
              </FieldDescription>
              <Slider
                value={value}
                onValueChange={(value) => setValue(value as [number, number])}
                max={1000}
                min={0}
                step={10}
                className="mt-2 w-full"
                aria-label="Price Range"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Fieldset
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldSet className="w-full max-w-sm">
              <FieldLegend>Address Information</FieldLegend>
              <FieldDescription>
                We need your address to deliver your order.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="street">Street Address</FieldLabel>
                  <Input id="street" type="text" placeholder="123 Main St" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input id="city" type="text" placeholder="New York" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="zip">Postal Code</FieldLabel>
                    <Input id="zip" type="text" placeholder="90502" />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Switch
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Field orientation="horizontal" className="w-fit">
              <FieldLabel htmlFor="2fa">Multi-factor authentication</FieldLabel>
              <Switch id="2fa" />
            </Field>
          </div>
        </div>

        <div className="space-y-4 col-span-1 lg:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Radio
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldSet className="w-full max-w-xs">
              <FieldLegend variant="label">Subscription Plan</FieldLegend>
              <FieldDescription>
                Yearly and lifetime plans offer significant savings.
              </FieldDescription>
              <RadioGroup defaultValue="monthly">
                <Field orientation="horizontal">
                  <RadioGroupItem value="monthly" id="plan-monthly" />
                  <FieldLabel htmlFor="plan-monthly" className="font-normal">
                    Monthly ($9.99/month)
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="yearly" id="plan-yearly" />
                  <FieldLabel htmlFor="plan-yearly" className="font-normal">
                    Yearly ($99.99/year)
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="lifetime" id="plan-lifetime" />
                  <FieldLabel htmlFor="plan-lifetime" className="font-normal">
                    Lifetime ($299.99)
                  </FieldLabel>
                </Field>
              </RadioGroup>
            </FieldSet>
          </div>
        </div>

        <div className="space-y-4 col-span-1 lg:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Checkbox Group & Separator
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[150px]">
            <FieldGroup className="w-full max-w-xs">
              <FieldSet>
                <FieldLegend variant="label">
                  Show these items on the desktop
                </FieldLegend>
                <FieldDescription>
                  Select the items you want to show on the desktop.
                </FieldDescription>
                <FieldGroup className="gap-3">
                  <Field orientation="horizontal">
                    <Checkbox id="finder-pref-9k2-hard-disks-ljj" defaultChecked />
                    <FieldLabel htmlFor="finder-pref-9k2-hard-disks-ljj" className="font-normal">
                      Hard disks
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox id="finder-pref-9k2-external-disks-1yg" />
                    <FieldLabel htmlFor="finder-pref-9k2-external-disks-1yg" className="font-normal">
                      External disks
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox id="finder-pref-9k2-cds-dvds-fzt" />
                    <FieldLabel htmlFor="finder-pref-9k2-cds-dvds-fzt" className="font-normal">
                      CDs, DVDs, and iPods
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <FieldSeparator />
              <Field orientation="horizontal">
                <Checkbox id="finder-pref-9k2-sync-folders-nep" defaultChecked />
                <FieldContent>
                  <FieldLabel htmlFor="finder-pref-9k2-sync-folders-nep">
                    Sync Desktop & Documents folders
                  </FieldLabel>
                  <FieldDescription>
                    Your Desktop & Documents folders are being synced with iCloud Drive.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup className="w-full max-w-xs mt-8">
              <FieldSet>
                <FieldLabel>Responses</FieldLabel>
                <FieldDescription>
                  Get notified when ChatGPT responds to requests that take time.
                </FieldDescription>
                <FieldGroup data-slot="checkbox-group">
                  <Field orientation="horizontal">
                    <Checkbox id="push" defaultChecked disabled />
                    <FieldLabel htmlFor="push" className="font-normal">
                      Push notifications
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <FieldSeparator />
              <FieldSet>
                <FieldLabel>Tasks</FieldLabel>
                <FieldDescription>
                  Get notified when tasks you&apos;ve created have updates.
                </FieldDescription>
                <FieldGroup data-slot="checkbox-group">
                  <Field orientation="horizontal">
                    <Checkbox id="push-tasks" />
                    <FieldLabel htmlFor="push-tasks" className="font-normal">
                      Push notifications
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox id="email-tasks" />
                    <FieldLabel htmlFor="email-tasks" className="font-normal">
                      Email notifications
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </div>
        </div>

        <div className="space-y-4 col-span-1 lg:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Choice Card
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldGroup className="w-full max-w-md">
              <FieldSet>
                <FieldLegend variant="label">Compute Environment</FieldLegend>
                <FieldDescription>
                  Select the compute environment for your cluster.
                </FieldDescription>
                <RadioGroup defaultValue="kubernetes" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldLabel htmlFor="kubernetes-r2h" className="cursor-pointer">
                    <Field orientation="horizontal" className="border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                      <FieldContent>
                        <FieldTitle>Kubernetes</FieldTitle>
                        <FieldDescription className="mt-1">
                          Run GPU workloads on a K8s cluster.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="kubernetes" id="kubernetes-r2h" className="ml-auto" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="vm-z4k" className="cursor-pointer">
                    <Field orientation="horizontal" className="border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                      <FieldContent>
                        <FieldTitle>Virtual Machine</FieldTitle>
                        <FieldDescription className="mt-1">
                          Access a cluster to run GPU workloads.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="vm" id="vm-z4k" className="ml-auto" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>
            </FieldGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
