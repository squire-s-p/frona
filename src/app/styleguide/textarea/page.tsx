"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

function TextareaDemo() {
  return <Textarea placeholder="Type your message here." />;
}

function TextareaField() {
  return (
    <Field>
      <FieldLabel htmlFor="textarea-message">Message</FieldLabel>
      <FieldDescription>Enter your message below.</FieldDescription>
      <Textarea id="textarea-message" placeholder="Type your message here." />
    </Field>
  );
}

function TextareaDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
      <Textarea
        id="textarea-disabled"
        placeholder="Type your message here."
        disabled
      />
    </Field>
  );
}

function TextareaInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="textarea-invalid">Message</FieldLabel>
      <Textarea
        id="textarea-invalid"
        placeholder="Type your message here."
        aria-invalid
      />
      <FieldDescription className="text-destructive">Please enter a valid message.</FieldDescription>
    </Field>
  );
}

function TextareaButton() {
  return (
    <div className="grid w-full gap-4">
      <Textarea placeholder="Type your message here." />
      <Button className="w-fit ml-auto">Send message</Button>
    </div>
  );
}

export default function TextareaPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Textarea
        </h1>
        <p className="text-lg text-muted-foreground">
          A multi-line text input field.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Default</h2>
          <TextareaDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">With Field Wrapper</h2>
          <TextareaField />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Disabled</h2>
          <TextareaDisabled />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Invalid State</h2>
          <TextareaInvalid />
        </section>

        <section className="space-y-4 md:col-span-2">
          <h2 className="text-2xl font-bold">With Action Button</h2>
          <TextareaButton />
        </section>
      </div>
    </div>
  );
}
