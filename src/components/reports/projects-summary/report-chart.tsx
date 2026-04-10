"use client";

import * as React from "react";
import { Bar, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { ProjectSummaryItem } from "@/app/dashboard/reports/actions";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Monochrome Palette (Shadcn style - using foreground with color-mix for visibility)
const MONOCHROME_PALETTE = [
  "var(--foreground)",
  "color-mix(in oklch, var(--foreground), transparent 20%)",
  "color-mix(in oklch, var(--foreground), transparent 40%)",
  "color-mix(in oklch, var(--foreground), transparent 60%)",
  "var(--muted-foreground)",
  "color-mix(in oklch, var(--muted-foreground), transparent 20%)",
  "color-mix(in oklch, var(--muted-foreground), transparent 40%)",
  "color-mix(in oklch, var(--muted-foreground), transparent 60%)",
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} год ${m} хв`;
}

export default function ReportChart({
  data,
  hoveredProjectId,
  onHoverAction
}: {
  data: ProjectSummaryItem[];
  hoveredProjectId: string | null;
  onHoverAction: (id: string | null) => void;
}) {
  const [chartType, setChartType] = React.useState<"pie" | "bar">("pie");
  const totalSeconds = React.useMemo(() => data.reduce((acc, curr) => acc + curr.totalDuration, 0), [data]);

  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      project: item.projectName,
      duration: item.totalDuration,
      fill: MONOCHROME_PALETTE[index % MONOCHROME_PALETTE.length],
    }));
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      duration: {
        label: "Час",
      },
    };
    data.forEach((item, index) => {
      config[item.projectName] = {
        label: item.projectName,
        color: MONOCHROME_PALETTE[index % MONOCHROME_PALETTE.length],
      };
    });
    return config;
  }, [data]);

  if (totalSeconds === 0) {
    return (
      <Card className="flex flex-col h-[400px] items-center justify-center border-dashed">
        <div className="flex flex-col items-center gap-2 text-center p-6">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Немає даних</CardTitle>
          <CardDescription>Спробуйте інший період або змініть фільтри</CardDescription>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div className="space-y-1">
          <CardTitle>Візуалізація часу</CardTitle>
          <CardDescription>Розподіл часу по проєктам</CardDescription>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={chartType === "pie" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setChartType("pie")}
          >
            <PieIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={chartType === "bar" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-video max-h-[400px] w-full"
        >
          {chartType === "pie" ? (
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel formatter={(value) => formatDuration(Number(value))} />}
              />
              <Pie
                data={chartData}
                dataKey="duration"
                nameKey="project"
                innerRadius={80}
                outerRadius={130}
                strokeWidth={2}
                stroke="var(--background)"
                onMouseEnter={(_, index) => onHoverAction(data[index].projectId)}
                onMouseLeave={() => onHoverAction(null)}
              >
                {chartData.map((entry, index) => (
                  <Sector
                    key={`sector-${index}`}
                    {...entry}
                    fillOpacity={hoveredProjectId === null || hoveredProjectId === data[index].projectId ? 1 : 0.3}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                            textAnchor="middle"
                          >
                            {formatDuration(totalSeconds)}
                          </text>
                          <text
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-xs"
                            textAnchor="middle"
                          >
                            Всього
                          </text>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent />}
                className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center mt-6"
                verticalAlign="bottom"
              />
            </PieChart>
          ) : (
            <ReBarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="project"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel formatter={(value) => formatDuration(Number(value))} />}
              />
              <Bar
                dataKey="duration"
                radius={[0, 4, 4, 0]}
                barSize={32}
              />
            </ReBarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
