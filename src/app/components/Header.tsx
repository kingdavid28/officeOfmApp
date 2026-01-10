import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../../lib/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { userProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't render header if userProfile is not loaded
  if (!userProfile) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-semibold">
              Province of San Antonio de Padua
            </h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-semibold">
            Province of San Antonio de Padua
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback>
                  {userProfile ? getInitials(userProfile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {userProfile?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
