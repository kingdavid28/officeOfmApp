import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    User,
    Users,
    Building,
    Settings,
    Eye,
    ChevronDown,
    Check
} from 'lucide-react';
import { ReceiptViewScope } from '../../lib/user-preferences';

interface ReceiptViewScopeSelectorProps {
    currentScope: ReceiptViewScope;
    userRole: 'staff' | 'admin' | 'super_admin';
    onScopeChange: (scope: ReceiptViewScope) => void;
    onSetAsDefault?: (scope: ReceiptViewScope) => void;
    showSetAsDefault?: boolean;
    compact?: boolean;
    className?: string;
}

export const ReceiptViewScopeSelector: React.FC<ReceiptViewScopeSelectorProps> = ({
    currentScope,
    userRole,
    onScopeChange,
    onSetAsDefault,
    showSetAsDefault = false,
    compact = false,
    className = ''
}) => {
    const getScopeIcon = (scope: ReceiptViewScope) => {
        switch (scope) {
            case 'personal': return <User className="w-4 h-4" />;
            case 'team': return <Users className="w-4 h-4" />;
            case 'all': return <Building className="w-4 h-4" />;
        }
    };

    const getScopeLabel = (scope: ReceiptViewScope) => {
        switch (scope) {
            case 'personal': return 'My Expenses';
            case 'team': return 'Team Expenses';
            case 'all': return 'All Expenses';
        }
    };

    const getScopeDescription = (scope: ReceiptViewScope) => {
        switch (scope) {
            case 'personal': return 'Only your personal receipts';
            case 'team': return 'Only receipts from your assigned staff';
            case 'all': return 'Your receipts + assigned staff receipts';
        }
    };

    const getAvailableScopes = (): ReceiptViewScope[] => {
        switch (userRole) {
            case 'staff':
                return ['personal']; // Staff can only see their own
            case 'admin':
                return ['personal', 'team', 'all']; // Admin has all options
            case 'super_admin':
                return ['all']; // Super admin sees everything (could add organization-wide scopes later)
            default:
                return ['personal'];
        }
    };

    const availableScopes = getAvailableScopes();

    // If user only has one option, don't show selector
    if (availableScopes.length <= 1) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Badge variant="outline" className="flex items-center gap-1">
                    {getScopeIcon(currentScope)}
                    {getScopeLabel(currentScope)}
                </Badge>
            </div>
        );
    }

    if (compact) {
        return (
            <Select value={currentScope} onValueChange={onScopeChange}>
                <SelectTrigger className={`w-auto min-w-[140px] ${className}`}>
                    <div className="flex items-center gap-2">
                        {getScopeIcon(currentScope)}
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {availableScopes.map((scope) => (
                        <SelectItem key={scope} value={scope}>
                            <div className="flex items-center gap-2">
                                {getScopeIcon(scope)}
                                <span>{getScopeLabel(scope)}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        {getScopeIcon(currentScope)}
                        {getScopeLabel(currentScope)}
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Scope
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {availableScopes.map((scope) => (
                        <DropdownMenuItem
                            key={scope}
                            onClick={() => onScopeChange(scope)}
                            className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                            <div className="flex items-center gap-2 flex-1">
                                {getScopeIcon(scope)}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{getScopeLabel(scope)}</span>
                                        {currentScope === scope && (
                                            <Check className="w-4 h-4 text-green-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {getScopeDescription(scope)}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}

                    {showSetAsDefault && onSetAsDefault && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onSetAsDefault(currentScope)}
                                className="flex items-center gap-2 text-blue-600"
                            >
                                <Settings className="w-4 h-4" />
                                Set as Default View
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};