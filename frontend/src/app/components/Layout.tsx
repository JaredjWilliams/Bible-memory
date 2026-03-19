import { Outlet } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

export function Layout() {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
