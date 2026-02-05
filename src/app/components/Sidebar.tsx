import React from 'react';
import { cn } from './ui/utils';
import { LayoutDashboard, ListChecks, Receipt, FolderOpen, Users, MessageCircle, Brain, DollarSign, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import logoImage from '../../assets/bb626b016a1517c6cfff6c8c45abb0b9ac8e523c.png';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { name: 'Organization', view: 'organization', icon: Building2 },
  { name: 'Finance', view: 'finance', icon: DollarSign },
  { name: 'AI Assistant', view: 'ai-assistant', icon: Brain },
  { name: 'Tasks', view: 'tasks', icon: ListChecks },
  { name: 'Receipts', view: 'receipts', icon: Receipt },
  { name: 'Files', view: 'files', icon: FolderOpen },
  { name: 'Employees', view: 'employees', icon: Users },
  { name: 'Messages', view: 'messaging', icon: MessageCircle },
];

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <img
              src={logoImage}
              alt="Province Logo"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">San Antonio</span>
              <span className="text-xs text-muted-foreground">de Padua</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                  onClick={() => {
                    onViewChange(item.view);
                    onClose();
                  }}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground text-center">
              Philippines Province
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
