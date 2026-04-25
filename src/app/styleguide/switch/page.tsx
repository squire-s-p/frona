"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";

export default function SwitchPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Switch
        </h1>
        <p className="text-lg text-muted-foreground">
          A control that allows the user to toggle between checked and not checked.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Basic
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Airplane Mode</Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            With Description
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Field orientation="horizontal" className="max-w-sm">
              <FieldContent>
                <FieldLabel htmlFor="switch-focus-mode">
                  Share across devices
                </FieldLabel>
                <FieldDescription>
                  Focus is shared across devices, and turns off when you leave the app.
                </FieldDescription>
              </FieldContent>
              <Switch id="switch-focus-mode" />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Disabled
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Field orientation="horizontal" data-disabled className="w-fit">
              <Switch id="switch-disabled-unchecked" disabled />
              <FieldLabel htmlFor="switch-disabled-unchecked">Disabled</FieldLabel>
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Sizes
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <FieldGroup className="w-full max-w-[10rem]">
              <Field orientation="horizontal">
                <Switch id="switch-size-sm" size="sm" />
                <FieldLabel htmlFor="switch-size-sm">Small</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch id="switch-size-default" size="default" />
                <FieldLabel htmlFor="switch-size-default">Default</FieldLabel>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Choice Card
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[250px]">
            <FieldGroup className="w-full max-w-md">
              <FieldLabel htmlFor="switch-share" className="cursor-pointer">
                <Field orientation="horizontal" className="border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground">
                  <FieldContent>
                    <FieldTitle>Share across devices</FieldTitle>
                    <FieldDescription className="mt-1">
                      Focus is shared across devices, and turns off when you leave the
                      app.
                    </FieldDescription>
                  </FieldContent>
                  <Switch id="switch-share" className="ml-auto" />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="switch-notifications" className="cursor-pointer">
                <Field orientation="horizontal" className="border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground">
                  <FieldContent>
                    <FieldTitle>Enable notifications</FieldTitle>
                    <FieldDescription className="mt-1">
                      Receive notifications when focus mode is enabled or disabled.
                    </FieldDescription>
                  </FieldContent>
                  <Switch id="switch-notifications" defaultChecked className="ml-auto" />
                </Field>
              </FieldLabel>
            </FieldGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
