import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

const sidebarNavItems = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        href: "/styleguide",
      },
      {
        title: "Installation",
        href: "/styleguide#installation",
      },
      {
        title: "Theming",
        href: "/styleguide#theming",
      },
      {
        title: "Typography",
        href: "/styleguide/typography",
      },
    ],
  },
  {
    title: "Components",
    items: [
      {
        title: "Accordion",
        href: "/styleguide/accordion",
      },
      {
        title: "Alert",
        href: "/styleguide/alert",
      },
      {
        title: "Alert Dialog",
        href: "/styleguide/alert-dialog",
      },
      {
        title: "Aspect Ratio",
        href: "/styleguide/aspect-ratio",
      },
      {
        title: "Avatar",
        href: "/styleguide/avatar",
      },
      {
        title: "Badge",
        href: "/styleguide/badge",
      },
      {
        title: "Breadcrumb",
        href: "/styleguide/breadcrumb",
      },
      {
        title: "Button",
        href: "/styleguide/button",
      },
      {
        title: "Button Group",
        href: "/styleguide/button-group",
      },
      {
        title: "Calendar",
        href: "/styleguide/calendar",
      },
      {
        title: "Card",
        href: "/styleguide/card",
      },
      {
        title: "Carousel",
        href: "/styleguide/carousel",
      },
      {
        title: "Checkbox",
        href: "/styleguide/checkbox",
      },
      {
        title: "Collapsible",
        href: "/styleguide/collapsible",
      },
      {
        title: "Combobox",
        href: "/styleguide/combobox",
      },
      {
        title: "Command",
        href: "/styleguide/command",
      },
      {
        title: "Context Menu",
        href: "/styleguide/context-menu",
      },
      {
        title: "Dialog",
        href: "/styleguide/dialog",
      },
      {
        title: "Drawer",
        href: "/styleguide/drawer",
      },
      {
        title: "Dropdown Menu",
        href: "/styleguide/dropdown-menu",
      },
      {
        title: "Field",
        href: "/styleguide/field",
      },
      {
        title: "Hover Card",
        href: "/styleguide/hover-card",
      },
      {
        title: "Input",
        href: "/styleguide/input",
      },
      {
        title: "Menubar",
        href: "/styleguide/menubar",
      },
      {
        title: "Navigation Menu",
        href: "/styleguide/navigation-menu",
      },
      {
        title: "Pagination",
        href: "/styleguide/pagination",
      },
      {
        title: "Popover",
        href: "/styleguide/popover",
      },
      {
        title: "Progress",
        href: "/styleguide/progress",
      },
      {
        title: "Radio Group",
        href: "/styleguide/radio-group",
      },
      {
        title: "Resizable",
        href: "/styleguide/resizable",
      },
      {
        title: "Scroll Area",
        href: "/styleguide/scroll-area",
      },
      {
        title: "Select",
        href: "/styleguide/select",
      },
      {
        title: "Separator",
        href: "/styleguide/separator",
      },
      {
        title: "Sheet",
        href: "/styleguide/sheet",
      },
      {
        title: "Skeleton",
        href: "/styleguide/skeleton",
      },
      {
        title: "Slider",
        href: "/styleguide/slider",
      },
      {
        title: "Sonner",
        href: "/styleguide/sonner",
      },
      {
        title: "Spinner",
        href: "/styleguide/spinner",
      },
      {
        title: "Switch",
        href: "/styleguide/switch",
      },
      {
        title: "Table",
        href: "/styleguide/table",
      },
      {
        title: "Tabs",
        href: "/styleguide/tabs",
      },
      {
        title: "Textarea",
        href: "/styleguide/textarea",
      },
      {
        title: "Toast",
        href: "/styleguide/toast",
      },
      {
        title: "Toggle",
        href: "/styleguide/toggle",
      },
      {
        title: "Toggle Group",
        href: "/styleguide/toggle-group",
      },
      {
        title: "Tooltip",
        href: "/styleguide/tooltip",
      },
    ],
  },
  {
    title: "Charts & Graphs",
    items: [
      {
        title: "Area Chart",
        href: "/styleguide/area-chart",
      },
      {
        title: "Bar Chart",
        href: "/styleguide/bar-chart",
      },
      {
        title: "Line Chart",
        href: "/styleguide/line-chart",
      },
      {
        title: "Pie Chart",
        href: "/styleguide/pie-chart",
      },
      {
        title: "Radar Chart",
        href: "/styleguide/radar-chart",
      },
      {
        title: "Radial Chart",
        href: "/styleguide/radial-chart",
      },
      {
        title: "Tooltip",
        href: "/styleguide/tooltip",
      },
    ],
  },
];

export default function StyleguideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block tracking-tight">
                Frona Dashboard
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/styleguide"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Styleguide
              </Link>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 items-start px-4 md:px-8 md:gap-6 lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block md:w-[220px] lg:w-[240px]">
          <ScrollArea className="h-full py-6 pr-6 lg:py-8">
            <div className="w-full">
              {sidebarNavItems.map((group, index) => (
                <div key={index} className="pb-6">
                  <h4 className="mb-2 rounded-md px-2 py-1 text-sm font-semibold tracking-tight">
                    {group.title}
                  </h4>
                  {group.items?.length ? (
                    <div className="grid grid-flow-row auto-rows-max text-sm">
                      {group.items.map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:underline text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className="relative py-6 lg:py-8 w-full min-w-0">
          <div className="mx-auto w-full max-w-3xl 2xl:max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
