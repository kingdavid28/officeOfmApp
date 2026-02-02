import React from 'react';
import { Skeleton } from '../ui/skeleton';

interface ModalSkeletonProps {
    title?: boolean;
    fields?: number;
    buttons?: boolean;
}

export const ModalSkeleton: React.FC<ModalSkeletonProps> = ({
    title = true,
    fields = 3,
    buttons = true
}) => {
    return (
        <div className="space-y-6">
            {/* Modal Header */}
            {title && (
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            )}

            {/* Modal Content */}
            <div className="space-y-4">
                {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>

            {/* Modal Buttons */}
            {buttons && (
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-24" />
                </div>
            )}
        </div>
    );
};