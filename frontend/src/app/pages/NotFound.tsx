import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-16 sm:py-16">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="text-6xl font-bold text-gray-300">404</div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
