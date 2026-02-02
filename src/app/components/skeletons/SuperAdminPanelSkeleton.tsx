import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export const SuperAdminPanelSkeleton: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>

            {/* Main Content Card */}
            <Card className="shadow">
                <CardHeader className="border-b">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-6 flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-36" />
                                </div>
                                <div className="flex space-x-2">
                                    <Skeleton className="h-10 w-20" />
                                    <Skeleton className="h-10 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Empty State Skeleton (when no pending users) */}
            <div className="text-center py-8">
                <Skeleton className="h-5 w-48 mx-auto" />
            </div>
        </div>
    );
};