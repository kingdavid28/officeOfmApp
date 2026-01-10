import React from 'react';
import { Toast } from '../hooks/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    const getBackgroundColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (toast.type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'warning':
                return 'text-yellow-800';
            case 'info':
                return 'text-blue-800';
        }
    };

    return (
        <div className={`max-w-sm w-full ${getBackgroundColor()} border rounded-lg shadow-lg p-4 mb-3 animate-in slide-in-from-right duration-300`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className={`text-sm font-medium ${getTextColor()}`}>
                        {toast.title}
                    </p>
                    {toast.message && (
                        <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
                            {toast.message}
                        </p>
                    )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        className={`inline-flex ${getTextColor()} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded`}
                        onClick={() => onRemove(toast.id)}
                    >
                        <span className="sr-only">Close</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};