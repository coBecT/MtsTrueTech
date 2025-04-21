import React, { useState } from 'react';
import ExperimentList from '../components/ExperimentList';
import ExperimentForm from '../components/ExperimentForm';
import SearchBar from '../components/SearchBar';
import { Plus, X } from 'lucide-react';

const HomePage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">Исследования и эксперименты</h1>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Новый эксперимент
        </button>
      </div>
      
      <SearchBar onSearch={handleSearch} />
      
      {showForm ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h2 className="text-xl font-bold">Новый эксперимент</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <ExperimentForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      ) : null}
      
      <ExperimentList searchQuery={searchQuery} />
    </div>
  );
};

export default HomePage;