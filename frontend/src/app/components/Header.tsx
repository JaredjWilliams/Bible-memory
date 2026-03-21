import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="flex justify-between items-center border-b bg-background relative z-[102] w-full">
      <div className="w-full max-w-7xl mx-auto px-4 py-2 md:py-4">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            <span className="font-semibold text-sm md:text-base lg:text-lg">Bible Memory</span>
          </Link>

          {/* Desktop Navigation - flex max-md:hidden for Edge compatibility (avoids hidden+md:flex specificity issues) */}
          <nav className="flex max-md:hidden items-center gap-2 shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/read">
                  <Button variant="ghost">Read</Button>
                </Link>
                <Link to="/collections">
                  <Button variant="ghost">Collections</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user.username}</span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 relative z-[103] ml-auto"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
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
                        Collections
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