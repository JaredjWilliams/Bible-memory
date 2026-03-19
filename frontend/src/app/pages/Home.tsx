import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Memorize Scripture Through Typing
          </h1>
          <p className="text-xl text-gray-600">
            Build collections of Bible verses, practice typing them with real-time
            feedback, and review verses with spaced repetition.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          {user ? (
            <Button size="lg" onClick={() => navigate('/read')}>
              Go to Bible Reader
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <>
              <Link to="/signup">
                <Button size="lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12">
          <div className="space-y-2">
            <div className="text-blue-600 font-semibold">Organize</div>
            <h3 className="font-semibold">Create Collections</h3>
            <p className="text-sm text-gray-600">
              Group verses by topic, chapter, or study plan
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-blue-600 font-semibold">Practice</div>
            <h3 className="font-semibold">Type to Memorize</h3>
            <p className="text-sm text-gray-600">
              Real-time feedback shows correct and incorrect characters
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-blue-600 font-semibold">Review</div>
            <h3 className="font-semibold">Spaced Repetition</h3>
            <p className="text-sm text-gray-600">
              Review verses when they're due to maximize retention
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}