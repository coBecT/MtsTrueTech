import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-gray-300 mb-8">Страница не найдена</p>
      <Link 
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
      >
        <Home className="h-5 w-5 mr-2" />
        На главную
      </Link>
    </div>
  );
};

export default NotFound;