import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const items = [
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "We offer monthly and annual subscription plans. Billing is charged at the beginning of each cycle, and you can cancel anytime. All plans include automatic backups, 24/7 support, and unlimited team members.",
  },
  {
    value: "security",
    trigger: "Is my data secure?",
    content:
      "Yes. We use end-to-end encryption, SOC 2 Type II compliance, and regular third-party security audits. All data is encrypted at rest and in transit using industry-standard protocols.",
  },
  {
    value: "integration",
    trigger: "What integrations do you support?",
    content:
      "We integrate with 500+ popular tools including Slack, Zapier, Salesforce, HubSpot, and more. You can also build custom integrations using our REST API and webhooks.",
  },
];

const items2 = [
  {
    value: "plans",
    trigger: "What subscription plans do you offer?",
    content:
      "We offer three subscription tiers: Starter ($9/month), Professional ($29/month), and Enterprise ($99/month). Each plan includes increasing storage limits, API access, priority support, and team collaboration features.",
  },
  {
    value: "billing",
    trigger: "How does billing work?",
    content:
      "Billing occurs automatically at the start of each billing cycle. We accept all major credit cards, PayPal, and ACH transfers for enterprise customers. You'll receive an invoice via email after each payment.",
  },
  {
    value: "cancel",
    trigger: "How do I cancel my subscription?",
    content:
      "You can cancel your subscription anytime from your account settings. There are no cancellation fees or penalties. Your access will continue until the end of your current billing period.",
  },
];

export default function AccordionPage() {
  return (
    <div className="space-y-10 pr-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Accordion
        </h1>
        <p className="text-lg text-muted-foreground">
          A vertically stacked set of interactive headings that each reveal a section of content.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Default borders
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <Accordion
            type="single"
            collapsible
            className="w-full max-w-lg rounded-lg border bg-background"
            defaultValue="billing"
          >
            {items.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="border-b px-4 last:border-b-0"
              >
                <AccordionTrigger>{item.trigger}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Inside a Card
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>
                Common questions about your account, plans, payments and
                cancellations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="plans">
                {items2.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger>{item.trigger}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
