import { SearchX, Home } from 'lucide-react';

interface NotFoundProps {
  title?: string;
  message?: string;
  onGoHome?: () => void;
}

export function NotFound({ 
  title = 'Not Found',
  message = "We couldn't find what you're looking for.",
  onGoHome
}: NotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-12 h-12 text-gray-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {message}
        </p>

        {onGoHome && (
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
}