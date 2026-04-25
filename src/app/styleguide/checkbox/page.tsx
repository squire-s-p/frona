"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// We stub Field, FieldGroup, FieldLabel, FieldContent, FieldDescription since they might be custom or not standard Shadcn
function FieldGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
function Field({ orientation, "data-invalid": dataInvalid, "data-disabled": dataDisabled, children }: any) {
  return <div className={`flex gap-2 ${orientation === "horizontal" ? "items-center" : "flex-col"} ${dataInvalid ? "text-destructive" : ""} ${dataDisabled ? "opacity-50" : ""}`}>{children}</div>;
}
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>;
}
function FieldContent({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-1.5 leading-none">{children}</div>;
}
function FieldDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

const tableData = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@example.com", role: "Admin" },
  { id: "2", name: "Marcus Rodriguez", email: "marcus.rodriguez@example.com", role: "User" },
  { id: "3", name: "Priya Patel", email: "priya.patel@example.com", role: "User" },
  { id: "4", name: "David Kim", email: "david.kim@example.com", role: "Editor" },
];

export default function CheckboxPage() {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set(["1"]));

  const selectAll = selectedRows.size === tableData.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(tableData.map((row) => row.id)));
    else setSelectedRows(new Set());
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedRows(newSelected);
  };

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Checkbox
        </h1>
        <p className="text-lg text-muted-foreground">
          A control that allows the user to toggle between checked and not checked.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <FieldGroup className="mx-auto w-56">
            <Field orientation="horizontal">
              <Checkbox id="terms-checkbox-basic" name="terms-checkbox-basic" />
              <FieldLabel htmlFor="terms-checkbox-basic">Accept terms and conditions</FieldLabel>
            </Field>
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Invalid State
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <FieldGroup className="mx-auto w-56">
            <Field orientation="horizontal" data-invalid>
              <Checkbox id="terms-checkbox-invalid" name="terms-checkbox-invalid" aria-invalid />
              <FieldLabel htmlFor="terms-checkbox-invalid">Accept terms and conditions</FieldLabel>
            </Field>
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Description
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <FieldGroup className="mx-auto w-72">
            <Field orientation="horizontal">
              <Checkbox id="terms-checkbox-desc" name="terms-checkbox-desc" defaultChecked />
              <FieldContent>
                <FieldLabel htmlFor="terms-checkbox-desc">Accept terms and conditions</FieldLabel>
                <FieldDescription>By clicking this checkbox, you agree to the terms and conditions.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Disabled
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <FieldGroup className="mx-auto w-56">
            <Field orientation="horizontal" data-disabled>
              <Checkbox id="toggle-checkbox-disabled" name="toggle-checkbox-disabled" disabled />
              <FieldLabel htmlFor="toggle-checkbox-disabled">Enable notifications</FieldLabel>
            </Field>
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Table
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    id="select-all-checkbox"
                    name="select-all-checkbox"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.id} data-state={selectedRows.has(row.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      id={`row-${row.id}-checkbox`}
                      name={`row-${row.id}-checkbox`}
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={(checked) => handleSelectRow(row.id, checked === true)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
