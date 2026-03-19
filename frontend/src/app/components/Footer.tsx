import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-6">
      <div className="container mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
        <div className="space-y-2">
          <p>
            Scripture quotations are from the ESV® Bible (The Holy Bible, English
            Standard Version®)
          </p>
          <Link to="/copyright" className="text-blue-600 hover:underline">
            View Full Copyright Information
          </Link>
        </div>
      </div>
    </footer>
  );
}
