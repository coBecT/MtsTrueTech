import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockExperiments } from '../data/mockData';
import { 
  Calendar, 
  Clock, 
  Beaker, 
  DollarSign, 
  FileText, 
  ArrowLeft,
  Edit,
  BarChart
} from 'lucide-react';

const ExperimentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const experiment = mockExperiments.find(exp => exp.id === id);
  
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!experiment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-white mb-4">Эксперимент не найден</h2>
        <Link to="/" className="text-blue-400 hover:text-blue-300">
          Вернуться на главную
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад к списку
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-white mb-2 md:mb-0">{experiment.title}</h1>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              experiment.status === 'В процессе' ? 'bg-blue-500 text-white' :
              experiment.status === 'Завершен' ? 'bg-green-500 text-white' :
              experiment.status === 'Приостановлен' ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {experiment.status}
            </span>
            
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm flex items-center transition-colors">
              <Edit className="h-4 w-4 mr-1" />
              Редактировать
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Файлы
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Календарь
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Аналитика
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-4">Информация</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Цель</h3>
                  <p className="text-white mt-1">{experiment.goal}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Гипотеза</h3>
                  <p className="text-white mt-1">{experiment.hypothesis}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-4">Ресурсы</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Сроки</h3>
                    <p className="text-white mt-1">{experiment.timeline}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Beaker className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Оборудование</h3>
                    <p className="text-white mt-1">{experiment.equipment}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Бюджет</h3>
                    <p className="text-white mt-1">{experiment.budget}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">История изменений</h2>
            
            <div className="border-l-2 border-gray-700 pl-4 space-y-6">
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-500"></div>
                <div>
                  <h3 className="text-white font-medium">Эксперимент создан</h3>
                  <p className="text-sm text-gray-400 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    20.05.2025, 10:15
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Иванов И.И. инициировал эксперимент.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-yellow-500"></div>
                <div>
                  <h3 className="text-white font-medium">Изменение параметров</h3>
                  <p className="text-sm text-gray-400 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    22.05.2025, 14:30
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Петров П.П. обновил параметры эксперимента. Изменены: оборудование, сроки.
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-500"></div>
                <div>
                  <h3 className="text-white font-medium">Добавлены файлы</h3>
                  <p className="text-sm text-gray-400 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    23.05.2025, 09:45
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Сидоров С.С. прикрепил файлы: промежуточный_отчет.docx, данные.xlsx
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'files' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">Прикрепленные файлы</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md flex items-center transition-colors">
              <FileText className="h-4 w-4 mr-1" />
              Добавить файл
            </button>
          </div>
          
          {experiment.files && experiment.files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experiment.files.map((file, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center">
                  <FileText className="h-6 w-6 text-blue-400 mr-3" />
                  <div>
                    <p className="text-white">{file}</p>
                    <p className="text-xs text-gray-400">Добавлен: 23.05.2025</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Файлы не найдены</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'timeline' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Календарь эксперимента</h2>
          <p className="text-gray-400 text-center py-8">Интеграция с календарем TrueTabs</p>
        </div>
      )}
      
      {activeTab === 'analytics' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Аналитика</h2>
          <div className="text-center py-8">
            <BarChart className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Данные для аналитики не найдены</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentDetail;