import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import { mockExperiments } from '../data/mockData';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const ComparisonPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'timeline', 'resources']);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const toggleExperimentSelection = (id: string) => {
    if (selectedExperiments.includes(id)) {
      setSelectedExperiments(selectedExperiments.filter(expId => expId !== id));
    } else {
      if (selectedExperiments.length < 2) {
        setSelectedExperiments([...selectedExperiments, id]);
      }
    }
  };
  
  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(s => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };
  
  const filteredExperiments = mockExperiments.filter(experiment => 
    experiment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    experiment.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedExperimentData = mockExperiments.filter(exp => selectedExperiments.includes(exp.id));
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Сравнение экспериментов</h1>
      
      {selectedExperiments.length < 2 ? (
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Выберите два эксперимента для сравнения ({selectedExperiments.length}/2 выбрано)
          </p>
          
          <SearchBar onSearch={handleSearch} />
          
          <div className="grid grid-cols-1 gap-4 mt-4">
            {filteredExperiments.map(experiment => (
              <div 
                key={experiment.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedExperiments.includes(experiment.id) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                onClick={() => toggleExperimentSelection(experiment.id)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{experiment.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedExperiments.includes(experiment.id) 
                      ? 'bg-white text-blue-600' 
                      : experiment.status === 'В процессе' ? 'bg-blue-500 text-white' :
                        experiment.status === 'Завершен' ? 'bg-green-500 text-white' :
                        experiment.status === 'Приостановлен' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                  }`}>
                    {experiment.status}
                  </span>
                </div>
                <p className="text-sm mt-2 truncate">
                  {selectedExperiments.includes(experiment.id) 
                    ? 'Выбрано для сравнения'
                    : `Цель: ${experiment.goal}`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setSelectedExperiments([])}
              className="flex items-center text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Выбрать другие эксперименты
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div 
              className="p-4 border-b border-gray-700 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('basic')}
            >
              <h3 className="font-medium text-lg text-white">Основная информация</h3>
              {expandedSections.includes('basic') ? 
                <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.includes('basic') && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div></div>
                  {selectedExperimentData.map(exp => (
                    <div key={exp.id} className="text-center">
                      <h4 className="font-medium text-white">{exp.title}</h4>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        exp.status === 'В процессе' ? 'bg-blue-500 text-white' :
                        exp.status === 'Завершен' ? 'bg-green-500 text-white' :
                        exp.status === 'Приостановлен' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-gray-400">Цель</div>
                    {selectedExperimentData.map(exp => (
                      <div key={exp.id} className="text-white text-sm">{exp.goal}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-gray-400">Гипотеза</div>
                    {selectedExperimentData.map(exp => (
                      <div key={exp.id} className="text-white text-sm">{exp.hypothesis}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div 
              className="p-4 border-b border-gray-700 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('timeline')}
            >
              <h3 className="font-medium text-lg text-white">Сроки</h3>
              {expandedSections.includes('timeline') ? 
                <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.includes('timeline') && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-400">Период</div>
                  {selectedExperimentData.map(exp => (
                    <div key={exp.id} className="text-white text-sm">{exp.timeline}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div 
              className="p-4 border-b border-gray-700 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection('resources')}
            >
              <h3 className="font-medium text-lg text-white">Ресурсы</h3>
              {expandedSections.includes('resources') ? 
                <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.includes('resources') && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-gray-400">Оборудование</div>
                  {selectedExperimentData.map(exp => (
                    <div key={exp.id} className="text-white text-sm">{exp.equipment}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-400">Бюджет</div>
                  {selectedExperimentData.map(exp => (
                    <div key={exp.id} className="text-white text-sm">{exp.budget}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;