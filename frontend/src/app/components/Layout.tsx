import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

export function Layout() {
  const location = useLocation();
  const isTypingPractice = /\/collections\/[^/]+\/practice$/.test(location.pathname);
  const isSignup = location.pathname === '/signup';
  const isLogin = location.pathname === '/login';

  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen flex flex-col">
          <div className={isSignup || isLogin ? 'hidden' : isTypingPractice ? 'hidden md:block' : undefined}>
            <Header />
          </div>
          <main className="flex-1 flex flex-col min-h-0">
            <Outlet />
          </main>
          <Footer />
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
