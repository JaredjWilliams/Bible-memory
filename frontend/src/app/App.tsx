import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="bible-memory-theme"
    >
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
