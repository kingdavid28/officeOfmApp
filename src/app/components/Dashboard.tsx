import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { ListChecks, Receipt, FolderOpen, Users, Settings, Shield } from 'lucide-react';
import { RealAdminPanel } from './RealAdminPanel';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { userProfile } = useAuth();

  // If userProfile is not loaded yet, show skeleton loading
  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin panel for admin and super_admin users
  if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
    return (
      <RealAdminPanel
        currentUserUid={userProfile.uid}
        userRole={userProfile.role}
      />
    );
  }

  // Regular staff dashboard
  const stats = [
    {
      title: 'My Tasks',
      value: 0,
      icon: ListChecks,
      onClick: () => onNavigate('tasks')
    },
    {
      title: 'My Receipts',
      value: 0,
      icon: Receipt,
      onClick: () => onNavigate('receipts')
    },
    {
      title: 'Files',
      value: 0,
      icon: FolderOpen,
      onClick: () => onNavigate('files')
    },
    {
      title: 'Directory',
      value: 0,
      icon: Users,
      onClick: () => onNavigate('employees')
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {userProfile?.name}!
          <span className="ml-2 inline-flex items-center gap-1">
            <Shield className="h-4 w-4" />
            {userProfile?.role}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Welcome to the Office Management System. Use the navigation menu to access your tasks, receipts, and files.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}