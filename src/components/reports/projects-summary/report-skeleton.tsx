"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ReportSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="space-y-6 mb-6">
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-8 w-32 mb-2" />
                    <div className="flex justify-between items-center gap-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-9 w-[260px]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Chart Skeleton */}
            <Card>
                <CardHeader className="pb-0">
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card className="p-4">
                <div className="flex justify-between mb-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-9 w-64" />
                </div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </Card>
        </div>
    );
}
