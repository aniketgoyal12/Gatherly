import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-cream-100">
      <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-coral-50 text-coral-600 flex items-center justify-center mx-auto border border-coral-200 shadow-sm animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-coral-600 bg-coral-50 px-3 py-1 rounded-full border border-coral-200">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-navy-700 leading-relaxed">
            You do not possess the required role permissions to view or interact with this workspace.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
          <Link to="/">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Public Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
