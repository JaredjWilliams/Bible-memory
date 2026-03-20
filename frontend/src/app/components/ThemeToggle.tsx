'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
type ThemeToggleVariant = 'dropdown' | 'inline';

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
}

export function ThemeToggle({ variant = 'dropdown' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  if (!mounted) {
    return variant === 'inline' ? (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="flex-1">
          <Sun className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Monitor className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Moon className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <Button variant="ghost" size="icon" className="size-9" aria-label="Theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex gap-1" role="group" aria-label="Theme">
        <Button
          variant={theme === 'light' ? 'secondary' : 'outline'}
          size="sm"
          className="flex-1 min-w-0"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'system' ? 'secondary' : 'outline'}
          size="sm"
          className="flex-1 min-w-0"
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'dark' ? 'secondary' : 'outline'}
          size="sm"
          className="flex-1 min-w-0"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
        >
          <Moon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const Icon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      aria-label="Toggle theme"
      onClick={handleToggleTheme}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
