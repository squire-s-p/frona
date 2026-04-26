"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function CardDemo() {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  );
}

function CardSmall() {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>
          A compact version of the card.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          You can adjust the card's width using Tailwind classes like max-w-sm.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Action
        </Button>
      </CardFooter>
    </Card>
  );
}

function CardImage() {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary">Featured</Badge>
        </CardAction>
        <CardTitle>Design systems meetup</CardTitle>
        <CardDescription>
          A practical talk on component APIs, accessibility, and shipping
          faster.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">View Event</Button>
      </CardFooter>
    </Card>
  );
}

export default function CardPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Card
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a card with header, content, and footer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Default</h2>
          <CardDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Small Variant</h2>
          <CardSmall />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">With Image</h2>
          <CardImage />
        </section>
      </div>
    </div>
  );
}
