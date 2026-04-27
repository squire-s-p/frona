import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function AlertPage() {
  return (
    <div className="space-y-10 pr-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Alert
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a callout for user attention.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Alert className="max-w-md">
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Account updated successfully</AlertTitle>
            <AlertDescription>
              Your profile information has been saved. Changes will be reflected
              immediately.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Destructive
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>
              Your payment could not be processed. Please check your payment method
              and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
