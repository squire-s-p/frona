"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType<any>;
    color?: string;
    theme?: Record<"light" | "dark", string>;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: any) {
  const key =
    payload?.dataKey ??
    payload?.name ??
    payload?.payload?.dataKey ??
    payload?.payload?.name;

  if (!key) return null;
  return { key, item: config[key] };
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  // CSS vars for series colors: --color-<key>
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, item] of Object.entries(config)) {
      if (item?.color) vars[`--color-${key}`] = item.color;
    }
    return vars as React.CSSProperties;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart
        className={cn("w-full", className)}
        style={style}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children as any}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip({
  className,
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return (
    <RechartsPrimitive.Tooltip
      {...props}
      wrapperClassName={cn("!outline-none", className)}
    />
  );
}

export function ChartTooltipContent({
  className,
  indicator = "dot",
  hideLabel = false,
  labelFormatter,
  formatter,
  ...props
}: React.ComponentProps<"div"> & {
  indicator?: "dot" | "line";
  hideLabel?: boolean;
  labelFormatter?: (value: any) => React.ReactNode;
  formatter?: (value: any, name: any, item: any, index: number) => React.ReactNode;
} & {
  active?: boolean;
  payload?: any[];
  label?: any;
}) {
  const { config } = useChart();

  const active = (props as any).active;
  const payload = (props as any).payload ?? [];
  const label = (props as any).label;

  if (!active || !payload?.length) return null;

  const renderedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-xl border bg-popover p-3 text-popover-foreground shadow-md",
        className
      )}
    >
      {!hideLabel && renderedLabel ? (
        <div className="mb-2 text-xs text-muted-foreground">{renderedLabel}</div>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((item: any, index: number) => {
          const cfg = getPayloadConfigFromPayload(config, item);
          const key = cfg?.key ?? item.dataKey ?? item.name;
          const c = cfg?.item;

          const color =
            item?.color ??
            item?.stroke ??
            (key ? `var(--color-${key})` : "currentColor");

          const name =
            c?.label ??
            item?.name ??
            item?.dataKey ??
            "—";

          const value = item?.value;

          const custom = formatter?.(value, key, item, index);
          // formatter може повернути [value, label] як у shadcn-прикладах
          let right: React.ReactNode = value;
          let left: React.ReactNode = name;

          if (Array.isArray(custom)) {
            right = custom[0];
            left = custom[1] ?? left;
          } else if (custom != null) {
            right = custom;
          }

          return (
            <div key={`${key}-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {indicator === "line" ? (
                  <span
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: color as any }}
                  />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: color as any }}
                  />
                )}
                <span className="text-sm">{left}</span>
              </div>

              <div className="text-sm font-medium tabular-nums">{right}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegend({
  className,
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Legend>) {
  return (
    <RechartsPrimitive.Legend
      {...props}
      wrapperStyle={{ paddingTop: 12 }}
      className={cn(className)}
    />
  );
}

export function ChartLegendContent({
  className,
  ...props
}: React.ComponentProps<"div"> & {
  payload?: any[];
}) {
  const { config } = useChart();
  const payload = (props as any).payload ?? [];

  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item: any) => {
        const cfg = getPayloadConfigFromPayload(config, item);
        const key = cfg?.key ?? item.dataKey ?? item.value;
        const c = cfg?.item;

        const color =
          item?.color ??
          item?.stroke ??
          (key ? `var(--color-${key})` : "currentColor");

        const label =
          c?.label ??
          item?.value ??
          item?.dataKey ??
          "—";

        return (
          <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: color as any }} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
