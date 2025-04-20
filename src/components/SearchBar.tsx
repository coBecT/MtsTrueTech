import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };
  
  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Введите Ваш запрос"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={clearSearch}
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-600 rounded-lg border border-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800"
        >
          <Search className="w-5 h-5" />
          <span className="sr-only">Search</span>
        </button>
      </form>
    </div>
  );
};

export default SearchBar;