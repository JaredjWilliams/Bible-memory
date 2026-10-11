import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from './ui/utils';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const readActive = pathname === '/read' || pathname.startsWith('/read/');
  const memorizeActive = pathname === '/collections' || pathname.startsWith('/collections/');

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        '--app-header-height',
        `${header.offsetHeight}px`,
      );
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--app-header-height');
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinkClass = (active: boolean) =>
    cn('h-9 px-3', active && 'bg-accent text-accent-foreground');

  return (
    <header ref={headerRef} className="border-b bg-background relative z-[102]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex size-8 items-center justify-center rounded-md bg-blue-600/15 text-blue-600">
              <BookOpen className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Bible Memory</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Desktop Navigation - flex max-md:hidden for Edge compatibility (avoids hidden+md:flex specificity issues) */}
            <nav className="flex max-md:hidden items-center">
              {user ? (
                <>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" asChild className={navLinkClass(readActive)}>
                      <Link to="/read">Read</Link>
                    </Button>
                    <Button variant="ghost" asChild className={navLinkClass(memorizeActive)}>
                      <Link to="/collections">Memorize</Link>
                    </Button>
                  </div>
                  <div className="mx-3 h-5 w-px bg-border" aria-hidden="true" />
                  <div className="flex items-center gap-2">
                    <span className="px-1 text-sm text-muted-foreground">{user.username}</span>
                    <ThemeToggle />
                    <Button variant="outline" className="h-9 px-3" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button variant="ghost" asChild className="h-9 px-3">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="h-9 px-3">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </nav>

            <button
              className="md:hidden inline-flex size-9 items-center justify-center rounded-md relative z-[103]"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
              className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg"
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle variant="inline" />
                </div>
                {user ? (
                  <>
                    <Link to="/read" onClick={closeMobileMenu} className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Read
                      </Button>
                    </Link>
                    <Link to="/collections" onClick={closeMobileMenu} className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Memorize
                      </Button>
                    </Link>
                    <div className="px-3 py-2 text-sm text-muted-foreground border-t mt-2 pt-2">
                      Logged in as {user.username}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobileMenu} className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={closeMobileMenu} className="block">
                      <Button className="w-full justify-start">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}