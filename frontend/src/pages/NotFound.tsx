
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-vault-primary mb-4">404</h1>
        <p className="text-2xl font-semibold mb-6">Page Not Found</p>
        <p className="text-gray-600 mb-8">
          We couldn't find the page you were looking for. It might have been removed, renamed, or doesn't exist.
        </p>
        <Button asChild className="bg-vault-primary hover:bg-vault-primary-dark">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
