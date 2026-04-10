"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { getNoteGraph } from "@/app/dashboard/notes/actions";
import { useRouter } from "next/navigation";
import { Loader2, Network, Settings, ChevronDown, ChevronRight, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Завантаження графа...
        </div>
    )
});

export function GraphView() {
    const { resolvedTheme } = useTheme();
    const router = useRouter();
    const [graphData, setGraphData] = React.useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const graphRef = React.useRef<any>(null);
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    // Graph Settings
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [isDisplayExpanded, setIsDisplayExpanded] = React.useState(true);
    const [isForcesExpanded, setIsForcesExpanded] = React.useState(false);

    const [showArrows, setShowArrows] = React.useState(false);
    const [textThreshold, setTextThreshold] = React.useState(0.8);
    const [nodeSize, setNodeSize] = React.useState(4);
    const [linkWidth, setLinkWidth] = React.useState(1);

    const [repulsion, setRepulsion] = React.useState(-400);
    const [linkStrength, setLinkStrength] = React.useState(0.5);
    const [linkDistance, setLinkDistance] = React.useState(100);

    React.useEffect(() => {
        const fetchGraph = async () => {
            try {
                const data = await getNoteGraph();
                setGraphData(data);
            } catch (error) {
                console.error("Failed to fetch graph:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGraph();
    }, []);

    const measure = React.useCallback(() => {
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            if (width > 0 && height > 0) {
                setDimensions({ width, height });
                return true;
            }
        }
        return false;
    }, []);

    React.useLayoutEffect(() => {
        let rafId: number;

        const poll = () => {
            if (!measure()) {
                rafId = requestAnimationFrame(poll);
            }
        };

        rafId = requestAnimationFrame(poll);

        const observer = new ResizeObserver(() => {
            measure();
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [measure]);

    React.useEffect(() => {
        if (graphRef.current) {
            const fg = graphRef.current;

            // Repulsion (Many-body)
            const charge = fg.d3Force("charge");
            if (charge) charge.strength(repulsion).distanceMax(1000);

            // Links
            const link = fg.d3Force("link");
            if (link) link.distance(linkDistance).strength(linkStrength);

            // Center
            const center = fg.d3Force("center");
            if (center) center.x(dimensions.width / 2).y(dimensions.height / 2);

            fg.d3ReheatSimulation();
        }
    }, [repulsion, linkDistance, linkStrength, dimensions]);

    const handleReheat = () => {
        if (graphRef.current) {
            graphRef.current.d3ReheatSimulation();
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-full bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
    );

    if (graphData.nodes.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 bg-background">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Network className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="text-center">
                <p className="text-sm font-medium">Граф порожній</p>
                <p className="text-xs text-zinc-400">Створіть декілька нотаток, щоб побачити їх тут.</p>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {dimensions.width > 0 && dimensions.height > 0 && (
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    width={dimensions.width}
                    height={dimensions.height}
                    d3VelocityDecay={0.5}
                    d3AlphaDecay={0.02}
                    nodeLabel="title"
                    nodeRelSize={nodeSize}
                    nodeColor={(node: any) => node.color || (resolvedTheme === "dark" ? "#52525b" : "#d4d4d8")}
                    linkColor={() => resolvedTheme === "dark" ? "#27272a" : "#e4e4e7"}
                    linkWidth={linkWidth}
                    linkDirectionalArrowLength={showArrows ? 3 : 0}
                    linkDirectionalArrowRelPos={1}
                    backgroundColor="transparent"
                    onNodeClick={(node: any) => router.push(`/dashboard/notes/${node.id}`)}
                    cooldownTicks={100}
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale) => {
                        const label = node.title || "Untitled";
                        const fontSize = 12 / globalScale;

                        // Draw Point
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color || (resolvedTheme === "dark" ? "#52525b" : "#d4d4d8");
                        ctx.fill();

                        // Label rendering
                        if (globalScale > textThreshold) {
                            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            // Background for label
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                            ctx.fillStyle = resolvedTheme === "dark" ? "rgba(9, 9, 11, 0.7)" : "rgba(255, 255, 255, 0.7)";
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (nodeSize * 2.5) - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                            ctx.fillStyle = resolvedTheme === "dark" ? "#e4e4e7" : "#18181b";
                            ctx.fillText(label, node.x, node.y + (nodeSize * 2.5));
                        }
                    }}
                />
            )}

            {/* Floating Settings Button */}
            <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 h-9 w-9 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-xl z-50 rounded-full"
                onClick={() => setSettingsOpen(!settingsOpen)}
            >
                <Settings className={cn("h-4 w-4 transition-transform duration-500", settingsOpen && "rotate-180")} />
            </Button>

            {/* Settings Panel */}
            <div className={cn(
                "absolute top-16 right-4 w-64 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl transition-all duration-300 z-40 overflow-hidden",
                settingsOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
            )}>
                <ScrollArea className="h-[calc(100vh-140px)]">
                    <div className="p-4 space-y-6">
                        {/* Display Section */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setIsDisplayExpanded(!isDisplayExpanded)}
                                className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-foreground transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isDisplayExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    Відображення
                                </div>
                            </button>

                            {isDisplayExpanded && (
                                <div className="space-y-5 pt-2 px-1 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Напрямок зв'язків</label>
                                        <Switch checked={showArrows} onCheckedChange={setShowArrows} />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Поріг зникнення тексту</label>
                                        </div>
                                        <Slider
                                            value={[textThreshold]}
                                            min={0}
                                            max={2}
                                            step={0.1}
                                            onValueChange={([v]) => setTextThreshold(v)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Розмір вузла</label>
                                        </div>
                                        <Slider
                                            value={[nodeSize]}
                                            min={1}
                                            max={10}
                                            step={0.5}
                                            onValueChange={([v]) => setNodeSize(v)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Товщина ліній</label>
                                        </div>
                                        <Slider
                                            value={[linkWidth]}
                                            min={0.1}
                                            max={5}
                                            step={0.1}
                                            onValueChange={([v]) => setLinkWidth(v)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleReheat}
                                        className="w-full h-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 gap-2"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        Анімувати
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-900" />

                        <div className="space-y-3">
                            <button
                                onClick={() => setIsForcesExpanded(!isForcesExpanded)}
                                className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-foreground transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isForcesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    Сили
                                </div>
                            </button>

                            {isForcesExpanded && (
                                <div className="space-y-5 pt-2 px-1 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Сила відштовхування</label>
                                        <Slider
                                            value={[repulsion]}
                                            min={-2000}
                                            max={0}
                                            step={20}
                                            onValueChange={([v]) => setRepulsion(v)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Сила зв'язку</label>
                                        <Slider
                                            value={[linkStrength]}
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            onValueChange={([v]) => setLinkStrength(v)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Відстань між вузлами</label>
                                        <Slider
                                            value={[linkDistance]}
                                            min={10}
                                            max={500}
                                            step={5}
                                            onValueChange={([v]) => setLinkDistance(v)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
