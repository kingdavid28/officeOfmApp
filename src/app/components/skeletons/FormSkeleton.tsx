import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface FormSkeletonProps {
    title?: string;
    fields?: number;
    showButtons?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
    title = "Form",
    fields = 4,
    showButtons = true
}) => {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Info banner skeleton */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    </div>

                    {/* Form fields skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: fields }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>

                    {/* Warning banner skeleton */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Buttons skeleton */}
                    {showButtons && (
                        <div className="flex gap-2 pt-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};