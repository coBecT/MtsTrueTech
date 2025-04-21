import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Beaker, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { mockExperiments } from '../data/mockData';

interface ExperimentListProps {
  searchQuery: string;
}

const ExperimentList: React.FC<ExperimentListProps> = ({ searchQuery }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const toggleExpand = (id: string) => {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter(item => item !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  };
  
  const filteredExperiments = mockExperiments.filter(experiment => 
    experiment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    experiment.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredExperiments.length > 0 ? (
        filteredExperiments.map(experiment => (
          <div key={experiment.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => toggleExpand(experiment.id)}
            >
              <h3 className="text-lg font-medium text-white">{experiment.title}</h3>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
                  experiment.status === 'В процессе' ? 'bg-blue-500 text-white' :
                  experiment.status === 'Завершен' ? 'bg-green-500 text-white' :
                  experiment.status === 'Приостановлен' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {experiment.status}
                </span>
                {expandedItems.includes(experiment.id) ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </div>
            </div>
            
            {expandedItems.includes(experiment.id) && (
              <div className="p-4 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Цель</h4>
                    <p className="text-sm text-white">{experiment.goal}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Гипотеза</h4>
                    <p className="text-sm text-white">{experiment.hypothesis}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="text-xs font-medium text-gray-400">Сроки</h4>
                      <p className="text-sm text-white">{experiment.timeline}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Beaker className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="text-xs font-medium text-gray-400">Оборудование</h4>
                      <p className="text-sm text-white">{experiment.equipment}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="text-xs font-medium text-gray-400">Бюджет</h4>
                      <p className="text-sm text-white">{experiment.budget}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-4">
                  <span className="text-xs text-gray-400 flex items-center mr-4">
                    <Clock className="h-4 w-4 mr-1" />
                    Последнее изменение: {experiment.lastModified}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Link 
                      to={`/experiment/${experiment.id}`}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Подробнее
                    </Link>
                    <button 
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                    >
                      Взять для сравнения
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Эксперименты не найдены</p>
        </div>
      )}
    </div>
  );
};

export default ExperimentList;