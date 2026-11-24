import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cream-200 text-navy-900 flex items-center justify-center mx-auto border border-cream-300 shadow-sm">
          <AlertCircle className="w-8 h-8 text-coral-500" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 bg-cream-200 px-3 py-1 rounded-full border border-cream-300">
            HTTP 404 Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
            The screen or resource you requested does not exist or has been relocated in the Gatherly routing map.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Home
            </Button>
          </Link>
          <Link to="/search">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Discover Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
