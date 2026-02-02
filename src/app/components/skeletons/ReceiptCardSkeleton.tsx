import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export const ReceiptCardSkeleton: React.FC = () => {
    return (
        <Card className="overflow-hidden">
            {/* Image Skeleton */}
            <div className="aspect-video relative bg-muted">
                <Skeleton className="w-full h-full" />
                <div className="absolute top-2 left-2 flex gap-1">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>
            </div>

            {/* Card Header */}
            <CardHeader>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </CardHeader>

            {/* Card Content */}
            <CardContent>
                <div className="space-y-3">
                    {/* Amount and Actions */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-20" />
                        <div className="flex gap-1">
                            <Skeleton className="w-8 h-8 rounded" />
                            <Skeleton className="w-8 h-8 rounded" />
                        </div>
                    </div>

                    {/* Category and Status */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>

                    {/* Date */}
                    <Skeleton className="h-4 w-28" />

                    {/* Uploaded by */}
                    <Skeleton className="h-4 w-32" />

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};